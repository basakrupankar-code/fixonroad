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

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  res.status(statusCode).json({
    error: {
      code,
      message,
    },
  });
};
