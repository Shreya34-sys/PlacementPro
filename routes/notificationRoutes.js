'use strict';

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/', verifyToken, (req, res) => notificationController.getNotifications(req, res));
router.patch('/read-all', verifyToken, (req, res) => notificationController.markAllAsRead(req, res));
router.put('/read-all', verifyToken, (req, res) => notificationController.markAllAsRead(req, res));
router.patch('/:id/read', verifyToken, (req, res) => notificationController.markAsRead(req, res));
router.put('/:id/read', verifyToken, (req, res) => notificationController.markAsRead(req, res));
router.post('/', verifyToken, (req, res) => notificationController.createNotification(req, res));

module.exports = router;
