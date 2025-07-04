import express, { Request, Response, NextFunction, response } from 'express';
import { PrismaClient, Seance, Medecin, Patient, SeanceType, Profession } from '@prisma/client';
import { connectToKeycloak, validateKeycloakToken } from '../utils/keycloak.js';
import KcAdminClient from '@keycloak/keycloak-admin-client';

const router = express.Router();
const prisma = new PrismaClient();
let kcAdminClient: KcAdminClient;

interface SeanceWithRelations extends Seance {
  medecin: Medecin;
  patient: Patient;
}

interface SeanceRequestBody {
  type: string;
  date: string | Date;
  patientId: string;
  medecinId: string;
}

// Helper function to get Keycloak user info
async function getKeycloakUserInfo(userId: string) {
  try {
    kcAdminClient = await connectToKeycloak();
    const user = await kcAdminClient.users.findOne({ id: userId });
    return user;
  } catch (error) {
    console.error('Error fetching Keycloak user:', error);
    return null;
  }
}

// Validation helper function for seance type and medecin profession
async function validateSeanceTypeWithMedecinProfession(type: SeanceType, medecinId: string): Promise<{ valid: boolean; message?: string }> {
  try {
    // Get the medecin to check their profession
    const medecin = await prisma.medecin.findUnique({
      where: { id: medecinId }
    });
    
    if (!medecin) {
      return { valid: false, message: "Médecin introuvable" };
    }
    
    // Validate based on seance type and medecin profession
    if (['DETARTRAGE', 'SURFACAGE', 'REEVALUATION'].includes(type) && medecin.profession !== 'PARODONTAIRE' as Profession) {
      return { 
        valid: false, 
        message: `Les séances de type ${type} ne peuvent être associées qu'à un médecin PARODENTAIRE`
      };
    }
    
    if (['ACTIVATION', 'RECOLLAGE'].includes(type) && medecin.profession !== ('ORTHODONTAIRE' as Profession)) {
      return { 
        valid: false, 
        message: `Les séances de type ${type} ne peuvent être associées qu'à un médecin ORTHODONTAIRE`
      };
    }
    
    return { valid: true };
  } catch (error) {
    console.error('Error validating seance type with medecin profession:', error);
    return { valid: false, message: "Erreur lors de la validation du type de séance et du médecin" };
  }
}

// GET all seances
router.get('/', validateKeycloakToken, async function(_req: Request, res: Response, _next: NextFunction) {
  try {
    const seances = await prisma.seance.findMany({
      include: {
        patient: true,
        medecin: {
          include:{
            user:true
          }
        }
      }
    });
    if (!Array.isArray(seances)) {
      throw new Error("Failed to fetch seances");
    }

    const seancesWithDetails = await Promise.all(seances.map(async (seance) => {
      const userInfo = await getKeycloakUserInfo(seance.medecin.userId);
      return {
        ...seance,
        medecin: {
          ...seance.medecin,
          userInfo,
        }
      };
    }));

    res.status(200).send(seancesWithDetails);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch seances" });
  } finally {
    await prisma.$disconnect();
  }
});

// GET a specific seance
router.get('/:id', validateKeycloakToken, async function(req: Request, res: Response, _next: NextFunction) {
  try {
    const seance: SeanceWithRelations | null = await prisma.seance.findUnique({
      where: { id: req.params.id },
      include: {
        patient: true,
        medecin: {
          include:{
            user: true
          }
        }
      }
    });
    if (seance) {
      // Fetch Keycloak user info for the medecin
      const medecinUserInfo = await getKeycloakUserInfo(seance.medecin.userId);
      const seanceWithUserInfo = {
        ...seance,
        medecin: {
          ...seance.medecin,
          userInfo: medecinUserInfo
        }
      };
      res.status(200).send(seanceWithUserInfo);
    } else {
      res.status(404).send({ error: "Seance not found" });
    }
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to fetch seance" });
  } finally {
    await prisma.$disconnect();
  }
});

