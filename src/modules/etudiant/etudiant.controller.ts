import { Request, Response } from 'express';
import { EtudiantService } from './etudiant.service.js';

export class EtudiantController {
  constructor(private readonly service = new EtudiantService()) {}

  getEtudiants = async (_req: Request, res: Response) => {
    const etudiants = await this.service.list();
    res.status(200).json(etudiants);
  };

  getEtudiant = async (req: Request, res: Response) => {
    const etudiant = await this.service.getById(req.params.id as string);
    res.status(200).json(etudiant);
  };

  createEtudiant = async (req: Request, res: Response) => {
    const etudiant = await this.service.create(req.body);
    res.status(201).json(etudiant);
  };

  updateEtudiant = async (req: Request, res: Response) => {
    const etudiant = await this.service.update(req.params.id as string, req.body);
    res.status(200).json(etudiant);
  };

  deleteEtudiant = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    res.status(204).send();
  };
}
