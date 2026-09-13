require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examRoutes = require('./routes/examRoutes');
const resumeRoutes = require('./routes/resumeRoutes');

const app = express();

// 1. Parsing and Static File Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// 2. Authentication Initialization
app.use(passport.initialize());

// 3. Explicit Page Routes (MUST come before catch-all view routes)
// app.get('/resume-analyzer', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'pages', 'resume-analyzer.html'));
// });

// 4. API Endpointsq
app.use('/api/exams', examRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/resume', resumeRoutes);
// 5. View Routes (Mounted last to prevent route blocking)
app.use('/', viewRoutes);

// 6. Cache Control Middleware
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));