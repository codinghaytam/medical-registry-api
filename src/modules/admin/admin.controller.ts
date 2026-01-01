import { Request, Response } from 'express';
import { AdminService } from './admin.service.js';

export class AdminController {
  constructor(private readonly service = new AdminService()) {}

  getAdmins = async (_req: Request, res: Response) => {
    const admins = await this.service.list();
    res.status(200).json(admins);
  };

  getAdminByEmail = async (req: Request, res: Response) => {
    const admin = await this.service.getByEmail(req.params.email);
    res.status(200).json(admin);
  };

  getAdminById = async (req: Request, res: Response) => {
    const admin = await this.service.getById(req.params.id);
    res.status(200).json(admin);
  };

  createAdmin = async (req: Request, res: Response) => {
    const admin = await this.service.create(req.body);
    res.status(201).json(admin);
  };

  updateAdmin = async (req: Request, res: Response) => {
    const admin = await this.service.update(req.params.id, req.body);
    res.status(200).json(admin);
  };

  deleteAdmin = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id);
    res.status(204).send();
  };
}
