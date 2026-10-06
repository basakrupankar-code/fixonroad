import { Server, Socket } from 'socket.io';

export const setupSockets = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Auth middleware for sockets would go here in a real app or before connection
    // socket.use(...)

    socket.on('booking:join', ({ bookingId }) => {
      // Validate ownership of booking here
      socket.join(`booking:${bookingId}`);
      console.log(`Socket ${socket.id} joined room booking:${bookingId}`);
    });

    socket.on('mechanic:location', (data) => {
      // data: { bookingId, lat, lng, at }
      // Broadcast to the booking room
      socket.to(`booking:${data.bookingId}`).emit('mechanic:location', data);
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};
