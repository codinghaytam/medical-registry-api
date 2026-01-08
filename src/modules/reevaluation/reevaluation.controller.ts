import { Request, Response } from 'express';
import type { Express } from 'express';
import { ReevaluationService } from './reevaluation.service.js';

export class ReevaluationController {
  constructor(private readonly service = new ReevaluationService()) {}

  getReevaluations = async (_req: Request, res: Response) => {
    const reevaluations = await this.service.list();
    res.status(200).json(reevaluations);
  };

  getReevaluation = async (req: Request, res: Response) => {
    const reevaluation = await this.service.getById(req.params.id);
    res.status(200).json(reevaluation);
  };

  createReevaluation = async (req: Request, res: Response) => {
    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
    const reevaluation = await this.service.create(
      {
        ...req.body,
        indiceDePlaque: parseFloat(req.body.indiceDePlaque),
        indiceGingivale: parseFloat(req.body.indiceGingivale),
        date: new Date(req.body.date)
      },
      files
    );
    res.status(201).json(reevaluation);
  };

  updateReevaluation = async (req: Request, res: Response) => {
    const files = Array.isArray(req.files) ? (req.files as Express.Multer.File[]) : [];
    const removeUploadIds = Array.isArray(req.body.removeUploadIds)
      ? req.body.removeUploadIds
      : req.body.removeUploadIds
        ? [req.body.removeUploadIds]
        : undefined;

    const reevaluation = await this.service.update(
      req.params.id,
      {
        indiceDePlaque: req.body.indiceDePlaque ? parseFloat(req.body.indiceDePlaque) : undefined,
        indiceGingivale: req.body.indiceGingivale ? parseFloat(req.body.indiceGingivale) : undefined,
        seanceId: req.body.seanceId,
        removeUploadIds
      },
      files
    );
    res.status(200).json(reevaluation);
  };

  deleteReevaluation = async (req: Request, res: Response) => {
    await this.service.remove(req.params.id);
    res.status(204).send();
  };
}
