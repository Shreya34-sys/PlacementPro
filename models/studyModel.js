const db = require('../config/db');
const { randomUUID } = require('crypto');

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

class StudyModel {
  static async ensureTables() {
    if (!this.tablesInitialized) {
      this.tablesInitialized = (async () => {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS study_subjects (
            id CHAR(36) PRIMARY KEY,
            name VARCHAR(150) NOT NULL,
            code VARCHAR(50) NOT NULL UNIQUE,
            category VARCHAR(50) NOT NULL DEFAULT 'Core CS',
            description TEXT NULL,
            icon VARCHAR(100) NOT NULL DEFAULT 'book',
            color VARCHAR(50) NOT NULL DEFAULT '#2563eb',
            display_order INT NOT NULL DEFAULT 0,
            status ENUM('draft', 'published', 'archived') NOT NULL DEFAULT 'published',
            created_by CHAR(36) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            INDEX ix_study_subjects_status (status, deleted_at, display_order)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS study_chapters (
            id CHAR(36) PRIMARY KEY,
            subject_id CHAR(36) NOT NULL,
            title VARCHAR(200) NOT NULL,
            description TEXT NULL,
            display_order INT NOT NULL DEFAULT 0,
            status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
            created_by CHAR(36) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            INDEX ix_study_chapters_subject (subject_id, status, deleted_at, display_order)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS study_topics (
            id CHAR(36) PRIMARY KEY,
            chapter_id CHAR(36) NOT NULL,
            subject_id CHAR(36) NOT NULL,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            content LONGTEXT NOT NULL,
            summary TEXT NULL,
            estimated_reading_minutes INT NOT NULL DEFAULT 5,
            display_order INT NOT NULL DEFAULT 0,
            status ENUM('draft', 'published') NOT NULL DEFAULT 'published',
            created_by CHAR(36) NOT NULL,
            views_count INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            INDEX ix_study_topics_lookup (subject_id, chapter_id, status, deleted_at, display_order),
            INDEX ix_study_topics_slug (slug)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS study_attachments (
            id CHAR(36) PRIMARY KEY,
            subject_id CHAR(36) NOT NULL,
            topic_id CHAR(36) NULL,
            title VARCHAR(255) NOT NULL,
            description TEXT NULL,
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_path VARCHAR(500) NOT NULL,
            file_size INT NOT NULL,
            file_type VARCHAR(100) NOT NULL,
            uploaded_by CHAR(36) NOT NULL,
            download_count INT NOT NULL DEFAULT 0,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            deleted_at DATETIME NULL,
            INDEX ix_study_attach_subject (subject_id, topic_id, deleted_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS study_bookmarks (
            id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            topic_id CHAR(36) NOT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_study_user_topic_bookmark (user_id, topic_id),
            INDEX ix_study_bookmarks_user (user_id, created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        await db.execute(`
          CREATE TABLE IF NOT EXISTS study_reading_progress (
            id CHAR(36) PRIMARY KEY,
            user_id CHAR(36) NOT NULL,
            subject_id CHAR(36) NOT NULL,
            topic_id CHAR(36) NOT NULL,
            is_completed TINYINT(1) NOT NULL DEFAULT 0,
            progress_percent INT NOT NULL DEFAULT 0,
            last_read_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY uq_study_user_topic_progress (user_id, topic_id),
            INDEX ix_study_progress_user (user_id, subject_id, last_read_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        // Ensure video columns exist on study_topics
        try {
          const [tCols] = await db.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
            WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'study_topics'
          `);
          const colSet = new Set(tCols.map(c => c.COLUMN_NAME));
          if (!colSet.has('video_url')) await db.execute(`ALTER TABLE study_topics ADD COLUMN video_url VARCHAR(500) NULL AFTER summary`);
          if (!colSet.has('video_title')) await db.execute(`ALTER TABLE study_topics ADD COLUMN video_title VARCHAR(255) NULL AFTER video_url`);
          if (!colSet.has('video_source')) await db.execute(`ALTER TABLE study_topics ADD COLUMN video_source VARCHAR(120) NULL AFTER video_title`);
          if (!colSet.has('video_objective')) await db.execute(`ALTER TABLE study_topics ADD COLUMN video_objective TEXT NULL AFTER video_source`);
        } catch (colErr) {
          console.warn('Column check warning:', colErr.message);
        }

        // Check if initial subjects exist, otherwise seed standard curriculum
        await StudyModel.seedInitialCurriculumIfEmpty();
      })().catch(err => {
        this.tablesInitialized = null;
        throw err;
      });
    }
    await this.tablesInitialized;
  }

  // --- SUBJECT METHODS ---

  static async listSubjects({ studentId = null, includeUnpublished = false, search = '', category = '' } = {}) {
    await StudyModel.ensureTables();

    let query = `
      SELECT s.id, s.name, s.code, s.category, s.description, s.icon, s.color,
             s.display_order, s.status, s.created_at, s.updated_at,
             COUNT(DISTINCT c.id) AS chapter_count,
             COUNT(DISTINCT t.id) AS topic_count,
             COUNT(DISTINCT a.id) AS attachment_count
      FROM study_subjects s
      LEFT JOIN study_chapters c ON c.subject_id = s.id AND c.deleted_at IS NULL ${includeUnpublished ? '' : "AND c.status = 'published'"}
      LEFT JOIN study_topics t ON t.chapter_id = c.id AND t.deleted_at IS NULL ${includeUnpublished ? '' : "AND t.status = 'published'"}
      LEFT JOIN study_attachments a ON a.subject_id = s.id AND a.deleted_at IS NULL
      WHERE s.deleted_at IS NULL
    `;

    const params = [];

    if (!includeUnpublished) {
      query += " AND s.status = 'published'";
    }

    if (category && category !== 'All') {
      query += " AND s.category = ?";
      params.push(category);
    }

    if (search) {
      query += " AND (s.name LIKE ? OR s.code LIKE ? OR s.description LIKE ?)";
      const pattern = `%${search}%`;
      params.push(pattern, pattern, pattern);
    }

    query += ` GROUP BY s.id ORDER BY s.display_order ASC, s.name ASC`;

    const [rows] = await db.execute(query, params);

    // If studentId provided, calculate student's reading progress per subject
    if (studentId) {
      const [progressRows] = await db.execute(`
        SELECT subject_id, COUNT(topic_id) AS completed_count
        FROM study_reading_progress
        WHERE user_id = ? AND is_completed = 1
        GROUP BY subject_id
      `, [studentId]);

      const progressMap = new Map(progressRows.map(r => [r.subject_id, Number(r.completed_count)]));

      return rows.map(r => {
        const totalTopics = Number(r.topic_count || 0);
        const completed = progressMap.get(r.id) || 0;
        const progressPct = totalTopics > 0 ? Math.min(100, Math.round((completed / totalTopics) * 100)) : 0;
        return {
          ...r,
          chapter_count: Number(r.chapter_count || 0),
          topic_count: totalTopics,
          attachment_count: Number(r.attachment_count || 0),
          completed_topics: completed,
          progress_percent: progressPct
        };
      });
    }

    return rows.map(r => ({
      ...r,
      chapter_count: Number(r.chapter_count || 0),
      topic_count: Number(r.topic_count || 0),
      attachment_count: Number(r.attachment_count || 0)
    }));
  }

  static async getSubject(idOrCode, studentId = null, includeUnpublished = false) {
    await StudyModel.ensureTables();

    const [subjects] = await db.execute(
      `SELECT * FROM study_subjects WHERE (id = ? OR code = ?) AND deleted_at IS NULL ${includeUnpublished ? '' : "AND status = 'published'"} LIMIT 1`,
      [idOrCode, idOrCode]
    );

    if (!subjects.length) return null;
    const subject = subjects[0];

    // Fetch chapters
    const [chapters] = await db.execute(
      `SELECT * FROM study_chapters WHERE subject_id = ? AND deleted_at IS NULL ${includeUnpublished ? '' : "AND status = 'published'"} ORDER BY display_order ASC, created_at ASC`,
      [subject.id]
    );

    // Fetch topics
    const [topics] = await db.execute(
      `SELECT id, chapter_id, subject_id, title, slug, summary, estimated_reading_minutes,
              display_order, status, views_count, created_at, updated_at
       FROM study_topics
       WHERE subject_id = ? AND deleted_at IS NULL ${includeUnpublished ? '' : "AND status = 'published'"}
       ORDER BY display_order ASC, created_at ASC`,
      [subject.id]
    );

    // Attach student progress and bookmarks if studentId exists
    let userProgressMap = new Map();
    let userBookmarksSet = new Set();

    if (studentId) {
      const [progress] = await db.execute(
        `SELECT topic_id, is_completed, progress_percent, last_read_at FROM study_reading_progress WHERE user_id = ? AND subject_id = ?`,
        [studentId, subject.id]
      );
      progress.forEach(p => userProgressMap.set(p.topic_id, p));

      const [bookmarks] = await db.execute(
        `SELECT b.topic_id FROM study_bookmarks b JOIN study_topics t ON t.id = b.topic_id WHERE b.user_id = ? AND t.subject_id = ?`,
        [studentId, subject.id]
      );
      bookmarks.forEach(b => userBookmarksSet.add(b.topic_id));
    }

    // Attach topics to chapters
    const topicsByChapter = new Map();
    topics.forEach(t => {
      const prog = userProgressMap.get(t.id);
      const enrichedTopic = {
        ...t,
        is_completed: prog ? Boolean(prog.is_completed) : false,
        progress_percent: prog ? Number(prog.progress_percent) : 0,
        last_read_at: prog ? prog.last_read_at : null,
        is_bookmarked: userBookmarksSet.has(t.id)
      };
      if (!topicsByChapter.has(t.chapter_id)) {
        topicsByChapter.set(t.chapter_id, []);
      }
      topicsByChapter.get(t.chapter_id).push(enrichedTopic);
    });

    const enrichedChapters = chapters.map(c => ({
      ...c,
      topics: topicsByChapter.get(c.id) || []
    }));

    // Fetch attachments for this subject
    const [attachments] = await db.execute(
      `SELECT * FROM study_attachments WHERE subject_id = ? AND deleted_at IS NULL ORDER BY created_at DESC`,
      [subject.id]
    );

    const totalTopics = topics.length;
    let completedTopics = 0;
    if (studentId) {
      topics.forEach(t => {
        if (userProgressMap.get(t.id)?.is_completed) completedTopics++;
      });
    }

    return {
      ...subject,
      total_topics: totalTopics,
      completed_topics: completedTopics,
      progress_percent: totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
      chapters: enrichedChapters,
      attachments
    };
  }

  static async createSubject(userId, data) {
    await StudyModel.ensureTables();
    const id = randomUUID();
    const code = slugify(data.code || data.name);
    await db.execute(`
      INSERT INTO study_subjects (id, name, code, category, description, icon, color, display_order, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      String(data.name || '').trim(),
      code,
      data.category || 'Core CS',
      data.description || null,
      data.icon || 'book',
      data.color || '#2563eb',
      Number(data.display_order || 0),
      data.status === 'draft' ? 'draft' : 'published',
      userId
    ]);
    return id;
  }

  static async updateSubject(id, userId, data, isAdmin = false) {
    await StudyModel.ensureTables();
    const code = data.code ? slugify(data.code) : undefined;
    const [result] = await db.execute(`
      UPDATE study_subjects
      SET name = COALESCE(?, name),
          code = COALESCE(?, code),
          category = COALESCE(?, category),
          description = COALESCE(?, description),
          icon = COALESCE(?, icon),
          color = COALESCE(?, color),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status)
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND created_by = ?'}
    `, [
      data.name ? String(data.name).trim() : null,
      code || null,
      data.category || null,
      data.description !== undefined ? data.description : null,
      data.icon || null,
      data.color || null,
      data.display_order !== undefined ? Number(data.display_order) : null,
      data.status || null,
      id,
      ...(isAdmin ? [] : [userId])
    ]);
    return result.affectedRows > 0;
  }

  static async deleteSubject(id, userId, isAdmin = false) {
    await StudyModel.ensureTables();
    const [result] = await db.execute(`
      UPDATE study_subjects
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND created_by = ?'}
    `, [id, ...(isAdmin ? [] : [userId])]);
    return result.affectedRows > 0;
  }

  // --- CHAPTER METHODS ---

  static async createChapter(userId, data) {
    await StudyModel.ensureTables();
    const id = randomUUID();
    const [maxOrder] = await db.execute(
      `SELECT COALESCE(MAX(display_order), 0) AS max_order FROM study_chapters WHERE subject_id = ? AND deleted_at IS NULL`,
      [data.subject_id]
    );
    const nextOrder = Number(data.display_order ?? (maxOrder[0].max_order + 1));

    await db.execute(`
      INSERT INTO study_chapters (id, subject_id, title, description, display_order, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.subject_id,
      String(data.title || '').trim(),
      data.description || null,
      nextOrder,
      data.status === 'draft' ? 'draft' : 'published',
      userId
    ]);
    return id;
  }

  static async updateChapter(id, userId, data, isAdmin = false) {
    await StudyModel.ensureTables();
    const [result] = await db.execute(`
      UPDATE study_chapters
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status)
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND created_by = ?'}
    `, [
      data.title ? String(data.title).trim() : null,
      data.description !== undefined ? data.description : null,
      data.display_order !== undefined ? Number(data.display_order) : null,
      data.status || null,
      id,
      ...(isAdmin ? [] : [userId])
    ]);
    return result.affectedRows > 0;
  }

  static async deleteChapter(id, userId, isAdmin = false) {
    await StudyModel.ensureTables();
    const [result] = await db.execute(`
      UPDATE study_chapters
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND created_by = ?'}
    `, [id, ...(isAdmin ? [] : [userId])]);
    return result.affectedRows > 0;
  }

  // --- TOPIC METHODS ---

  static async getTopic(idOrSlug, studentId = null, includeUnpublished = false) {
    await StudyModel.ensureTables();

    const [rows] = await db.execute(`
      SELECT t.*,
             c.title AS chapter_title,
             c.display_order AS chapter_order,
             s.name AS subject_name,
             s.code AS subject_code,
             s.color AS subject_color,
             u.fullName AS author_name
      FROM study_topics t
      JOIN study_chapters c ON c.id = t.chapter_id AND c.deleted_at IS NULL
      JOIN study_subjects s ON s.id = t.subject_id AND s.deleted_at IS NULL
      LEFT JOIN users u ON u.id = t.created_by
      WHERE (t.id = ? OR t.slug = ?) AND t.deleted_at IS NULL
      ${includeUnpublished ? '' : "AND t.status = 'published' AND c.status = 'published' AND s.status = 'published'"}
      LIMIT 1
    `, [idOrSlug, idOrSlug]);

    if (!rows.length) return null;
    const topic = rows[0];

    // Increment views asynchronously
    db.execute(`UPDATE study_topics SET views_count = views_count + 1 WHERE id = ?`, [topic.id]).catch(() => {});

    // Find Previous and Next topics in the same subject
    const [orderedTopics] = await db.execute(`
      SELECT t.id, t.title, t.slug, c.title AS chapter_title
      FROM study_topics t
      JOIN study_chapters c ON c.id = t.chapter_id AND c.deleted_at IS NULL ${includeUnpublished ? '' : "AND c.status = 'published'"}
      WHERE t.subject_id = ? AND t.deleted_at IS NULL ${includeUnpublished ? '' : "AND t.status = 'published'"}
      ORDER BY c.display_order ASC, t.display_order ASC, t.created_at ASC
    `, [topic.subject_id]);

    const currentIndex = orderedTopics.findIndex(item => item.id === topic.id);
    const prevTopic = currentIndex > 0 ? orderedTopics[currentIndex - 1] : null;
    const nextTopic = currentIndex >= 0 && currentIndex < orderedTopics.length - 1 ? orderedTopics[currentIndex + 1] : null;

    // Attachments mapped to this topic or this subject
    const [attachments] = await db.execute(`
      SELECT * FROM study_attachments
      WHERE (topic_id = ? OR (subject_id = ? AND topic_id IS NULL)) AND deleted_at IS NULL
      ORDER BY created_at DESC
    `, [topic.id, topic.subject_id]);

    // Student bookmark and reading progress
    let isBookmarked = false;
    let readingProgress = { is_completed: false, progress_percent: 0 };

    if (studentId) {
      const [bm] = await db.execute(`SELECT 1 FROM study_bookmarks WHERE user_id = ? AND topic_id = ?`, [studentId, topic.id]);
      isBookmarked = bm.length > 0;

      const [prog] = await db.execute(`SELECT is_completed, progress_percent FROM study_reading_progress WHERE user_id = ? AND topic_id = ?`, [studentId, topic.id]);
      if (prog.length) {
        readingProgress = {
          is_completed: Boolean(prog[0].is_completed),
          progress_percent: Number(prog[0].progress_percent)
        };
      }

      // Record this visit in reading progress as last_read_at
      await db.execute(`
        INSERT INTO study_reading_progress (id, user_id, subject_id, topic_id, is_completed, progress_percent, last_read_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE last_read_at = NOW()
      `, [randomUUID(), studentId, topic.subject_id, topic.id, readingProgress.is_completed ? 1 : 0, readingProgress.progress_percent]);
    }

    return {
      ...topic,
      breadcrumbs: {
        subject: { id: topic.subject_id, name: topic.subject_name, code: topic.subject_code },
        chapter: { id: topic.chapter_id, title: topic.chapter_title }
      },
      prevTopic,
      nextTopic,
      attachments,
      is_bookmarked: isBookmarked,
      reading_progress: readingProgress
    };
  }

  static async createTopic(userId, data) {
    await StudyModel.ensureTables();
    const id = randomUUID();
    let slug = slugify(data.slug || data.title);

    // Ensure slug uniqueness
    const [existing] = await db.execute(`SELECT id FROM study_topics WHERE slug = ?`, [slug]);
    if (existing.length) {
      slug = `${slug}-${id.slice(0, 6)}`;
    }

    const [maxOrder] = await db.execute(
      `SELECT COALESCE(MAX(display_order), 0) AS max_order FROM study_topics WHERE chapter_id = ? AND deleted_at IS NULL`,
      [data.chapter_id]
    );
    const nextOrder = Number(data.display_order ?? (maxOrder[0].max_order + 1));

    await db.execute(`
      INSERT INTO study_topics
      (id, chapter_id, subject_id, title, slug, content, summary, video_url, video_title, video_source, video_objective, estimated_reading_minutes, display_order, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.chapter_id,
      data.subject_id,
      String(data.title || '').trim(),
      slug,
      String(data.content || ''),
      data.summary || null,
      data.video_url || null,
      data.video_title || null,
      data.video_source || null,
      data.video_objective || null,
      Number(data.estimated_reading_minutes || 5),
      nextOrder,
      data.status === 'draft' ? 'draft' : 'published',
      userId
    ]);

    return { id, slug };
  }

  static async updateTopic(id, userId, data, isAdmin = false) {
    await StudyModel.ensureTables();
    let slug = data.slug ? slugify(data.slug) : undefined;
    if (slug) {
      const [existing] = await db.execute(`SELECT id FROM study_topics WHERE slug = ? AND id != ?`, [slug, id]);
      if (existing.length) slug = `${slug}-${id.slice(0, 6)}`;
    }

    const [result] = await db.execute(`
      UPDATE study_topics
      SET chapter_id = COALESCE(?, chapter_id),
          subject_id = COALESCE(?, subject_id),
          title = COALESCE(?, title),
          slug = COALESCE(?, slug),
          content = COALESCE(?, content),
          summary = COALESCE(?, summary),
          video_url = COALESCE(?, video_url),
          video_title = COALESCE(?, video_title),
          video_source = COALESCE(?, video_source),
          video_objective = COALESCE(?, video_objective),
          estimated_reading_minutes = COALESCE(?, estimated_reading_minutes),
          display_order = COALESCE(?, display_order),
          status = COALESCE(?, status)
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND created_by = ?'}
    `, [
      data.chapter_id || null,
      data.subject_id || null,
      data.title ? String(data.title).trim() : null,
      slug || null,
      data.content !== undefined ? String(data.content) : null,
      data.summary !== undefined ? data.summary : null,
      data.video_url !== undefined ? data.video_url : null,
      data.video_title !== undefined ? data.video_title : null,
      data.video_source !== undefined ? data.video_source : null,
      data.video_objective !== undefined ? data.video_objective : null,
      data.estimated_reading_minutes !== undefined ? Number(data.estimated_reading_minutes) : null,
      data.display_order !== undefined ? Number(data.display_order) : null,
      data.status || null,
      id,
      ...(isAdmin ? [] : [userId])
    ]);

    return result.affectedRows > 0;
  }

  static async deleteTopic(id, userId, isAdmin = false) {
    await StudyModel.ensureTables();
    const [result] = await db.execute(`
      UPDATE study_topics
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND created_by = ?'}
    `, [id, ...(isAdmin ? [] : [userId])]);
    return result.affectedRows > 0;
  }

  static async searchTopics(searchTerm, studentId = null, limit = 20) {
    await StudyModel.ensureTables();
    if (!searchTerm || !searchTerm.trim()) return [];

    const pattern = `%${searchTerm.trim()}%`;
    const [rows] = await db.execute(`
      SELECT t.id, t.title, t.slug, t.summary, t.estimated_reading_minutes,
             c.title AS chapter_title,
             s.name AS subject_name,
             s.code AS subject_code,
             s.color AS subject_color
      FROM study_topics t
      JOIN study_chapters c ON c.id = t.chapter_id AND c.deleted_at IS NULL AND c.status = 'published'
      JOIN study_subjects s ON s.id = t.subject_id AND s.deleted_at IS NULL AND s.status = 'published'
      WHERE t.deleted_at IS NULL AND t.status = 'published'
        AND (t.title LIKE ? OR t.summary LIKE ? OR s.name LIKE ? OR c.title LIKE ?)
      ORDER BY t.views_count DESC, t.title ASC
      LIMIT ?
    `, [pattern, pattern, pattern, pattern, Number(limit)]);

    return rows;
  }

  // --- BOOKMARKS & PROGRESS ---

  static async toggleBookmark(userId, topicId) {
    await StudyModel.ensureTables();
    const [existing] = await db.execute(
      `SELECT id FROM study_bookmarks WHERE user_id = ? AND topic_id = ?`,
      [userId, topicId]
    );

    if (existing.length) {
      await db.execute(`DELETE FROM study_bookmarks WHERE id = ?`, [existing[0].id]);
      return { bookmarked: false };
    } else {
      await db.execute(
        `INSERT INTO study_bookmarks (id, user_id, topic_id) VALUES (?, ?, ?)`,
        [randomUUID(), userId, topicId]
      );
      return { bookmarked: true };
    }
  }

  static async listBookmarks(userId) {
    await StudyModel.ensureTables();
    const [rows] = await db.execute(`
      SELECT b.id AS bookmark_id, b.created_at AS bookmarked_at,
             t.id AS topic_id, t.title AS topic_title, t.slug AS topic_slug,
             t.estimated_reading_minutes, t.summary,
             c.title AS chapter_title,
             s.id AS subject_id, s.name AS subject_name, s.code AS subject_code, s.color AS subject_color,
             p.is_completed, p.progress_percent
      FROM study_bookmarks b
      JOIN study_topics t ON t.id = b.topic_id AND t.deleted_at IS NULL AND t.status = 'published'
      JOIN study_chapters c ON c.id = t.chapter_id AND c.deleted_at IS NULL AND c.status = 'published'
      JOIN study_subjects s ON s.id = t.subject_id AND s.deleted_at IS NULL AND s.status = 'published'
      LEFT JOIN study_reading_progress p ON p.user_id = b.user_id AND p.topic_id = t.id
      WHERE b.user_id = ?
      ORDER BY b.created_at DESC
    `, [userId]);

    return rows.map(r => ({
      ...r,
      is_completed: Boolean(r.is_completed),
      progress_percent: Number(r.progress_percent || 0)
    }));
  }

  static async updateReadingProgress(userId, topicId, { progressPercent = 0, isCompleted = false } = {}) {
    await StudyModel.ensureTables();

    // Look up subject_id for this topic
    const [topic] = await db.execute(`SELECT subject_id FROM study_topics WHERE id = ?`, [topicId]);
    if (!topic.length) throw new Error('Topic not found');
    const subjectId = topic[0].subject_id;

    const completedVal = isCompleted ? 1 : 0;
    const progressVal = Math.min(100, Math.max(0, Number(progressPercent || (isCompleted ? 100 : 0))));

    await db.execute(`
      INSERT INTO study_reading_progress (id, user_id, subject_id, topic_id, is_completed, progress_percent, last_read_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE
        is_completed = VALUES(is_completed),
        progress_percent = VALUES(progress_percent),
        last_read_at = NOW()
    `, [randomUUID(), userId, subjectId, topicId, completedVal, progressVal]);

    return { isCompleted: Boolean(completedVal), progressPercent: progressVal };
  }

  static async getRecentlyViewed(userId, limit = 5) {
    await StudyModel.ensureTables();
    const [rows] = await db.execute(`
      SELECT p.last_read_at, p.is_completed, p.progress_percent,
             t.id AS topic_id, t.title AS topic_title, t.slug AS topic_slug,
             t.estimated_reading_minutes,
             c.title AS chapter_title,
             s.name AS subject_name, s.code AS subject_code, s.color AS subject_color
      FROM study_reading_progress p
      JOIN study_topics t ON t.id = p.topic_id AND t.deleted_at IS NULL AND t.status = 'published'
      JOIN study_chapters c ON c.id = t.chapter_id AND c.deleted_at IS NULL AND c.status = 'published'
      JOIN study_subjects s ON s.id = p.subject_id AND s.deleted_at IS NULL AND s.status = 'published'
      WHERE p.user_id = ?
      ORDER BY p.last_read_at DESC
      LIMIT ?
    `, [userId, Number(limit)]);

    return rows.map(r => ({
      ...r,
      is_completed: Boolean(r.is_completed),
      progress_percent: Number(r.progress_percent || 0)
    }));
  }

  static async getStudentStudyStats(userId) {
    await StudyModel.ensureTables();

    const [compRows] = await db.execute(
      `SELECT COUNT(*) AS completed_count FROM study_reading_progress WHERE user_id = ? AND is_completed = 1`,
      [userId]
    );
    const [bmRows] = await db.execute(
      `SELECT COUNT(*) AS bookmark_count FROM study_bookmarks WHERE user_id = ?`,
      [userId]
    );
    const [totalTopicsRows] = await db.execute(
      `SELECT COUNT(*) AS total_count FROM study_topics WHERE deleted_at IS NULL AND status = 'published'`
    );

    const completed = Number(compRows[0]?.completed_count || 0);
    const bookmarked = Number(bmRows[0]?.bookmark_count || 0);
    const total = Number(totalTopicsRows[0]?.total_count || 0);

    return {
      completedTopics: completed,
      bookmarkedTopics: bookmarked,
      totalTopicsAvailable: total,
      overallProgress: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  // --- ATTACHMENTS ---

  static async createAttachment(userId, data) {
    await StudyModel.ensureTables();
    const id = randomUUID();
    await db.execute(`
      INSERT INTO study_attachments
      (id, subject_id, topic_id, title, description, file_name, original_name, file_path, file_size, file_type, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id,
      data.subject_id,
      data.topic_id || null,
      String(data.title || '').trim(),
      data.description || null,
      data.file_name,
      data.original_name,
      data.file_path,
      Number(data.file_size),
      data.file_type,
      userId
    ]);
    return id;
  }

  static async getAttachment(id) {
    await StudyModel.ensureTables();
    const [rows] = await db.execute(`SELECT * FROM study_attachments WHERE id = ? AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
  }

  static async incrementDownload(id) {
    await db.execute(`UPDATE study_attachments SET download_count = download_count + 1 WHERE id = ?`, [id]);
  }

  static async listAttachments({ subjectId = null, topicId = null } = {}) {
    await StudyModel.ensureTables();
    let query = `SELECT a.*, s.name AS subject_name, t.title AS topic_title
                 FROM study_attachments a
                 JOIN study_subjects s ON s.id = a.subject_id
                 LEFT JOIN study_topics t ON t.id = a.topic_id
                 WHERE a.deleted_at IS NULL`;
    const params = [];
    if (subjectId) {
      query += ` AND a.subject_id = ?`;
      params.push(subjectId);
    }
    if (topicId) {
      query += ` AND a.topic_id = ?`;
      params.push(topicId);
    }
    query += ` ORDER BY a.created_at DESC`;
    const [rows] = await db.execute(query, params);
    return rows;
  }

  static async deleteAttachment(id, userId, isAdmin = false) {
    await StudyModel.ensureTables();
    const [result] = await db.execute(`
      UPDATE study_attachments
      SET deleted_at = NOW()
      WHERE id = ? AND deleted_at IS NULL ${isAdmin ? '' : 'AND uploaded_by = ?'}
    `, [id, ...(isAdmin ? [] : [userId])]);
    return result.affectedRows > 0;
  }

  // --- SEED INITIAL CURRICULUM ---

  static async seedInitialCurriculumIfEmpty() {
    const [existing] = await db.execute(`SELECT COUNT(*) AS count FROM study_subjects WHERE deleted_at IS NULL`);
    if (Number(existing[0]?.count || 0) > 0) return;

    // Fetch an admin user id to attribute the seed curriculum
    const [admins] = await db.execute(`SELECT id FROM users WHERE role IN ('admin', 'faculty') LIMIT 1`);
    const authorId = admins[0]?.id || '8b964856-ee3c-45cd-a048-7d4a991734c3';

    const subjectsData = [
      {
        name: 'Database Management Systems (DBMS)',
        code: 'dbms',
        category: 'Core CS',
        icon: 'database',
        color: '#2563eb',
        description: 'Relational data models, normalization, indexing, transaction processing, ACID properties, and concurrency control.',
        chapters: [
          {
            title: '1. Introduction & Three-Tier Architecture',
            topics: [
              {
                title: 'Introduction to DBMS & File Systems vs DBMS',
                slug: 'intro-to-dbms-vs-file-system',
                summary: 'Core definitions, architectural need, and fundamental differences between conventional file systems and modern database management systems.',
                minutes: 6,
                content: `
                  <h2>What is a Database Management System (DBMS)?</h2>
                  <div class="callout callout-def">
                    <strong>Definition:</strong> A Database Management System (DBMS) is specialized system software designed to create, define, manipulate, retrieve, and manage structured collections of persistent data efficiently, securely, and consistently across concurrent users and applications.
                  </div>

                  <p>In early computing architectures, applications stored data in flat operating system files (e.g. CSV or custom binary records). As organizational software scaled, file processing systems encountered critical architectural bottlenecks that necessitated the creation of modern DBMS engines.</p>

                  <h3>Comparison: File System vs DBMS Architecture</h3>
                  <table class="tutorial-table">
                    <thead>
                      <tr>
                        <th>Criteria</th>
                        <th>Traditional File Processing System</th>
                        <th>Database Management System (DBMS)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Data Redundancy</strong></td>
                        <td>High redundancy across duplicate departmental files.</td>
                        <td>Centralized schema drastically reduces redundant data duplication.</td>
                      </tr>
                      <tr>
                        <td><strong>Data Consistency</strong></td>
                        <td>Prone to anomalies when one copy is updated and others are not.</td>
                        <td>Guaranteed consistency via ACID transactions and normalization.</td>
                      </tr>
                      <tr>
                        <td><strong>Concurrent Access</strong></td>
                        <td>File locking causes bottlenecks or read/write collisions.</td>
                        <td>Sophisticated concurrency control protocols (2PL, Timestamping).</td>
                      </tr>
                      <tr>
                        <td><strong>Data Independence</strong></td>
                        <td>Tight coupling between storage layout and application code.</td>
                        <td>Physical and logical data independence via 3-schema architecture.</td>
                      </tr>
                      <tr>
                        <td><strong>Crash Recovery</strong></td>
                        <td>Manual file repair; partial file corruption risks data loss.</td>
                        <td>Write-Ahead Logging (WAL) and automated rollbacks via redo/undo logs.</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>Three-Level ANSI/SPARC Database Architecture</h3>
                  <p>The standard architectural model defines three distinct abstraction levels to isolate application programs from physical storage:</p>
                  <ul>
                    <li><strong>External Level (View Level):</strong> Customized views provided to specific users or roles. End users see only the data relevant to their operational domain.</li>
                    <li><strong>Conceptual Level (Logical Level):</strong> Describes what data is stored in whole database, relational entities, attributes, relationships, and integrity constraints.</li>
                    <li><strong>Internal Level (Physical Level):</strong> Defines how data is physically stored on disk, including B+ Tree indexes, page clustering, hashing algorithms, and byte offsets.</li>
                  </ul>

                  <div class="callout callout-points">
                    <strong>Key Exam Takeaways:</strong>
                    <ul>
                      <li>Physical Data Independence allows altering physical storage without altering the conceptual schema.</li>
                      <li>Logical Data Independence allows altering the conceptual schema without rewriting user view programs.</li>
                      <li>Metadata (data about data) is stored in the system catalog / data dictionary.</li>
                    </ul>
                  </div>
                `
              },
              {
                title: 'ACID Properties in Transactions',
                slug: 'acid-properties-in-dbms',
                summary: 'Detailed theory of Atomicity, Consistency, Isolation, and Durability in relational database transactions.',
                minutes: 7,
                content: `
                  <h2>Understanding ACID Properties</h2>
                  <div class="callout callout-def">
                    <strong>Transaction Definition:</strong> A transaction is an atomic sequence of database operations (reads and writes) that executes as a single logical unit of work. Either all operations execute completely, or none take effect.
                  </div>

                  <p>To ensure database reliability during concurrent access and unexpected hardware/software crashes, a transaction must satisfy the four classical ACID guarantees:</p>

                  <div class="grid-2-col">
                    <div class="theory-card">
                      <h3>1. Atomicity ("All or Nothing")</h3>
                      <p>Every single operation in the transaction must complete successfully. If any instruction fails midway (e.g. system crash or constraint violation), the database must roll back all previous changes made by that transaction.</p>
                      <small><strong>Enforced By:</strong> Transaction Recovery Manager using Undo Logs.</small>
                    </div>

                    <div class="theory-card">
                      <h3>2. Consistency ("Preserving Invariants")</h3>
                      <p>The database must transition from one valid state to another valid state, satisfying all declared integrity constraints, foreign keys, uniqueness rules, and business balance invariants.</p>
                      <small><strong>Enforced By:</strong> DBMS constraint verifiers and application business logic.</small>
                    </div>

                    <div class="theory-card">
                      <h3>3. Isolation ("Independent Concurrency")</h3>
                      <p>Multiple transactions executing concurrently must not interfere with one another. The intermediate, uncommitted states of one transaction must remain invisible to other concurrent operations.</p>
                      <small><strong>Enforced By:</strong> Concurrency Control Manager (Locking, MVCC, 2PL).</small>
                    </div>

                    <div class="theory-card">
                      <h3>4. Durability ("Permanent Commitment")</h3>
                      <p>Once a transaction commits, its modifications are permanently recorded in non-volatile storage and survive power outages, operating system crashes, and memory failures.</p>
                      <small><strong>Enforced By:</strong> Write-Ahead Logging (WAL) and Redo Logs.</small>
                    </div>
                  </div>

                  <h3>Concrete Example: Bank Account Transfer</h3>
                  <p>Consider transferring $500 from Account A ($2000) to Account B ($1000):</p>
                  <pre class="code-block"><code>-- Logical Transaction Sequence
BEGIN TRANSACTION;
  READ(A);
  A := A - 500;
  WRITE(A);
  -- If power failure occurs here, Atomicity rolls back A to 2000
  READ(B);
  B := B + 500;
  WRITE(B);
COMMIT;</code></pre>

                  <table class="tutorial-table">
                    <thead>
                      <tr>
                        <th>Property</th>
                        <th>Violation Scenario (What Happens Without It)</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Atomicity Violated</strong></td>
                        <td>A is debited $500, crash occurs, B is never credited. $500 disappears.</td>
                      </tr>
                      <tr>
                        <td><strong>Consistency Violated</strong></td>
                        <td>Total money (A + B) before was $3000, but after a corrupt write it becomes $2500.</td>
                      </tr>
                      <tr>
                        <td><strong>Isolation Violated</strong></td>
                        <td>Another transaction reads uncommitted A = $1500 before this transaction rolls back.</td>
                      </tr>
                      <tr>
                        <td><strong>Durability Violated</strong></td>
                        <td>Transaction commits, user sees confirmation, but immediate power failure erases the change.</td>
                      </tr>
                    </tbody>
                  </table>
                `
              }
            ]
          },
          {
            title: '2. Normalization & Functional Dependencies',
            topics: [
              {
                title: 'Database Normalization: 1NF, 2NF, 3NF, and BCNF',
                slug: 'database-normalization-1nf-2nf-3nf-bcnf',
                summary: 'Step-by-step mathematical guide to relational normalization eliminating insertion, deletion, and update anomalies.',
                minutes: 8,
                content: `
                  <h2>Database Normalization</h2>
                  <div class="callout callout-def">
                    <strong>Definition:</strong> Normalization is a systematic, mathematical process of decomposing tables with redundant data into smaller, well-structured relational schemas that preserve functional dependencies and lossless join guarantees.
                  </div>

                  <h3>Why Normalize? The Three Classic Anomalies</h3>
                  <ul>
                    <li><strong>Insertion Anomaly:</strong> Inability to insert information about an entity without supplying unrelated attributes (e.g., unable to add a new department until a student is enrolled).</li>
                    <li><strong>Deletion Anomaly:</strong> Unintended loss of crucial information when deleting an unrelated tuple (e.g., deleting the last student accidentally deletes the department record).</li>
                    <li><strong>Update Anomaly:</strong> Having to update duplicate values in dozens of rows; if one row is missed, data becomes inconsistent.</li>
                  </ul>

                  <h3>The Normal Forms Hierarchy</h3>
                  <div class="nf-step-box">
                    <h4>1. First Normal Form (1NF)</h4>
                    <p><strong>Rule:</strong> All attribute values must be <em>atomic</em> (single-valued). No repeating groups or multivalued arrays allowed.</p>
                  </div>

                  <div class="nf-step-box">
                    <h4>2. Second Normal Form (2NF)</h4>
                    <p><strong>Rule:</strong> The relation must be in 1NF, and <em>no non-prime attribute may depend on a proper subset of any candidate key</em> (No partial functional dependency).</p>
                    <p><em>Applies specifically to relations with composite candidate keys!</em></p>
                  </div>

                  <div class="nf-step-box">
                    <h4>3. Third Normal Form (3NF)</h4>
                    <p><strong>Rule:</strong> The relation must be in 2NF, and <em>no non-prime attribute may depend on another non-prime attribute</em> (No transitive functional dependency).</p>
                    <p>Formally: For every non-trivial FD <code>X &rarr; Y</code>, either <code>X</code> is a superkey, or <code>Y</code> is a prime attribute.</p>
                  </div>

                  <div class="nf-step-box">
                    <h4>4. Boyce-Codd Normal Form (BCNF)</h4>
                    <p><strong>Rule:</strong> A stricter version of 3NF. For every non-trivial functional dependency <code>X &rarr; Y</code>, <code>X</code> must strictly be a <strong>superkey</strong>.</p>
                  </div>

                  <div class="callout callout-points">
                    <strong>Key Interview Formula:</strong> Every relation in BCNF is guaranteed to be in 3NF, 2NF, and 1NF. However, BCNF decomposition does not always preserve functional dependencies, whereas 3NF always achieves dependency preservation and lossless joins.
                  </div>
                `
              }
            ]
          }
        ]
      },
      {
        name: 'Operating Systems (OS)',
        code: 'os',
        category: 'Core CS',
        icon: 'cpu',
        color: '#10b981',
        description: 'Processes, threads, CPU scheduling algorithms, synchronization primitives, deadlocks, paging, and virtual memory.',
        chapters: [
          {
            title: '1. Process Management & Concurrency',
            topics: [
              {
                title: 'Process vs Thread and Context Switching',
                slug: 'process-vs-thread-and-context-switching',
                summary: 'Comprehensive comparison between heavy-weight processes and light-weight threads with PCB and TCB structures.',
                minutes: 6,
                content: `
                  <h2>Process vs Thread Architecture</h2>
                  <div class="callout callout-def">
                    <strong>Process:</strong> An active program in execution possessing its own private virtual address space, memory segments (Code, Data, Heap, Stack), file descriptors, and Process Control Block (PCB).
                  </div>
                  <div class="callout callout-def">
                    <strong>Thread:</strong> The smallest schedulable unit of CPU execution within a process, sharing the code, data, heap, and open OS resources of the parent process while maintaining its own private stack and register set.
                  </div>

                  <h3>Structural Memory Comparison</h3>
                  <table class="tutorial-table">
                    <thead>
                      <tr>
                        <th>Component</th>
                        <th>Process</th>
                        <th>Thread</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Address Space</strong></td>
                        <td>Separate, isolated memory protected by MMU page tables.</td>
                        <td>Shared virtual address space within the parent process.</td>
                      </tr>
                      <tr>
                        <td><strong>Creation Overhead</strong></td>
                        <td>Heavy (requires allocating page tables, file descriptors, address space).</td>
                        <td>Lightweight (allocates only stack, registers, and Thread Control Block).</td>
                      </tr>
                      <tr>
                        <td><strong>Inter-communication</strong></td>
                        <td>Requires IPC (pipes, message queues, sockets, shared memory).</td>
                        <td>Direct memory reads/writes to shared heap and global variables.</td>
                      </tr>
                      <tr>
                        <td><strong>Crash Isolation</strong></td>
                        <td>One crashing process does not crash other processes.</td>
                        <td>An unhandled exception in one thread can crash the entire process.</td>
                      </tr>
                      <tr>
                        <td><strong>Context Switch Time</strong></td>
                        <td>High (must flush TLB cache, switch page directory tables).</td>
                        <td>Low (only saves/restores CPU registers and stack pointer; TLB intact).</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>What Happens During a CPU Context Switch?</h3>
                  <ol>
                    <li>Hardware interrupts or system call switches CPU from user mode to kernel mode.</li>
                    <li>Current program counter (PC), CPU general-purpose registers, and flags are saved into the process's PCB.</li>
                    <li>OS scheduler selects the next ready process from the Ready Queue.</li>
                    <li>Memory Management Unit (MMU) updates base page table registers (flushing Translation Lookaside Buffer).</li>
                    <li>Registers and stack pointer of the new process are restored from its PCB.</li>
                    <li>CPU transitions back to user mode at the restored Program Counter address.</li>
                  </ol>
                `
              },
              {
                title: 'Deadlock Characterization & Prevention',
                slug: 'deadlock-characterization-and-prevention',
                summary: 'The Coffman conditions, resource allocation graphs, Banker algorithm avoidance, and detection strategies.',
                minutes: 7,
                content: `
                  <h2>Deadlocks in Operating Systems</h2>
                  <div class="callout callout-def">
                    <strong>Definition:</strong> A deadlock is a permanent stall condition where a set of concurrent processes are blocked because every process holds a resource while waiting for another resource currently held by another process in the set.
                  </div>

                  <h3>The Four Necessary Coffman Conditions</h3>
                  <p>All four conditions must occur simultaneously for a deadlock to arise:</p>
                  <ul>
                    <li><strong>1. Mutual Exclusion:</strong> At least one resource must be held in a non-shareable mode (only one process can use it at a time).</li>
                    <li><strong>2. Hold and Wait:</strong> A process must be holding at least one resource and requesting additional resources currently held by others.</li>
                    <li><strong>3. No Preemption:</strong> Resources cannot be forcibly seized; a resource can only be released voluntarily by the process holding it after task completion.</li>
                    <li><strong>4. Circular Wait:</strong> A closed chain of processes <code>{P0, P1, ..., Pn}</code> exists such that <code>P0</code> waits for a resource held by <code>P1</code>, <code>P1</code> waits for <code>P2</code>, ..., and <code>Pn</code> waits for <code>P0</code>.</li>
                  </ul>

                  <h3>Deadlock Handling Strategies</h3>
                  <table class="tutorial-table">
                    <thead>
                      <tr>
                        <th>Strategy</th>
                        <th>Technique</th>
                        <th>Trade-off</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><strong>Deadlock Prevention</strong></td>
                        <td>Eliminate at least one of the four Coffman conditions (e.g. impose total ordering on all resources).</td>
                        <td>Low resource utilization and reduced process concurrency.</td>
                      </tr>
                      <tr>
                        <td><strong>Deadlock Avoidance</strong></td>
                        <td>Use dynamic state inspection (e.g., Dijkstra's Banker's Algorithm) to ensure safe states.</td>
                        <td>Requires processes to state maximum resource requirements in advance.</td>
                      </tr>
                      <tr>
                        <td><strong>Detection & Recovery</strong></td>
                        <td>Periodically run cycle detection algorithms on Resource Allocation Graphs, terminate cycles.</td>
                        <td>High computational runtime overhead and potential cascade rollbacks.</td>
                      </tr>
                      <tr>
                        <td><strong>Ignorance (Ostrich Algorithm)</strong></td>
                        <td>Ignore the problem; assume deadlocks are rare and reboot if severe.</td>
                        <td>Adopted by general-purpose OSes (Linux, Windows) for performance.</td>
                      </tr>
                    </tbody>
                  </table>
                `
              }
            ]
          }
        ]
      },
      {
        name: 'Computer Networks (CN)',
        code: 'cn',
        category: 'Core CS',
        icon: 'network',
        color: '#8b5cf6',
        description: 'OSI and TCP/IP models, routing protocols, TCP flow and congestion control, UDP, DNS, HTTP/HTTPS, and network security.',
        chapters: [
          {
            title: '1. Layer Architectures & Protocols',
            topics: [
              {
                title: 'OSI Model vs TCP/IP Protocol Suite',
                slug: 'osi-model-vs-tcp-ip-protocol-suite',
                summary: 'Detailed layer breakdown, protocol mappings, and encapsulation mechanisms from application down to physical media.',
                minutes: 6,
                content: `
                  <h2>OSI vs TCP/IP Architecture</h2>
                  <div class="callout callout-def">
                    <strong>OSI Model:</strong> A 7-layer theoretical reference framework created by ISO to standardize telecommunication and computer network communication.
                  </div>

                  <h3>Layer Mapping Comparison</h3>
                  <table class="tutorial-table">
                    <thead>
                      <tr>
                        <th>OSI Layer</th>
                        <th>Protocol Data Unit (PDU)</th>
                        <th>TCP/IP Layer</th>
                        <th>Common Protocols</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>7. Application<br>6. Presentation<br>5. Session</td>
                        <td>Data / Messages</td>
                        <td>Application Layer</td>
                        <td>HTTP, HTTPS, DNS, FTP, SMTP, SSH, WebSocket</td>
                      </tr>
                      <tr>
                        <td>4. Transport</td>
                        <td>Segment (TCP) / Datagram (UDP)</td>
                        <td>Transport Layer</td>
                        <td>TCP, UDP, SCTP, QUIC</td>
                      </tr>
                      <tr>
                        <td>3. Network</td>
                        <td>Packet</td>
                        <td>Internet Layer</td>
                        <td>IPv4, IPv6, ICMP, ARP, OSPF, BGP</td>
                      </tr>
                      <tr>
                        <td>2. Data Link</td>
                        <td>Frame</td>
                        <td>Network Access Layer</td>
                        <td>Ethernet (802.3), Wi-Fi (802.11), MAC Addressing</td>
                      </tr>
                      <tr>
                        <td>1. Physical</td>
                        <td>Bits</td>
                        <td>Network Access Layer</td>
                        <td>Twisted Pair Cables, Optical Fiber, Radio Frequencies</td>
                      </tr>
                    </tbody>
                  </table>

                  <h3>TCP 3-Way Handshake Connection Establishment</h3>
                  <p>Transmission Control Protocol (TCP) ensures reliable, byte-stream, connection-oriented delivery through a 3-step synchronization exchange:</p>
                  <ol>
                    <li><strong>SYN:</strong> Client generates an Initial Sequence Number <code>ISN(c) = X</code> and sends a packet with <code>SYN = 1, ACK = 0, SEQ = X</code>.</li>
                    <li><strong>SYN-ACK:</strong> Server acknowledges by sending <code>SYN = 1, ACK = 1, SEQ = Y, ACK_NUM = X + 1</code>.</li>
                    <li><strong>ACK:</strong> Client confirms connection with <code>ACK = 1, SEQ = X + 1, ACK_NUM = Y + 1</code>. Both parties can now stream payload data.</li>
                  </ol>
                `
              }
            ]
          }
        ]
      },
      {
        name: 'Data Structures & Algorithms (DSA)',
        code: 'dsa',
        category: 'Core CS',
        icon: 'code',
        color: '#f59e0b',
        description: 'Asymptotic notation, arrays, linked lists, stacks, queues, trees, heaps, graphs, hashing, dynamic programming, and greedy algorithms.',
        chapters: [
          {
            title: '1. Asymptotic Analysis & Core Structures',
            topics: [
              {
                title: 'Asymptotic Notations: Big O, Big Omega, and Big Theta',
                slug: 'asymptotic-notations-big-o-omega-theta',
                summary: 'Mathematical foundations of algorithmic complexity analysis and runtime growth rates.',
                minutes: 5,
                content: `
                  <h2>Asymptotic Complexity Analysis</h2>
                  <div class="callout callout-def">
                    <strong>Purpose:</strong> Asymptotic notation provides a mathematical framework to characterize algorithm runtime and memory usage as input size <code>n</code> scales toward infinity, independent of hardware clocks.
                  </div>

                  <h3>The Three Standard Notations</h3>
                  <div class="grid-2-col">
                    <div class="theory-card">
                      <h3>Big O (O-Notation) - Upper Bound</h3>
                      <p>Defines the worst-case ceiling. Function <code>f(n) = O(g(n))</code> if there exist positive constants <code>c</code> and <code>n0</code> such that <code>0 &le; f(n) &le; c &middot; g(n)</code> for all <code>n &ge; n0</code>.</p>
                    </div>
                    <div class="theory-card">
                      <h3>Big Omega (&Omega;-Notation) - Lower Bound</h3>
                      <p>Defines the best-case floor. Function <code>f(n) = &Omega;(g(n))</code> if there exist positive constants <code>c</code> and <code>n0</code> such that <code>0 &le; c &middot; g(n) &le; f(n)</code> for all <code>n &ge; n0</code>.</p>
                    </div>
                  </div>

                  <div class="theory-card mt-16">
                    <h3>Big Theta (&Theta;-Notation) - Tight Asymptotic Bound</h3>
                    <p>Function <code>f(n) = &Theta;(g(n))</code> if and only if <code>f(n) = O(g(n))</code> and <code>f(n) = &Omega;(g(n))</code> simultaneously. Represents exact growth behavior.</p>
                  </div>

                  <h3>Common Time Complexity Hierarchy (Fastest to Slowest)</h3>
                  <p><code>O(1) &lt; O(log n) &lt; O(n) &lt; O(n log n) &lt; O(n&sup2;) &lt; O(2ⁿ) &lt; O(n!)</code></p>
                `
              }
            ]
          }
        ]
      },
      {
        name: 'Object-Oriented Programming (OOP)',
        code: 'oop',
        category: 'Programming',
        icon: 'layers',
        color: '#06b6d4',
        description: 'Encapsulation, abstraction, inheritance, polymorphism, design principles, SOLID guidelines, and coupling vs cohesion.',
        chapters: [
          {
            title: '1. The Four Pillars of OOP',
            topics: [
              {
                title: 'The Four Pillars of Object-Oriented Programming',
                slug: 'four-pillars-of-object-oriented-programming',
                summary: 'Detailed explanation of Encapsulation, Abstraction, Inheritance, and Polymorphism with design examples.',
                minutes: 6,
                content: `
                  <h2>The Four Fundamental Pillars of OOP</h2>
                  <div class="callout callout-def">
                    <strong>Object-Oriented Paradigm:</strong> A programming methodology that structures software around real-world data entities (objects) containing attributes (state) and methods (behavior) rather than disconnected sequential logic.
                  </div>

                  <div class="grid-2-col">
                    <div class="theory-card">
                      <h3>1. Encapsulation</h3>
                      <p>Bundling state data and methods that mutate that state into a single cohesive unit (class) while restricting direct external access to internal implementation details (data hiding via private/protected fields and getter/setter methods).</p>
                    </div>
                    <div class="theory-card">
                      <h3>2. Abstraction</h3>
                      <p>Exposing only essential interface capabilities to the caller while completely concealing complex background execution logic (e.g. using abstract classes and interfaces).</p>
                    </div>
                    <div class="theory-card">
                      <h3>3. Inheritance</h3>
                      <p>Mechanisms enabling a child class (derived/subclass) to inherit attributes and behaviors from an existing parent class (base/superclass), promoting code reusability and hierarchical taxonomy.</p>
                    </div>
                    <div class="theory-card">
                      <h3>4. Polymorphism</h3>
                      <p>The ability of an entity (method or interface) to exhibit multiple behaviors. Subdivided into compile-time polymorphism (method overloading) and runtime polymorphism (method overriding via virtual method dispatch).</p>
                    </div>
                  </div>
                `
              }
            ]
          }
        ]
      },
      {
        name: 'Java Programming',
        code: 'java',
        category: 'Programming',
        icon: 'coffee',
        color: '#ea580c',
        description: 'JVM architecture, bytecode, memory management & garbage collection, collections framework, multithreading, and Java 8+ features.',
        chapters: []
      },
      {
        name: 'C Programming',
        code: 'c',
        category: 'Programming',
        icon: 'terminal',
        color: '#64748b',
        description: 'Pointers, memory allocation (malloc/free), structs, file I/O, preprocessor directives, and standard library.',
        chapters: []
      },
      {
        name: 'C++ Programming',
        code: 'cpp',
        category: 'Programming',
        icon: 'cpu',
        color: '#0284c7',
        description: 'STL containers, iterators, templates, RAII, smart pointers, copy/move semantics, and modern C++ features.',
        chapters: []
      },
      {
        name: 'SQL & Database Design',
        code: 'sql',
        category: 'Database',
        icon: 'table',
        color: '#0d9488',
        description: 'DDL, DML, complex JOIN queries, subqueries, aggregation, window functions, indexes, and query execution plans.',
        chapters: []
      },
      {
        name: 'Computer Organization & Architecture (COA)',
        code: 'coa',
        category: 'Systems',
        icon: 'hard-drive',
        color: '#4f46e5',
        description: 'Instruction sets, pipelining, hazards, cache memory hierarchy, mapping techniques, and DMA controllers.',
        chapters: []
      },
      {
        name: 'Theory of Computation (TOC)',
        code: 'toc',
        category: 'Theory',
        icon: 'compass',
        color: '#9333ea',
        description: 'Finite automata (DFA/NFA), regular expressions, context-free grammars, pushdown automata, and Turing machines.',
        chapters: []
      },
      {
        name: 'Compiler Design',
        code: 'compiler-design',
        category: 'Theory',
        icon: 'git-branch',
        color: '#c026d3',
        description: 'Lexical analysis, top-down and bottom-up parsing, syntax-directed translation, intermediate code generation, and optimization.',
        chapters: []
      },
      {
        name: 'Software Engineering',
        code: 'software-engineering',
        category: 'Systems',
        icon: 'check-square',
        color: '#059669',
        description: 'SDLC models (Agile, Scrum, Waterfall), architectural design patterns, requirement engineering, and software testing.',
        chapters: []
      },
      {
        name: 'Web Development & System Architecture',
        code: 'web-development',
        category: 'Web',
        icon: 'globe',
        color: '#e11d48',
        description: 'HTTP protocols, REST APIs, frontend/backend architecture, state management, caching, websockets, and web security.',
        chapters: []
      }
    ];

    let subjectOrder = 1;
    for (const sub of subjectsData) {
      const subjectId = randomUUID();
      await db.execute(`
        INSERT INTO study_subjects (id, name, code, category, description, icon, color, display_order, status, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
      `, [
        subjectId,
        sub.name,
        sub.code,
        sub.category,
        sub.description,
        sub.icon,
        sub.color,
        subjectOrder++,
        authorId
      ]);

      let chapterOrder = 1;
      for (const ch of (sub.chapters || [])) {
        const chapterId = randomUUID();
        await db.execute(`
          INSERT INTO study_chapters (id, subject_id, title, description, display_order, status, created_by)
          VALUES (?, ?, ?, NULL, ?, 'published', ?)
        `, [
          chapterId,
          subjectId,
          ch.title,
          chapterOrder++,
          authorId
        ]);

        let topicOrder = 1;
        for (const top of (ch.topics || [])) {
          const topicId = randomUUID();
          await db.execute(`
            INSERT INTO study_topics (id, chapter_id, subject_id, title, slug, content, summary, estimated_reading_minutes, display_order, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)
          `, [
            topicId,
            chapterId,
            subjectId,
            top.title,
            top.slug,
            top.content,
            top.summary,
            top.minutes || 5,
            topicOrder++,
            authorId
          ]);
        }
      }
    }
  }
}

module.exports = StudyModel;
