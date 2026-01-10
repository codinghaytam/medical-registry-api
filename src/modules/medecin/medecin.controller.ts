import { Request, Response } from 'express';
import { MedecinService } from './medecin.service.js';

export class MedecinController {
  constructor(private readonly service = new MedecinService()) {}

  getMedecins = async (_req: Request, res: Response) => {
    const medecins = await this.service.list();
    res.status(200).json(medecins);
  };

  getByProfession = async (req: Request, res: Response) => {
    const medecins = await this.service.findByProfession(req.params.profession as any);
    res.status(200).json(medecins);
  };

  getMedecin = async (req: Request, res: Response) => {
    const medecin = await this.service.getById(req.params.id as string);
    res.status(200).json(medecin);
  };

  getByEmail = async (req: Request, res: Response) => {
    const medecin = await this.service.getByEmail(req.params.email as string);
    res.status(200).json(medecin);
  };

  createMedecin = async (req: Request, res: Response) => {
    const medecin = await this.service.create(req.body);
    res.status(201).json(medecin);
  };

  updateMedecin = async (req: Request, res: Response) => {
    const medecin = await this.service.update(req.params.id as string, req.body);
    res.status(200).json(medecin);
  };

  deleteMedecin = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    res.status(204).send();
  };
}
