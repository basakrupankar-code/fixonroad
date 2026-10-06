import { Application } from 'express';
import { authRouter } from './auth';
import { servicesRouter } from './services';
import { mechanicsRouter } from './mechanics';
import { bookingsRouter } from './bookings';
import { paymentsRouter } from './payments';
import { reviewsRouter } from './reviews';
import { meRouter } from './me';

export const setupRoutes = (app: Application) => {
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/services', servicesRouter);
  app.use('/api/v1/mechanics', mechanicsRouter);
  app.use('/api/v1/bookings', bookingsRouter);
  app.use('/api/v1/payments', paymentsRouter);
  app.use('/api/v1/reviews', reviewsRouter);
  app.use('/api/v1/me', meRouter);
};
