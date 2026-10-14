const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Interview = require('../models/interviewModel');

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
    const userId = socket.user.id || socket.user.userId;
    if (userId) socket.join(`user:${userId}`);

    socket.on('join-attempt', async (attemptId) => {
      if (!attemptId || socket.user.role !== 'student') return;
      const attempt = await Interview.canStudentStreamAttempt(userId, attemptId).catch(() => null);
      if (!attempt || attempt.state !== 'started') return;
      socket.join(`student:attempt:${attemptId}`);
      io.to(`admin:attempt:${attemptId}`).emit('interview:student-online', { attemptId });
    });

    socket.on('interview:mic-status', async ({ attemptId, questionId, status, detail }) => {
      if (!attemptId || socket.user.role !== 'student') return;
      const attempt = await Interview.canStudentStreamAttempt(userId, attemptId).catch(() => null);
      if (!attempt || attempt.state !== 'started') return;
      const safeStatus = ['speaking', 'silent', 'error', 'off'].includes(status) ? status : 'silent';
      io.to(`admin:attempt:${attemptId}`).emit('interview:mic-status', {
        attemptId,
        questionId: questionId || null,
        status: safeStatus,
        detail: typeof detail === 'string' ? detail.slice(0, 180) : '',
        at: new Date().toISOString()
      });
    });

    socket.on('watch-exam', (examId) => {
      if (!examId || socket.user.role !== 'admin') return;
      socket.join(`admin:exam:${examId}`);
    });

    socket.on('monitor-attempt', async (attemptId) => {
      if (!attemptId || socket.user.role !== 'admin') return;
      const attempt = await Interview.canMonitorAttempt(userId, attemptId).catch(() => null);
      if (!attempt) return;
      socket.join(`admin:attempt:${attemptId}`);
      io.to(`student:attempt:${attemptId}`).emit('proctor:request-stream', { attemptId, viewerId: socket.id });
    });

    socket.on('stop-monitor-attempt', (attemptId) => {
      if (!attemptId || socket.user.role !== 'admin') return;
      socket.leave(`admin:attempt:${attemptId}`);
      io.to(`student:attempt:${attemptId}`).emit('proctor:stop-stream', { attemptId, viewerId: socket.id });
    });

    socket.on('webrtc:offer', async ({ attemptId, offer, viewerId }) => {
      if (socket.user.role !== 'student' || !attemptId || !offer) return;
      const attempt = await Interview.canStudentStreamAttempt(userId, attemptId).catch(() => null);
      if (!attempt || attempt.state !== 'started') return;
      io.to(viewerId || `admin:attempt:${attemptId}`).emit('webrtc:offer', {
        attemptId,
        viewerId,
        offer
      });
    });

    socket.on('webrtc:answer', async ({ attemptId, answer, viewerId }) => {
      if (socket.user.role !== 'admin' || !attemptId || !answer) return;
      const attempt = await Interview.canMonitorAttempt(userId, attemptId).catch(() => null);
      if (!attempt) return;
      io.to(`student:attempt:${attemptId}`).emit('webrtc:answer', {
        attemptId,
        viewerId: viewerId || socket.id,
        answer
      });
    });

    socket.on('webrtc:ice', async ({ attemptId, candidate, target, viewerId }) => {
      if (!attemptId || !candidate) return;

      if (socket.user.role === 'student' && target === 'admin') {
        const attempt = await Interview.canStudentStreamAttempt(userId, attemptId).catch(() => null);
        if (!attempt || attempt.state !== 'started') return;
        io.to(viewerId || `admin:attempt:${attemptId}`).emit('webrtc:ice', {
          attemptId,
          viewerId,
          candidate
        });
      }

      if (socket.user.role === 'admin' && target === 'student') {
        const attempt = await Interview.canMonitorAttempt(userId, attemptId).catch(() => null);
        if (!attempt) return;
        io.to(`student:attempt:${attemptId}`).emit('webrtc:ice', {
          attemptId,
          viewerId: viewerId || socket.id,
          candidate
        });
      }
    });
  });

  app.set('io', io);
  return io;
}

module.exports = setupSockets;
