const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const Interview = require('../models/interviewModel');
const db = require('./db');

async function canStudentStreamAttempt(userId, attemptId) {
  try {
    const [examRows] = await db.execute(
      `SELECT a.id, a.exam_id, a.student_id, a.state, a.warnings_count, u.fullName
       FROM exam_attempts a
       JOIN users u ON u.id = a.student_id
       WHERE a.id = ? AND a.student_id = ? LIMIT 1`,
      [attemptId, userId]
    );
    if (examRows[0]) {
      return {
        id: examRows[0].id,
        examId: examRows[0].exam_id,
        studentId: examRows[0].student_id,
        state: examRows[0].state,
        warningsCount: examRows[0].warnings_count,
        fullName: examRows[0].fullName,
        type: 'exam'
      };
    }
  } catch (err) {
    console.error('Error verifying exam attempt for student streaming:', err.message);
  }

  const interviewAttempt = await Interview.canStudentStreamAttempt(userId, attemptId).catch(() => null);
  if (interviewAttempt) {
    return {
      id: interviewAttempt.id,
      state: interviewAttempt.state,
      type: 'interview'
    };
  }

  return null;
}

async function canMonitorAttempt(userId, attemptId) {
  try {
    const [examRows] = await db.execute(
      `SELECT a.id, a.exam_id, a.student_id, a.state, a.warnings_count, u.fullName
       FROM exam_attempts a
       JOIN users u ON u.id = a.student_id
       WHERE a.id = ? LIMIT 1`,
      [attemptId]
    );
    if (examRows[0]) {
      return {
        id: examRows[0].id,
        examId: examRows[0].exam_id,
        studentId: examRows[0].student_id,
        state: examRows[0].state,
        warningsCount: examRows[0].warnings_count,
        fullName: examRows[0].fullName,
        type: 'exam'
      };
    }
  } catch (err) {
    console.error('Error verifying exam attempt for monitoring:', err.message);
  }

  const interviewAttempt = await Interview.canMonitorAttempt(userId, attemptId).catch(() => null);
  if (interviewAttempt) {
    return {
      id: interviewAttempt.id,
      state: interviewAttempt.state,
      type: 'interview'
    };
  }

  return null;
}

