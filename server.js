// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');
const passport = require('./config/passport');

const authRoutes = require('./routes/authRoutes');
const viewRoutes = require('./routes/viewRoutes');

const studentRoutes = require('./routes/studentRoutes');

const app = express();

app.use(express.json());  //Parses incoming requests with JSON payloads (e.g., { "email": "user@test.com" }) and attaches the resulting object to req.body.
app.use(express.urlencoded({ extended: true }));  //Parses standard HTML form submissions (application/x-www-form-urlencoded) and populates req.body.reads the raw HTML form format (application/x-www-form-urlencoded) and converts it into JavaScript object req.body.
app.use(express.static(path.join(__dirname, 'public')));

// Stateless Passport initialization
app.use(passport.initialize());

app.use('/', viewRoutes);
app.use('/api/auth', authRoutes);

app.use('/api/student', studentRoutes);

// Middleware to prevent browser caching on authenticated pages
app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');  //Directs browsers and proxy servers never to store or cache response copies.
    res.set('Pragmatic', 'no-cache');
    res.set('Expires', '0');    //Marks cached content as immediately expired.
    next();
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));