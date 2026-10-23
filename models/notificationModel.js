'use strict';

const crypto = require('crypto');
const db = require('../config/db');

class NotificationModel {
  static async ensureTable() {
    if (!this._tableReady) {
      this._tableReady = (async () => {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS notifications (
            id VARCHAR(36) PRIMARY KEY,
            user_id VARCHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            type VARCHAR(50) DEFAULT 'general',
            link VARCHAR(255) DEFAULT NULL,
            is_read TINYINT(1) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_user_read (user_id, is_read),
            INDEX idx_created (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        await db.execute(`
          CREATE TABLE IF NOT EXISTS user_notification_state (
            user_id VARCHAR(36) PRIMARY KEY,
            seeded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
      })();
    }
    return this._tableReady;
  }

  static async clearAll(userId) {
    await this.ensureTable();
    await db.execute(`DELETE FROM notifications WHERE user_id = ?`, [userId]);
    return true;
  }

  static async getByUserId(userId, limit = 50) {
    await this.ensureTable();
    const [rows] = await db.query(
      `SELECT id, user_id, title, message, type, link, is_read, created_at 
       FROM notifications 
       WHERE user_id = ? 
       ORDER BY created_at DESC 
       LIMIT ?`,
      [userId, Number(limit) || 50]
    );
    return rows;
  }

  static async getUnreadCount(userId) {
    await this.ensureTable();
    const [rows] = await db.query(
      `SELECT COUNT(*) AS unreadCount 
       FROM notifications 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return rows[0]?.unreadCount || 0;
  }

  static async markAsRead(notificationId, userId) {
    await this.ensureTable();
    const [result] = await db.execute(
      `UPDATE notifications 
       SET is_read = 1 
       WHERE id = ? AND user_id = ?`,
      [notificationId, userId]
    );
    return result.affectedRows > 0;
  }

  static async markAllAsRead(userId) {
    await this.ensureTable();
    const [result] = await db.execute(
      `UPDATE notifications 
       SET is_read = 1 
       WHERE user_id = ? AND is_read = 0`,
      [userId]
    );
    return result.affectedRows;
  }

  static async create({ userId, title, message, type = 'general', link = null }) {
    await this.ensureTable();
    const id = crypto.randomUUID();
    await db.execute(
      `INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW())`,
      [id, userId, title, message, type, link]
    );
    return { id, userId, title, message, type, link, is_read: 0 };
  }

  /**
   * Generates contextual starting notifications once per user.
   * If a user clears their notifications, they remain in a clean empty state.
   */
  static async ensureContextualNotifications(userId, role = 'student') {
    await this.ensureTable();
    const [stateRows] = await db.query(
      `SELECT 1 FROM user_notification_state WHERE user_id = ?`,
      [userId]
    );
    if (stateRows.length > 0) {
      return;
    }

    await db.execute(
      `INSERT IGNORE INTO user_notification_state (user_id) VALUES (?)`,
      [userId]
    );

    if (role === 'admin') {
      await this.create({
        userId,
        title: 'Faculty Intelligence Hub Live',
        message: 'Placement command center and analytics are synchronized for the current academic session.',
        type: 'system',
        link: '/admindash#command-center'
      });
      await this.create({
        userId,
        title: 'Aptitude Assessments Active',
        message: 'New aptitude assessment question banks are active and available for student scheduling.',
        type: 'exam',
        link: '/admindash#exams'
      });
      await this.create({
        userId,
        title: 'Compiler Engine Online',
        message: 'C-Visualize GCC worker service is active and handling student compilation requests.',
        type: 'compiler',
        link: '/compiler-practice'
      });
    } else {
      await this.create({
        userId,
        title: 'Aptitude Assessment Ready',
        message: 'Comprehensive Aptitude Assessments are live. Test your numerical and analytical skills.',
        type: 'exam',
        link: '/available-exams'
      });
      await this.create({
        userId,
        title: 'Campus Recruitment Preparation',
        message: 'Company-specific interview prep is available for Accenture, Adobe, and Amazon.',
        type: 'drive',
        link: '/companies'
      });
      await this.create({
        userId,
        title: 'AI Mock HR Interview Available',
        message: 'Practice real-time behavioral interview questions and receive instant scoring feedback.',
        type: 'interview',
        link: '/interviews'
      });
      await this.create({
        userId,
        title: 'Welcome to PlacementPro',
        message: 'Upload your resume for AI ATS scoring and explore curated CS study materials.',
        type: 'system',
        link: '/placement-workspace'
      });
    }
  }
}

module.exports = NotificationModel;
