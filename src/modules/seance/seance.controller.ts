import { Request, Response } from 'express';
import { SeanceService } from './seance.service.js';

export class SeanceController {
  constructor(private readonly service = new SeanceService()) {}

  getSeances = async (_req: Request, res: Response) => {
    const seances = await this.service.list();
    res.status(200).json(seances);
  };

  getSeance = async (req: Request, res: Response) => {
    const seance = await this.service.getById(req.params.id as string);
    res.status(200).json(seance);
  };

  createSeance = async (req: Request, res: Response) => {
    const seance = await this.service.create({
      ...req.body,
      date: new Date(req.body.date)
    });
    res.status(201).json(seance);
  };

  updateSeance = async (req: Request, res: Response) => {
    const seance = await this.service.update(req.params.id as string, {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined
    });
    res.status(200).json(seance);
  };

  deleteSeance = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id as string);
    res.status(204).send();
  };
}
