import { Request, Response } from 'express';
import { DiagnostiqueService } from './diagnostique.service.js';

export class DiagnostiqueController {
  constructor(private readonly service = new DiagnostiqueService()) {}

  getDiagnostiques = async (_req: Request, res: Response) => {
    const diagnostiques = await this.service.list();
    res.status(200).json(diagnostiques);
  };

  getDiagnostique = async (req: Request, res: Response) => {
    const diagnostique = await this.service.getById(req.params.id as string);
    res.status(200).json(diagnostique);
  };

  createDiagnostique = async (req: Request, res: Response) => {
    const diagnostique = await this.service.create(req.body);
    res.status(201).json(diagnostique);
  };

  updateDiagnostique = async (req: Request, res: Response) => {
    const diagnostique = await this.service.update(req.params.id as string, req.body);
    res.status(200).json(diagnostique);
  };

  deleteDiagnostique = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    res.status(204).send();
  };
}
