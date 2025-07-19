import express from 'express';

import appRouter from './routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(appRouter);

// Global error handling middleware
app.use(errorHandler);

export default app;
