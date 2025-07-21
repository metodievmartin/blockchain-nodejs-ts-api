import express from 'express';

import appRouter from './routes';
import { errorConverter, errorHandler } from './middlewares/error.middleware';

const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(appRouter);

// Global error handling middleware
app.use(errorConverter);
app.use(errorHandler);

export default app;
