import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  code: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number = 500, code: string = 'ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  // Log error
  logger.error({
    error: {
      message,
      stack: err.stack,
      code: err instanceof AppError ? err.code : undefined,
      statusCode
    },
    request: {
      method: req.method,
      url: req.url,
      body: req.body,
      params: req.params,
      query: req.query
    }
  });

  // Send error response
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(statusCode).json({
    success: false,
    error: {
      code: err instanceof AppError ? err.code : 'INTERNAL_SERVER_ERROR',
      message: isDevelopment || statusCode !== 500
        ? message
        : 'Internal Server Error'
    },
    ...(isDevelopment && { 
      stack: err.stack,
      ...(err instanceof Error && err.name !== 'AppError' && { 
        errorName: err.name,
        errorDetails: err.message 
      })
    })
  });
};





