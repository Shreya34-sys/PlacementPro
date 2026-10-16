'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const getInsertedId = (result) => {
  if (!result) return null;
  return result.id || result.insertId || (Array.isArray(result) && result[0]?.insertId);
};

class CVisualizeAuthController {
  async register(req, res) {
    try {
      const { username, fullName, name, email, password } = req.body;
      const studentName = username || fullName || name;

      if (!studentName || studentName.trim().length < 3) {
        return res.status(400).json({ success: false, error: 'Username must be at least 3 characters long.' });
      }
      if (!email || !email.includes('@')) {
        return res.status(400).json({ success: false, error: 'A valid email address is required.' });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      }

      const existing = await User.findByEmail(email.trim().toLowerCase());
      if (existing) {
        return res.status(400).json({ success: false, error: 'Email is already registered.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const createdUser = await User.createStudent({
        fullName: studentName.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword
      });

      const userId = getInsertedId(createdUser);
      const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
      const token = jwt.sign(
        { id: userId, email: email.trim().toLowerCase(), role: 'student', username: studentName.trim() },
        secret,
        { expiresIn: '1d' }
      );

      return res.status(201).json({
        success: true,
        message: 'User registered successfully.',
        data: {
          user: { id: userId, username: studentName.trim(), email: email.trim().toLowerCase(), role: 'student' },
          token
        }
      });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  async login(req, res) {
    try {
      const { username, email, usernameOrEmail, password } = req.body;
      const identifier = (usernameOrEmail || email || username || '').trim();

      if (!identifier || !password) {
        return res.status(400).json({ success: false, error: 'Username/email and password are required.' });
      }

      const user = await User.findByUsernameOrEmail(identifier);
      if (!user || !user.password) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, error: 'Invalid username or password.' });
      }

      const secret = process.env.JWT_SECRET || 'placementpro_secret_key_@987#';
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, username: user.fullName || user.email },
        secret,
        { expiresIn: '1d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful.',
        data: {
          user: {
            id: user.id,
            username: user.fullName || user.email,
            email: user.email,
            role: user.role
          },
          token
        }
      });
    } catch (err) {
      return res.status(401).json({ success: false, error: err.message });
    }
  }

  async logout(req, res) {
    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  }

  async me(req, res) {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }
    return res.status(200).json({
      success: true,
      data: {
        user: {
          id: req.user.id,
          username: req.user.username || req.user.fullName || req.user.email?.split('@')[0],
          email: req.user.email,
          role: req.user.role
        }
      }
    });
  }
}

module.exports = new CVisualizeAuthController();
