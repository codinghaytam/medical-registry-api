import { Request, Response } from 'express';
import { VerifyEmailService } from './verify-email.service.js';

export class VerifyEmailController {
  constructor(private readonly service = new VerifyEmailService()) {}

  sendVerification = async (req: Request, res: Response) => {
    const payload = await this.service.sendVerification(req.params.email as string, req.body || {});
    res.status(200).json(payload);
  };

  getStatus = async (req: Request, res: Response) => {
    const status = await this.service.getStatus(req.params.email as string);
    res.status(200).json(status);
  };

  resendVerification = async (req: Request, res: Response) => {
    const payload = await this.service.resend(req.params.email as string, req.body || {});
    res.status(200).json(payload);
  };

  markVerified = async (req: Request, res: Response) => {
    const payload = await this.service.markVerified(req.params.email as string);
    res.status(200).json(payload);
  };
}
