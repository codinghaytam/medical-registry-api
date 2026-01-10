import { Request, Response } from 'express';
import { UserService } from './user.service.js';

export class UserController {
  constructor(private readonly service = new UserService()) {}

  getUsers = async (_req: Request, res: Response) => {
    const users = await this.service.list();
    res.status(200).json(users);
  };

  getUsersByRole = async (req: Request, res: Response) => {
    const users = await this.service.getByRole(req.params.role as any);
    res.status(200).json(users);
  };

  getMedecins = async (_req: Request, res: Response) => {
    const medecins = await this.service.getMedecinsWithKeycloak();
    res.status(200).json(medecins);
  };

  getUserById = async (req: Request, res: Response) => {
    const user = await this.service.getById(req.params.id as string);
    res.status(200).json(user);
  };

  getUserByEmail = async (req: Request, res: Response) => {
    const user = await this.service.getByEmail(req.params.email as string);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.status(200).json(user);
  };

  createUser = async (req: Request, res: Response) => {
    const user = await this.service.create(req.body);
    res.status(201).json(user);
  };

  updateUser = async (req: Request, res: Response) => {
    const user = await this.service.update(req.params.id as string, req.body);
    res.status(200).json(user);
  };

  deleteUser = async (req: Request, res: Response) => {
    await this.service.delete(req.params.id as string);
    res.status(204).send();
  };
}
