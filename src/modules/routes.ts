import { Express } from 'express';
import actionsRoutes from './actions/actions.routes.js';
import authRoutes from './auth/auth.routes.js';
import adminRoutes from './admin/admin.routes.js';
import consultationRoutes from './consultation/consultation.routes.js';
import diagnostiqueRoutes from './diagnostique/diagnostique.routes.js';
import enumsRoutes from './enums/enums.routes.js';
import etudiantRoutes from './etudiant/etudiant.routes.js';
import medecinRoutes from './medecin/medecin.routes.js';
import passwordChangeRoutes from './passwordChange/password-change.routes.js';
import patientRoutes from './patient/patient.routes.js';
import reevaluationRoutes from './reevaluation/reevaluation.routes.js';
import seanceRoutes from './seance/seance.routes.js';
import userRoutes from './users/user.routes.js';
import verifyEmailRoutes from './verifyEmail/verify-email.routes.js';

export function registerFeatureRoutes(app: Express) {
  app.use('/auth', authRoutes);
  app.use('/users', userRoutes);
  app.use('/medecin', medecinRoutes);
  app.use('/etudiant', etudiantRoutes);
  app.use('/admin', adminRoutes);
  app.use('/patient', patientRoutes);
  app.use('/consultation', consultationRoutes);
  app.use('/diagnostique', diagnostiqueRoutes);
  app.use('/actions', actionsRoutes);
  app.use('/seance', seanceRoutes);
  app.use('/enum', enumsRoutes);
  app.use('/reevaluation', reevaluationRoutes);
  app.use('/password-change', passwordChangeRoutes);
  app.use('/verify-email', verifyEmailRoutes);

  // Health Check
  app.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Medical Registry API is running' });
  });
}
