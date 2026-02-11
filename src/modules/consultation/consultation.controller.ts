import { Request, Response } from 'express';
import { ConsultationService } from './consultation.service.js';

export class ConsultationController {
  constructor(private readonly service = new ConsultationService()) { }

  getConsultations = async (req: Request, res: Response) => {
    const user = (req as any).dbUser;
    const consultations = await this.service.list(user);
    res.status(200).json(consultations);
  };

  getConsultation = async (req: Request, res: Response) => {
    const consultation = await this.service.getById(req.params.id as string);
    res.status(200).json(consultation);
  };

  createConsultation = async (req: Request, res: Response) => {
    const consultation = await this.service.create({
      ...req.body,
      date: new Date(req.body.date)
    });
    res.status(201).json(consultation);
  };

  addDiagnosis = async (req: Request, res: Response) => {
    const diagnosis = await this.service.addDiagnosis(req.params.id as string, req.body);
    res.status(201).json(diagnosis);
  };

  updateConsultation = async (req: Request, res: Response) => {
    const consultation = await this.service.update(req.params.id as string, {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined
    });
    res.status(200).json(consultation);
  };

  updateDiagnosis = async (req: Request, res: Response) => {
    const diagnosis = await this.service.updateDiagnosis(req.params.diagnosisId as string, req.body);
    res.status(200).json(diagnosis);
  };

  deleteConsultation = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);
    res.status(204).send();
  };
}
