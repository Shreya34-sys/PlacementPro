const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function setupSockets(httpServer, app) {
  const io = new Server(httpServer, {
    cors: { origin: false }
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));

      socket.user = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your_fallback_secret_key'
      );

      next();
    } catch (_) {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.on('join-attempt', (attemptId) => {
      if (!attemptId || socket.user.role !== 'student') return;
      socket.join(`student:attempt:${attemptId}`);
    });

    socket.on('watch-exam', (examId) => {
      if (!examId || socket.user.role !== 'admin') return;
      socket.join(`admin:exam:${examId}`);
    });

    socket.on('monitor-attempt', (attemptId) => {
      if (!attemptId || socket.user.role !== 'admin') return;
      socket.join(`admin:attempt:${attemptId}`);
      io.to(`student:attempt:${attemptId}`).emit('proctor:request-stream');
    });

    socket.on('webrtc:offer', ({ attemptId, offer }) => {
      if (socket.user.role !== 'student' || !attemptId || !offer) return;
      io.to(`admin:attempt:${attemptId}`).emit('webrtc:offer', {
        attemptId,
        offer
      });
    });

    socket.on('webrtc:answer', ({ attemptId, answer }) => {
      if (socket.user.role !== 'admin' || !attemptId || !answer) return;
      io.to(`student:attempt:${attemptId}`).emit('webrtc:answer', {
        attemptId,
        answer
      });
    });

    socket.on('webrtc:ice', ({ attemptId, candidate, target }) => {
      if (!attemptId || !candidate) return;

      if (socket.user.role === 'student' && target === 'admin') {
        io.to(`admin:attempt:${attemptId}`).emit('webrtc:ice', {
          attemptId,
          candidate
        });
      }

      if (socket.user.role === 'admin' && target === 'student') {
        io.to(`student:attempt:${attemptId}`).emit('webrtc:ice', {
          attemptId,
          candidate
        });
      }
    });
  });

  app.set('io', io);
  return io;
}

module.exports = setupSockets;
