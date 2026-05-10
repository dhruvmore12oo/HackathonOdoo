import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from '../modules/auth/auth.routes';
import userRoutes from '../modules/user/user.routes';
import tripRoutes from '../modules/trip/trip.routes';
import itineraryRoutes from '../modules/itinerary/itinerary.routes';
import expenseRoutes from '../modules/expense/expense.routes';
import shareRoutes from '../modules/share/share.routes';
import notificationRoutes from '../modules/notification/notification.routes';
import aiRoutes from '../modules/ai/ai.routes';

const router = Router();

// Health check (no auth required)
router.use('/health', healthRoutes);

// Auth routes
router.use('/auth', authRoutes);

// User routes
router.use('/users', userRoutes);

// Trip routes
router.use('/trips', tripRoutes);

// Share, collaboration & community routes (MUST be before itinerary/expense
// because those routers use router.use(authenticate) which would block
// public /share/:slug and /community/* endpoints)
router.use('/', shareRoutes);

// Itinerary routes (mounted at root — routes define full paths internally)
router.use('/', itineraryRoutes);

// Expense routes (mounted at root — routes define full paths internally)
router.use('/', expenseRoutes);

// Notification routes
router.use('/notifications', notificationRoutes);

// AI routes
router.use('/ai', aiRoutes);

export default router;
