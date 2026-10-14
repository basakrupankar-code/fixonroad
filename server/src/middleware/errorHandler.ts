import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(err);

  if (err instanceof ZodError) {
    const errorMessage = err.issues[0]?.message || 'Invalid request data';
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: errorMessage,
        details: err.issues,
      },
    });
  }

  const statusCode = err.statusCode || (typeof err.status === 'number' ? err.status : 500);
  const isProd = process.env.NODE_ENV === 'production';
  const code = err.code || (statusCode >= 500 ? 'INTERNAL_ERROR' : 'BAD_REQUEST');
  
  // Never leak internal database errors or library exceptions to clients in production
  const message = statusCode >= 500 && isProd
    ? 'Internal Server Error. Please contact support if the issue persists.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};
