import { Request, Response } from 'express';
import { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service = new AuthService()) {}

  login = async (req: Request, res: Response) => {
    const result = await this.service.login(req.body);
    res.status(200).json(result);
  };

  refresh = async (req: Request, res: Response) => {
    const result = await this.service.refresh(req.body);
    res.status(200).json(result);
  };

  logout = async (req: Request, res: Response) => {
    await this.service.logout(req.body);
    res.status(204).send();
  };

  signup = async (req: Request, res: Response) => {
    const user = await this.service.signup(req.body);
    res.status(201).json(user);
  };
}
