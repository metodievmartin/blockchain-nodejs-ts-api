import './config/env';

import { createServer } from 'node:http';

import app from './app';
import logger from './config/logger';
import appConfig from './config/app.config';
import { connectDB, disconnectDB } from './config/db';
import { connectRedis, disconnectRedis } from './config/redis';
import {
  startGapProcessingWorker,
  stopGapProcessingWorker,
} from './modules/eth/shared/queue.service';

const httpServer = createServer(app);

/** Graceful shutdown helper */
async function shutdown(reason: string, err?: unknown) {
  try {
    if (err) {
      logger.error(err, reason);
    } else {
      logger.info(reason);
    }

    // 1. Stop accepting new connections
    await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
    logger.info('HTTP server closed');

    // 2. Stop BullMQ workers
    await stopGapProcessingWorker();
    logger.info('BullMQ workers stopped');

    // 3. Disconnect from Redis
    await disconnectRedis();
    logger.info('Redis connection closed');

    // 4. Disconnect from the database
    await disconnectDB();
    logger.info('Database connection closed');

    process.exit(err ? 1 : 0);
  } catch (shutdownErr) {
    // Last-ditch — couldn’t shut down cleanly
    console.error('Forced exit due to shutdown error:', shutdownErr);
    process.exit(1);
  }
}

async function main(): Promise<void> {
  try {
    await connectDB();
    await connectRedis();

    // Initialize BullMQ workers
    startGapProcessingWorker();
    logger.info('BullMQ gap processing worker started');

    httpServer.listen(appConfig.server.port, () => {
      logger.info(
        `HTTP server listening on port: ${appConfig.server.port} (${appConfig.nodeEnv})...`
      );
    });

    process.on('SIGINT', () => shutdown('SIGINT received'));
    process.on('SIGTERM', () => shutdown('SIGTERM received'));

    process.on('unhandledRejection', (reason) =>
      shutdown('Unhandled promise rejection', reason)
    );

    process.on('uncaughtException', (err) =>
      shutdown('Uncaught exception', err)
    );
  } catch (err) {
    await shutdown('Startup failed', err);
  }
}

main();
