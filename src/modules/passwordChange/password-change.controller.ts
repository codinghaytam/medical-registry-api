import { Request, Response } from 'express';
import { PasswordChangeService } from './password-change.service.js';

export class PasswordChangeController {
  constructor(private readonly service = new PasswordChangeService()) {}

  changePassword = async (req: Request, res: Response) => {
    const result = await this.service.changePassword(req.params.email as string, req.body.newPassword);
    res.status(200).json({ message: 'Password changed successfully', ...result });
  };
}
