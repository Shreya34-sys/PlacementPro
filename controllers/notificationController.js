'use strict';

const NotificationModel = require('../models/notificationModel');

class NotificationController {
  async getNotifications(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const role = req.user?.role || 'student';
      // Ensure first-time user gets realistic system notifications if list is empty
      await NotificationModel.ensureContextualNotifications(userId, role);

      const notifications = await NotificationModel.getByUserId(userId);
      const unreadCount = await NotificationModel.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        data: notifications,
        unreadCount
      });
    } catch (error) {
      console.error('[NotificationController.getNotifications] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notifications.',
        error: error.message
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      const notificationId = req.params.id;
      if (!notificationId) {
        return res.status(400).json({ success: false, message: 'Notification ID is required.' });
      }

      const updated = await NotificationModel.markAsRead(notificationId, userId);
      const unreadCount = await NotificationModel.getUnreadCount(userId);

      return res.status(200).json({
        success: true,
        message: updated ? 'Notification marked as read.' : 'Notification already read or not found.',
        unreadCount
      });
    } catch (error) {
      console.error('[NotificationController.markAsRead] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update notification status.',
        error: error.message
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Authentication required.' });
      }

      await NotificationModel.markAllAsRead(userId);

      return res.status(200).json({
        success: true,
        message: 'All notifications marked as read.',
        unreadCount: 0
      });
    } catch (error) {
      console.error('[NotificationController.markAllAsRead] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to mark all notifications as read.',
        error: error.message
      });
    }
  }

  async createNotification(req, res) {
    try {
      const { userId, title, message, type, link } = req.body;
      const targetUserId = userId || req.user?.id;

      if (!targetUserId || !title || !message) {
        return res.status(400).json({
          success: false,
          message: 'userId, title, and message are required.'
        });
      }

      const notification = await NotificationModel.create({
        userId: targetUserId,
        title,
        message,
        type,
        link
      });

      return res.status(201).json({
        success: true,
        data: notification
      });
    } catch (error) {
      console.error('[NotificationController.createNotification] Error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create notification.',
        error: error.message
      });
    }
  }
}

module.exports = new NotificationController();
