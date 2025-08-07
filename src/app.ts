import hpp from 'hpp';
import cors from 'cors';
import helmet from 'helmet';
import express from 'express';
import compression from 'compression';
import rateLimit from 'express-rate-limit';

import appRouter from './routes';
import appConfig from './config/app.config';
import { errorConverter, errorHandler } from './middlewares/error.middleware';

const app = express();

// Security middlewares (order matters)
// Helmet - Set security headers (always enabled - application-level security)
if (appConfig.security.helmet.enabled) {
  app.use(helmet(appConfig.security.helmet));
}

// CORS (conditional - it may conflict with balancer/proxy)
app.use(cors(appConfig.security.cors));

// Rate limiting (conditional - may be handled by balancer/proxy)
if (appConfig.security.rateLimit.enabled) {
  const limiter = rateLimit(appConfig.security.rateLimit);
  app.use(limiter);
}

// Compression to improve performance (conditional - may be handled by reverse proxy)
if (appConfig.security.compression.enabled) {
  app.use(compression());
}

// HTTP Parameter Pollution protection (lightweight, always useful)
app.use(hpp());

// Body parsing with size limits
app.use(
  express.json({
    limit: appConfig.security.requestSizeLimit,
    strict: true,
  })
);

// Routes
app.use(appRouter);

// Global error handling middleware
app.use(errorConverter);
app.use(errorHandler);

export default app;
