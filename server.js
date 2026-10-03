
require('dotenv').config();
const http = require('http');
const express = require('express');
const path = require('path');
const passport = require('./config/passport');
const setupSockets = require('./config/socket');

const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examRoutes = require('./routes/examRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

const versantRoutes = require('./routes/versantRoutes');

const app = express();
const server = http.createServer(app); // Socket.IO must attach to an HTTP server, not app.listen().

app.use('/vendor/mediapipe', express.static(
    path.join(__dirname, 'node_modules/@mediapipe/tasks-vision')
));

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

// Socket.IO is available to controllers via req.app.get('io').
setupSockets(server, app);

app.use('/api/exams', examRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/versant', versantRoutes);

// Keep this last because it contains page/catch-all routes.
app.use('/', viewRoutes);

// Error handler: routes should call next(error), not expose database details.
app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ message: error.message || 'Unexpected server error.' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));