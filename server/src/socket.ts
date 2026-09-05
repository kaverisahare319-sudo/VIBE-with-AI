import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';

// Global io instance — importable by other modules to emit events server-side
let _io: Server | null = null;

export const getIO = (): Server | null => _io;

export const setupSocketIO = (server: HttpServer) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  _io = io;

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    // Student joins their own notification room keyed by userId
    socket.on('join_user_room', (userId: string) => {
      socket.join(`user_${userId}`);
      console.log(`[Socket.IO] User ${userId} joined personal room`);
    });

    // Join GD room
    socket.on('join_gd_room', (roomId: string, user: any) => {
      socket.join(roomId);
      console.log(`[Socket.IO] ${user.name} joined room: ${roomId}`);
      socket.to(roomId).emit('user_joined', user);
    });

    // Handle GD messages
    socket.on('send_gd_message', (data: { roomId: string, message: any }) => {
      socket.to(data.roomId).emit('receive_gd_message', data.message);
    });

    // Voice mode: active speaker detection or speaking turns
    socket.on('speaker_active', (data: { roomId: string, user: any }) => {
      socket.to(data.roomId).emit('speaker_changed', data.user);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });

  return io;
};
