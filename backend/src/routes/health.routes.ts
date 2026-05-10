import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { sendSuccess } from '../lib/response';
import { testDatabaseConnection } from '../config/database';

const router = Router();

router.get(
  '/',
  asyncHandler(async (_req, res) => {
    const dbHealthy = await testDatabaseConnection();

    const healthData = {
      status: dbHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
        api: 'running',
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
    };

    const statusCode = dbHealthy ? 200 : 503;
    sendSuccess(res, healthData, undefined, statusCode);
  })
);

export default router;
