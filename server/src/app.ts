import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { setupRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({ 
  origin: process.env.CLIENT_ORIGIN || '*',
  credentials: true 
}));
app.use(express.json());
app.use(cookieParser());

// Basic health check
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

setupRoutes(app);

app.use(errorHandler);

export { app };
