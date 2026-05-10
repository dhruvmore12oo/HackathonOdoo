import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../../config/logger';
import { verifyAccessToken } from '../../lib/token';
import { RT_EVENTS } from './realtime.events';
import * as presence from './realtime.presence';
import { queryOne } from '../../lib/db';

let io: Server | null = null;

/**
 * Initialize Socket.IO server with JWT authentication.
 */
export function initRealtimeServer(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 10000,
  });

  // JWT authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = verifyAccessToken(token);
      const user = await queryOne<{ first_name: string; last_name: string }>(
        'SELECT first_name, last_name FROM users WHERE id = $1', [decoded.userId]
      );

      (socket as Socket & { userId: string; firstName: string; lastName: string }).userId = decoded.userId;
      (socket as Socket & { firstName: string }).firstName = user?.first_name || '';
      (socket as Socket & { lastName: string }).lastName = user?.last_name || '';
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on(RT_EVENTS.CONNECTION, (socket: Socket) => {
    const s = socket as Socket & { userId: string; firstName: string; lastName: string };
    logger.info('Socket connected', { socketId: s.id, userId: s.userId });

    // ── Join trip room ──
    s.on(RT_EVENTS.JOIN_TRIP, (tripId: string) => {
      s.join(`trip:${tripId}`);
      presence.joinRoom(tripId, s.id, {
        userId: s.userId,
        firstName: s.firstName,
        lastName: s.lastName,
        status: 'online',
        lastSeen: Date.now(),
      });
      // Broadcast presence to room
      io!.to(`trip:${tripId}`).emit(RT_EVENTS.PRESENCE_LIST, presence.getRoomMembers(tripId));
      logger.info('User joined trip room', { userId: s.userId, tripId });
    });

    // ── Leave trip room ──
    s.on(RT_EVENTS.LEAVE_TRIP, (tripId: string) => {
      s.leave(`trip:${tripId}`);
      presence.leaveRoom(tripId, s.id);
      io!.to(`trip:${tripId}`).emit(RT_EVENTS.PRESENCE_LIST, presence.getRoomMembers(tripId));
    });

    // ── Editing indicator ──
    s.on(RT_EVENTS.USER_EDITING, (data: { tripId: string; sectionId?: string }) => {
      presence.updatePresence(data.tripId, s.id, { editingSection: data.sectionId, status: 'online' });
      s.to(`trip:${data.tripId}`).emit(RT_EVENTS.USER_EDITING, {
        userId: s.userId, firstName: s.firstName, lastName: s.lastName,
        sectionId: data.sectionId,
      });
    });

    // ── Typing indicator ──
    s.on(RT_EVENTS.USER_TYPING, (data: { tripId: string; typing: boolean }) => {
      s.to(`trip:${data.tripId}`).emit(RT_EVENTS.USER_TYPING, {
        userId: s.userId, firstName: s.firstName, typing: data.typing,
      });
    });

    // ── Join personal notification channel ──
    s.join(`user:${s.userId}`);

    // ── Disconnect ──
    s.on(RT_EVENTS.DISCONNECT, () => {
      const leftRooms = presence.leaveAllRooms(s.id);
      leftRooms.forEach(tripId => {
        io!.to(`trip:${tripId}`).emit(RT_EVENTS.PRESENCE_LIST, presence.getRoomMembers(tripId));
      });
      logger.info('Socket disconnected', { socketId: s.id, userId: s.userId });
    });
  });

  logger.info('🔌 Socket.IO realtime server initialized');
  return io;
}

/**
 * Get the Socket.IO server instance.
 */
export function getIO(): Server {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
}

/**
 * Broadcast an event to a specific trip room.
 */
export function broadcastToTrip(tripId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`trip:${tripId}`).emit(event, data);
}

/**
 * Send an event to a specific user (via their personal channel).
 */
export function sendToUser(userId: string, event: string, data: unknown): void {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, data);
}
