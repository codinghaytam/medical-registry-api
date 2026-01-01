import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/apiError.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.notFound('Resource not found'));
};

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const status = err instanceof ApiError ? err.status : 500;
  const payload = {
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  logger.error(`Request failed: ${req.method} ${req.originalUrl}`, err);
  res.status(status).json(payload);
};
