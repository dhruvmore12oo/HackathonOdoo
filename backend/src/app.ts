import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { corsOptions } from './config/cors';
import { requestLogger } from './middleware/requestLogger';
import { generalLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { sendError } from './lib/response';
import routes from './routes';

const app = express();

// ── Security ──
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
app.use(cors(corsOptions));

// ── Cookie Parsing ──
app.use(cookieParser());

// ── Rate Limiting ──
app.use(generalLimiter);

// ── Body Parsing ──
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──
app.use(requestLogger);

// ── Static Uploads ──
app.use('/uploads', express.static('uploads'));

// ── API Routes ──
app.use('/api/v1', routes);

// ── 404 Handler ──
app.use((_req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'The requested endpoint does not exist');
});

// ── Global Error Handler ──
app.use(errorHandler);

export default app;
