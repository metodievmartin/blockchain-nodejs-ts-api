import { Router } from 'express';

import appConfig from './config/app.config';
import authV1Router from './modules/auth/v1/auth.router';
import userV1Router from './modules/users/v1/user.router';
import txV1Router from './modules/eth/tx/v1/tx.router';

const appRouter = Router();

// API v1 routes
const v1 = Router();

v1.use('/auth', authV1Router);
v1.use('/users', userV1Router);
v1.use('/eth/address', txV1Router);

// Mount versioned routes
appRouter.use('/api/v1', v1);

// Health check endpoint
appRouter.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    mode: appConfig.nodeEnv,
    uptime: process.uptime(), // in seconds
    timestamp: new Date().toISOString(),
  });
});

export default appRouter;
