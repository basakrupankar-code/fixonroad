import { Server, Socket } from 'socket.io';
import mongoose from 'mongoose';
import { Session } from '../models/Session';
import { Order } from '../models/Order';

export const setupSockets = (io: Server) => {
  // Authentication middleware for Socket.io
  io.use(async (socket: Socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      
      // Fallback: parse cookie if token not sent in auth handshake
      if (!token && socket.handshake.headers.cookie) {
        const match = socket.handshake.headers.cookie.match(/(?:^|;\s*)session_token=([^;]+)/);
        if (match) token = match[1];
      }

      if (!token) {
        return next(new Error('Authentication error: Missing session token'));
      }

      const session = await Session.findOne({ sessionToken: token });
      if (!session || session.expiresAt < new Date()) {
        return next(new Error('Authentication error: Invalid or expired session'));
      }

      socket.data.user = {
        userId: session.userId.toString(),
        role: session.role,
      };

      next();
    } catch (err) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user;

    socket.on('booking:join', async ({ bookingId }) => {
      try {
        if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
          return socket.emit('error', { message: 'Invalid booking ID' });
        }

        const order = await Order.findById(bookingId);
        if (!order) {
          return socket.emit('error', { message: 'Booking not found' });
        }

        const isOwner = order.userId.toString() === user.userId;
        const isMechanic = order.mechanicId?.toString() === user.userId;

        if (!isOwner && !isMechanic && user.role !== 'admin') {
          return socket.emit('error', { message: 'Forbidden. You do not belong to this booking room.' });
        }

        socket.join(`booking:${bookingId}`);
      } catch (err) {
        socket.emit('error', { message: 'Failed to join booking room' });
      }
    });

    socket.on('mechanic:location', async (data) => {
      try {
        const { bookingId, lat, lng } = data || {};
        if (!bookingId || typeof lat !== 'number' || typeof lng !== 'number') return;

        // Verify sender is the authorized mechanic for this booking
        if (user.role !== 'mechanic') return;

        const order = await Order.findById(bookingId);
        if (!order || order.mechanicId?.toString() !== user.userId) return;

        socket.to(`booking:${bookingId}`).emit('mechanic:location', {
          bookingId,
          lat,
          lng,
          at: new Date().toISOString()
        });
      } catch (err) {
        // Suppress broadcast errors
      }
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });
};
