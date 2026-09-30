// server.js: const http=require('http'); const {Server}=require('socket.io'); const server=http.createServer(app); setupSockets(io); server.listen(PORT)
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
function setupSockets(httpServer, app) {
  const io = new Server(httpServer, { cors: { origin: false } });
  io.use((socket, next) => { try { socket.user = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET); next(); } catch { next(new Error('Unauthorized')); } });
  io.on('connection', socket => {
    socket.on('join-attempt', attemptId => socket.join(`student:attempt:${attemptId}`));
    socket.on('watch-exam', examId => { if (socket.user.role === 'admin') socket.join(`admin:exam:${examId}`); });
    socket.on('monitor-attempt', attemptId => { if (socket.user.role === 'admin') { socket.join(`admin:attempt:${attemptId}`); io.to(`student:attempt:${attemptId}`).emit('proctor:request-stream'); } });
    socket.on('webrtc:offer', ({ attemptId, offer }) => { if (socket.user.role === 'student') io.to(`admin:attempt:${attemptId}`).emit('webrtc:offer', { offer }); });
    socket.on('webrtc:answer', ({ attemptId, answer }) => { if (socket.user.role === 'admin') io.to(`student:attempt:${attemptId}`).emit('webrtc:answer', { answer }); });
    socket.on('webrtc:ice', ({ attemptId, candidate, target }) => { io.to(`${target}:attempt:${attemptId}`).emit('webrtc:ice', { candidate }); });
    socket.on('monitor-attempt', attemptId => { if (socket.user.role === 'admin') { socket.join(`admin:attempt:${attemptId}`); io.to(`student:attempt:${attemptId}`).emit('proctor:request-stream'); } });
    socket.on('webrtc:offer', ({ attemptId, offer }) => { if (socket.user.role === 'student') io.to(`admin:attempt:${attemptId}`).emit('webrtc:offer', { offer }); });
    socket.on('webrtc:answer', ({ attemptId, answer }) => { if (socket.user.role === 'admin') io.to(`student:attempt:${attemptId}`).emit('webrtc:answer', { answer }); });
  });
  app.set('io', io); return io;
}
module.exports = setupSockets;