const jwt = require('jsonwebtoken');
const db = require('../config/db');

function attachCodingSockets(io) {
  const coding = io.of('/coding');

  coding.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Unauthorized'));
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  coding.on('connection', socket => {
    socket.on('join-round', async roundId => {
      if (!roundId) return;

      try {
        if (socket.user.role === 'admin') {
          const [rows] = await db.execute(
            'SELECT id FROM coding_rounds WHERE id=? AND created_by=? AND deleted_at IS NULL',
            [roundId, socket.user.id]
          );
          if (!rows.length) return;
        } else {
          const [rows] = await db.execute(
            `SELECT r.id
             FROM coding_rounds r
             WHERE r.id=? AND r.status='published' AND r.deleted_at IS NULL`,
            [roundId]
          );
          if (!rows.length) return;
        }
        socket.join(`round:${roundId}`);
      } catch (error) {
        console.warn('Coding socket join-round failed:', error.message);
      }
    });

    socket.on('join-attempt', async attemptId => {
      if (!attemptId) return;

      try {
        const [rows] = await db.execute(
          'SELECT id, student_id FROM coding_attempts WHERE id=? LIMIT 1',
          [attemptId]
        );
        if (!rows.length) return;

        const attempt = rows[0];
        if (socket.user.role === 'student' && attempt.student_id !== socket.user.id) {
          return;
        }

        socket.join(`attempt:${attemptId}`);
      } catch (error) {
        console.warn('Coding socket join-attempt failed:', error.message);
      }
    });

    socket.on('monitor-attempt', async attemptId => {
      if (socket.user.role !== 'admin' || !attemptId) return;

      try {
        const [rows] = await db.execute(`
          SELECT a.id
          FROM coding_attempts a
          JOIN coding_rounds r ON r.id=a.round_id
          WHERE a.id=? AND r.created_by=? AND r.deleted_at IS NULL
        `, [attemptId, socket.user.id]);

        if (!rows.length) return;

        socket.join(`monitor:${attemptId}`);
        coding.to(`attempt:${attemptId}`).emit(
          'coding:request-stream',
          { attemptId }
        );
      } catch (error) {
        console.warn('Coding socket monitor-attempt failed:', error.message);
      }
    });
    socket.on('webrtc:offer', ({ attemptId, offer }) => {
      if (socket.user.role !== 'student' || !attemptId || !offer) return;
      coding.to(`monitor:${attemptId}`).emit('webrtc:offer', { attemptId, offer });
    });
    socket.on('webrtc:answer', ({ attemptId, answer }) => {
      if (socket.user.role !== 'admin' || !attemptId || !answer) return;
      coding.to(`attempt:${attemptId}`).emit('webrtc:answer', { attemptId, answer });
    });
    socket.on('webrtc:ice', ({ attemptId, candidate, target }) => {
      if (!attemptId || !candidate) return;
      if (socket.user.role === 'student' && target === 'admin')
        coding.to(`monitor:${attemptId}`).emit('webrtc:ice', { attemptId, candidate });
      if (socket.user.role === 'admin' && target === 'student')
        coding.to(`attempt:${attemptId}`).emit('webrtc:ice', { attemptId, candidate });
    });
  });

  return coding;
}

module.exports = attachCodingSockets;
