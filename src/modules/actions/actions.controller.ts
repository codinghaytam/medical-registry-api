import { Request, Response } from 'express';
import { ActionsService } from './actions.service.js';

export class ActionsController {
  constructor(private readonly service = new ActionsService()) {}

  getActions = async (req: Request, res: Response) => {
    const actions = await this.service.list();
    res.status(200).json(actions);
  };

  getAction = async (req: Request, res: Response) => {
    const action = await this.service.getById(req.params.id);
    res.status(200).json(action);
  };

  createAction = async (req: Request, res: Response) => {
    const action = await this.service.create({
      ...req.body,
      date: new Date(req.body.date)
    });
    res.status(201).json(action);
  };

  updateAction = async (req: Request, res: Response) => {
    const action = await this.service.update(req.params.id, {
      ...req.body,
      date: req.body.date ? new Date(req.body.date) : undefined
    });
    res.status(200).json(action);
  };

  deleteAction = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };

  validateTransferToOrtho = async (req: Request, res: Response) => {
    const result = await this.service.validateTransferToOrtho(req.params.id);
    res.status(200).json({
      message: 'Transfer to Orthodontic service validated successfully',
      ...result
    });
  };

  validateTransferToParo = async (req: Request, res: Response) => {
    const result = await this.service.validateTransferToParo(req.params.id);
    res.status(200).json({
      message: 'Transfer to Periodontal service validated successfully',
      ...result
    });
  };
}