// POST a new seance
router.post('/', validateKeycloakToken, async function(req: Request<{}, {}, SeanceRequestBody>, res: Response, _next: NextFunction) {
  try {
    // Validate seance type and medecin profession compatibility
    const validationResult = await validateSeanceTypeWithMedecinProfession(
      req.body.type as SeanceType,
      req.body.medecinId
    );
    
    if (!validationResult.valid) {
      res.status(400).send({ error: validationResult.message });
      return;
    }
    
    const newSeance: SeanceWithRelations = await prisma.seance.create({
      data: {
        type: req.body.type as SeanceType,
        date: new Date(req.body.date),
        patient: {
          connect: { id: req.body.patientId }
        },
        medecin: {
          connect: { id: req.body.medecinId }
        }
      },
      include: {
        patient: true,
        medecin: true
      }
    });

    // Fetch Keycloak user info for the medecin
    const medecinUserInfo = await getKeycloakUserInfo(newSeance.medecin.userId);
    const seanceWithUserInfo = {
      ...newSeance,
      medecin: {
        ...newSeance.medecin,
        userInfo: medecinUserInfo
      }
    };
    
    res.status(201).send(seanceWithUserInfo);
    return;
  
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to create seance" });
    return;
  } finally {
    await prisma.$disconnect();
  }
});

// PUT to update a specific seance
router.put('/:id', validateKeycloakToken, async function(req: Request<{id: string}, {}, Partial<SeanceRequestBody>>, res: Response, _next: NextFunction) {
  try {
    // If both type and medecinId are being updated, validate them together
    if (req.body.type && req.body.medecinId) {
      const validationResult = await validateSeanceTypeWithMedecinProfession(
        req.body.type as SeanceType,
        req.body.medecinId
      );
      
      if (!validationResult.valid) {
        res.status(400).send({ error: validationResult.message });
      }
    } 
    // If only the type is changing, validate it with the existing medecin
    else if (req.body.type) {
      const existingSeance = await prisma.seance.findUnique({
        where: { id: req.params.id },
        include: { medecin: true }
      });
      
      if (existingSeance) {
        const validationResult = await validateSeanceTypeWithMedecinProfession(
          req.body.type as SeanceType,
          existingSeance.medecinId
        );
        
        if (!validationResult.valid) {
          res.status(400).send({ error: validationResult.message });
        }
      }
    }
    // If only the medecin is changing, validate it with the existing type
    else if (req.body.medecinId) {
      const existingSeance = await prisma.seance.findUnique({
        where: { id: req.params.id }
      });
      
      if (existingSeance) {
        const validationResult = await validateSeanceTypeWithMedecinProfession(
          existingSeance.type,
          req.body.medecinId
        );
        
        if (!validationResult.valid) {
          res.status(400).send({ error: validationResult.message });
        }
      }
    }
    
    const updatedSeance = await prisma.seance.update({
      where: { id: req.params.id },
      data: {
        type: req.body.type as SeanceType,
        date: req.body.date ? new Date(req.body.date) : undefined,
        patient: req.body.patientId ? {
          connect: { id: req.body.patientId }
        } : undefined,
        medecin: req.body.medecinId ? {
          connect: { id: req.body.medecinId }
        } : undefined
      },
      include: {
        patient: true,
        medecin: true
      }
    }) as SeanceWithRelations;

    // Fetch Keycloak user info for the medecin
    const medecinUserInfo = await getKeycloakUserInfo(updatedSeance.medecin.userId);
    const seanceWithUserInfo = {
      ...updatedSeance,
      medecin: {
        ...updatedSeance.medecin,
        userInfo: medecinUserInfo
      }
    };
    
    res.status(200).send(seanceWithUserInfo);
    return;

  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to update seance" });
    return;

  } finally {
    await prisma.$disconnect();
  }
});

// DELETE a specific seance
router.delete('/:id', validateKeycloakToken, async function(req: Request, res: Response, _next: NextFunction) {
  try {
    await prisma.seance.delete({
      where: { id: req.params.id }
    });
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Failed to delete seance" });
  } finally {
    await prisma.$disconnect();
  }
});



export default router;