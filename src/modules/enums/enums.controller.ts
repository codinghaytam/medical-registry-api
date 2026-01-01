import { Request, Response } from 'express';
import { EnumsService } from './enums.service.js';

export class EnumsController {
  constructor(private readonly service = new EnumsService()) {}

  getMotifs = (_req: Request, res: Response) => {
    res.status(200).json(this.service.getMotifs());
  };

  getMasticationTypes = (_req: Request, res: Response) => {
    res.status(200).json(this.service.getMasticationTypes());
  };

  getHygieneLevels = (_req: Request, res: Response) => {
    res.status(200).json(this.service.getHygieneLevels());
  };
}
