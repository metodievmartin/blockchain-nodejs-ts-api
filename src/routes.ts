import { Router } from 'express';
import appConfig from './config/app.config';

const appRouter = Router();

// Mount routes

// API routes
appRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mode: appConfig.nodeEnv,
    uptime: process.uptime(), // in seconds
    timestamp: new Date().toISOString(),
  });
});

export default appRouter;
