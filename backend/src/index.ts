import { createServer } from 'http';
import app from './app';
import { env, logger, testDatabaseConnection, closeDatabasePool } from './config';
import { initRealtimeServer } from './modules/realtime/realtime.server';

async function bootstrap(): Promise<void> {
  // Test database connection
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    logger.error('Failed to connect to database. Exiting.');
    process.exit(1);
  }
  logger.info('✅ Database connected successfully');

  // Create HTTP server and attach Socket.IO
  const httpServer = createServer(app);
  initRealtimeServer(httpServer);

  // Start server
  httpServer.listen(env.PORT, () => {
    logger.info(`🚀 Traveloop API running on port ${env.PORT} [${env.NODE_ENV}]`);
    logger.info(`📋 Health: http://localhost:${env.PORT}/api/v1/health`);
    logger.info(`🔌 Socket.IO ready on port ${env.PORT}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    logger.info(`${signal} received. Shutting down gracefully...`);
    httpServer.close(async () => {
      await closeDatabasePool();
      logger.info('Server closed. Goodbye.');
      process.exit(0);
    });

    // Force exit after 10s
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason);
  });
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

bootstrap();
