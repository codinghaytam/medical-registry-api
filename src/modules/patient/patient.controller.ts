import { Request, Response } from 'express';
import { PatientService } from './patient.service.js';

export class PatientController {
  constructor(private readonly service = new PatientService()) { }

  getPatients = async (req: Request, res: Response) => {
    // Cast req to any to access dbUser attached by validateRole middleware
    const user = (req as any).dbUser;
    const patients = await this.service.list(user);
    res.status(200).json(patients);
  };

  getPatient = async (req: Request, res: Response) => {
    const patient = await this.service.getById(req.params.id as string);
    res.status(200).json(patient);
  };

  createPatient = async (req: Request, res: Response) => {
    const patient = await this.service.create(req.body);
    res.status(201).json(patient);
  };

  updatePatient = async (req: Request, res: Response) => {
    const patient = await this.service.update(req.params.id as string, req.body);
    res.status(200).json(patient);
  };

  deletePatient = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);
    res.status(204).send();
  };

  transferParoToOrtho = async (req: Request, res: Response) => {
    const patient = await this.service.transferParoToOrtho(req.params.id as string, req.body.medecinId);
    res.status(200).json({ message: 'Patient transferred to Orthodontic service', patient });
  };

  transferOrthoToParo = async (req: Request, res: Response) => {
    const patient = await this.service.transferOrthoToParo(req.params.id as string, req.body.medecinId);
    res.status(200).json({ message: 'Patient transferred to Periodontal service', patient });
  };

  validateTransfer = async (req: Request, res: Response) => {
    const result = await this.service.validateTransfer(req.params.actionId as string);
    res.status(200).json({
      message: 'Transfer to Orthodontic service validated successfully',
      ...result
    });
  };
}