function setupSockets(httpServer, app, existingIo = null) {
  if (existingIo) {
    if (httpServer) existingIo.attach(httpServer);
    app.set('io', existingIo);
    return existingIo;
  }

  const io = new Server(httpServer, {
    cors: { origin: true, credentials: true }
  });

  // Track online sockets per attemptId: attemptId -> Set<socket.id>
  const onlineAttempts = new Map();
  // Track camera status per attemptId: attemptId -> string
  const cameraStatuses = new Map();

  app.set('isAttemptOnline', (attemptId) => Boolean(onlineAttempts.get(attemptId)?.size));
  app.set('getAttemptCameraStatus', (attemptId) => cameraStatuses.get(attemptId) || 'unknown');

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
      const attempt = await canStudentStreamAttempt(userId, attemptId);
      if (!attempt || attempt.state !== 'started') return;

      socket.attemptId = attemptId;
      socket.attemptType = attempt.type;

      if (!onlineAttempts.has(attemptId)) {
        onlineAttempts.set(attemptId, new Set());
      }
      onlineAttempts.get(attemptId).add(socket.id);

      socket.join(`student:attempt:${attemptId}`);

      if (attempt.type === 'exam') {
        socket.examId = attempt.examId;
        socket.join(`exam:${attempt.examId}`);

        const onlinePayload = {
          attemptId,
          examId: attempt.examId,
          studentId: userId,
          fullName: attempt.fullName,
          warningsCount: attempt.warningsCount || 0,
          isOnline: true,
          cameraStatus: cameraStatuses.get(attemptId) || 'starting'
        };

        io.to(`admin:exam:${attempt.examId}`).emit('proctor:student-online', onlinePayload);
        io.to(`admin:attempt:${attemptId}`).emit('proctor:student-online', onlinePayload);
      } else {
        io.to(`admin:attempt:${attemptId}`).emit('interview:student-online', { attemptId });
      }
    });

    socket.on('proctor:camera-status', async ({ attemptId, status, detail } = {}) => {
      if (!attemptId || socket.user.role !== 'student') return;
      const attempt = await canStudentStreamAttempt(userId, attemptId);
      if (!attempt || attempt.state !== 'started') return;

      const safeStatus = ['active', 'stopped', 'error', 'denied'].includes(status) ? status : 'active';
      cameraStatuses.set(attemptId, safeStatus);

      const statusPayload = {
        attemptId,
        examId: attempt.examId,
        studentId: userId,
        status: safeStatus,
        detail: typeof detail === 'string' ? detail.slice(0, 180) : '',
        at: new Date().toISOString()
      };

      if (attempt.type === 'exam' && attempt.examId) {
        io.to(`admin:exam:${attempt.examId}`).emit('proctor:camera-status', statusPayload);
      }
      io.to(`admin:attempt:${attemptId}`).emit('proctor:camera-status', statusPayload);
    });

    socket.on('interview:mic-status', async ({ attemptId, questionId, status, detail }) => {
      if (!attemptId || socket.user.role !== 'student') return;
      const attempt = await canStudentStreamAttempt(userId, attemptId);
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
      const attempt = await canMonitorAttempt(userId, attemptId);
      if (!attempt) return;

      socket.join(`admin:attempt:${attemptId}`);
      io.to(`student:attempt:${attemptId}`).emit('proctor:request-stream', {
        attemptId,
        viewerId: socket.id
      });
    });

    socket.on('stop-monitor-attempt', (attemptId) => {
      if (!attemptId || socket.user.role !== 'admin') return;
      socket.leave(`admin:attempt:${attemptId}`);
      io.to(`student:attempt:${attemptId}`).emit('proctor:stop-stream', {
        attemptId,
        viewerId: socket.id
      });
    });

    socket.on('webrtc:offer', async ({ attemptId, offer, viewerId }) => {
      if (socket.user.role !== 'student' || !attemptId || !offer) return;
      const attempt = await canStudentStreamAttempt(userId, attemptId);
      if (!attempt || attempt.state !== 'started') return;

      const destination = viewerId || `admin:attempt:${attemptId}`;
      io.to(destination).emit('webrtc:offer', {
        attemptId,
        viewerId: socket.id,
        offer
      });
    });

    socket.on('webrtc:answer', async ({ attemptId, answer, viewerId }) => {
      if (socket.user.role !== 'admin' || !attemptId || !answer) return;
      const attempt = await canMonitorAttempt(userId, attemptId);
      if (!attempt) return;

      const destination = viewerId || `student:attempt:${attemptId}`;
      io.to(destination).emit('webrtc:answer', {
        attemptId,
        viewerId: socket.id,
        answer
      });
    });

    socket.on('webrtc:ice', async ({ attemptId, candidate, target, viewerId }) => {
      if (!attemptId || !candidate) return;

      if (socket.user.role === 'student' && target === 'admin') {
        const attempt = await canStudentStreamAttempt(userId, attemptId);
        if (!attempt || attempt.state !== 'started') return;
        const destination = viewerId || `admin:attempt:${attemptId}`;
        io.to(destination).emit('webrtc:ice', {
          attemptId,
          viewerId: socket.id,
          candidate
        });
      }

      if (socket.user.role === 'admin' && target === 'student') {
        const attempt = await canMonitorAttempt(userId, attemptId);
        if (!attempt) return;
        const destination = viewerId || `student:attempt:${attemptId}`;
        io.to(destination).emit('webrtc:ice', {
          attemptId,
          viewerId: socket.id,
          candidate
        });
      }
    });

    socket.on('disconnect', () => {
      if (socket.attemptId && onlineAttempts.has(socket.attemptId)) {
        const attemptSockets = onlineAttempts.get(socket.attemptId);
        attemptSockets.delete(socket.id);

        if (attemptSockets.size === 0) {
          onlineAttempts.delete(socket.attemptId);
          cameraStatuses.delete(socket.attemptId);

          if (socket.examId) {
            io.to(`admin:exam:${socket.examId}`).emit('proctor:student-offline', {
              attemptId: socket.attemptId,
              examId: socket.examId,
              studentId: userId
            });
          }

          io.to(`admin:attempt:${socket.attemptId}`).emit('proctor:student-offline', {
            attemptId: socket.attemptId,
            examId: socket.examId,
            studentId: userId
          });
        }
      }
    });
  });

  app.set('io', io);
  return io;
}

module.exports = setupSockets;
