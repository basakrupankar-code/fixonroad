import http from 'http';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { app } from './app';
import { connectDB } from './db';
import { setupSockets } from './sockets';

dotenv.config();

const PORT = process.env.PORT || 5005;

// Connect to MongoDB
connectDB();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || '*',
    methods: ['GET', 'POST'],
  },
});

setupSockets(io);

server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}`);
});
