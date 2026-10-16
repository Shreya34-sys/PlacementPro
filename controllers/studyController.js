const path = require('path');
const fs = require('fs');
const StudyModel = require('../models/studyModel');

const UPLOAD_DIR = path.join(__dirname, '../public/uploads/study-materials');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Helper to determine if user has elevated management permissions
function isFacultyOrAdmin(user) {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  return role === 'admin' || role === 'faculty';
}

function isAdmin(user) {
  if (!user) return false;
  const role = String(user.role || '').toLowerCase();
  return role === 'admin';
}

// 1. List Subjects
exports.listSubjects = async (req, res, next) => {
  try {
    const studentId = req.user?.id || null;
    const elevated = isFacultyOrAdmin(req.user);
    const { search = '', category = '', includeDrafts = 'false' } = req.query;

    const subjects = await StudyModel.listSubjects({
      studentId,
      includeUnpublished: elevated && includeDrafts === 'true',
      search,
      category
    });

    res.json({ success: true, subjects });
  } catch (error) {
    next(error);
  }
};

// 2. Get Single Subject with Chapters & Topics
exports.getSubject = async (req, res, next) => {
  try {
    const { idOrCode } = req.params;
    const studentId = req.user?.id || null;
    const elevated = isFacultyOrAdmin(req.user);

    const subject = await StudyModel.getSubject(idOrCode, studentId, elevated);
    if (!subject) {
      return res.status(404).json({ success: false, message: 'Subject not found.' });
    }

    res.json({ success: true, subject });
  } catch (error) {
    next(error);
  }
};

// 3. Get Single Topic with Reading Content & Nav
exports.getTopic = async (req, res, next) => {
  try {
    const { idOrSlug } = req.params;
    const studentId = req.user?.id || null;
    const elevated = isFacultyOrAdmin(req.user);

    const topic = await StudyModel.getTopic(idOrSlug, studentId, elevated);
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found.' });
    }

    res.json({ success: true, topic });
  } catch (error) {
    next(error);
  }
};

// 4. Search Topics
exports.search = async (req, res, next) => {
  try {
    const { q = '', limit = 20 } = req.query;
    const studentId = req.user?.id || null;

    const results = await StudyModel.searchTopics(q, studentId, limit);
    res.json({ success: true, results });
  } catch (error) {
    next(error);
  }
};

// 5. Toggle Bookmark
exports.toggleBookmark = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const { topicId } = req.params;
    const result = await StudyModel.toggleBookmark(req.user.id, topicId);
    res.json({ success: true, bookmarked: result.bookmarked });
  } catch (error) {
    next(error);
  }
};

// 6. List Bookmarks
exports.listBookmarks = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const bookmarks = await StudyModel.listBookmarks(req.user.id);
    res.json({ success: true, bookmarks });
  } catch (error) {
    next(error);
  }
};

// 7. Update Reading Progress
exports.updateProgress = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const { topicId } = req.params;
    const { progressPercent, isCompleted } = req.body;

    const result = await StudyModel.updateReadingProgress(req.user.id, topicId, {
      progressPercent: Number(progressPercent || 0),
      isCompleted: Boolean(isCompleted)
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// 8. Get Recently Viewed Topics
exports.getRecentlyViewed = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const limit = Number(req.query.limit || 5);
    const recent = await StudyModel.getRecentlyViewed(req.user.id, limit);
    res.json({ success: true, recent });
  } catch (error) {
    next(error);
  }
};

// 9. Student Study Overview Stats
exports.getStudentStats = async (req, res, next) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Authentication required.' });
    }
    const stats = await StudyModel.getStudentStudyStats(req.user.id);
    res.json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};

// 10. Download Attachment
exports.downloadAttachment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const attachment = await StudyModel.getAttachment(id);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment file not found.' });
    }

    const fullPath = path.isAbsolute(attachment.file_path)
      ? attachment.file_path
      : path.join(__dirname, '..', attachment.file_path);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ success: false, message: 'File is missing from storage.' });
    }

    await StudyModel.incrementDownload(id);
    res.download(fullPath, attachment.original_name);
  } catch (error) {
    next(error);
  }
};

// --- FACULTY / ADMIN CRUD HANDLERS ---

// 11. Create Subject
exports.createSubject = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { name, code, category, description, icon, color, display_order, status } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Subject name is required.' });
    }

    const id = await StudyModel.createSubject(req.user.id, {
      name, code, category, description, icon, color, display_order, status
    });

    res.status(201).json({ success: true, message: 'Subject created successfully.', id });
  } catch (error) {
    next(error);
  }
};

// 12. Update Subject
exports.updateSubject = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const ok = await StudyModel.updateSubject(id, req.user.id, req.body, isAdmin(req.user));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Subject not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Subject updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// 13. Delete Subject
exports.deleteSubject = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const ok = await StudyModel.deleteSubject(id, req.user.id, isAdmin(req.user));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Subject not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Subject deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 14. Create Chapter
exports.createChapter = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { subject_id, title, description, display_order, status } = req.body;
    if (!subject_id || !title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Subject ID and chapter title are required.' });
    }

    const id = await StudyModel.createChapter(req.user.id, {
      subject_id, title, description, display_order, status
    });

    res.status(201).json({ success: true, message: 'Chapter created successfully.', id });
  } catch (error) {
    next(error);
  }
};

// 15. Update Chapter
exports.updateChapter = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const ok = await StudyModel.updateChapter(id, req.user.id, req.body, isAdmin(req.user));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Chapter not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Chapter updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// 16. Delete Chapter
exports.deleteChapter = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const ok = await StudyModel.deleteChapter(id, req.user.id, isAdmin(req.user));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Chapter not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Chapter deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 17. Create Topic
exports.createTopic = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { chapter_id, subject_id, title, slug, content, summary, video_url, video_title, video_source, video_objective, estimated_reading_minutes, display_order, status } = req.body;
    if (!chapter_id || !subject_id || !title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Chapter ID, Subject ID, and title are required.' });
    }

    const result = await StudyModel.createTopic(req.user.id, {
      chapter_id, subject_id, title, slug, content, summary, video_url, video_title, video_source, video_objective, estimated_reading_minutes, display_order, status
    });

    res.status(201).json({ success: true, message: 'Topic created successfully.', ...result });
  } catch (error) {
    next(error);
  }
};

// 18. Update Topic
exports.updateTopic = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const ok = await StudyModel.updateTopic(id, req.user.id, req.body, isAdmin(req.user));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Topic not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Topic updated successfully.' });
  } catch (error) {
    next(error);
  }
};

// 19. Delete Topic
exports.deleteTopic = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const ok = await StudyModel.deleteTopic(id, req.user.id, isAdmin(req.user));
    if (!ok) {
      return res.status(404).json({ success: false, message: 'Topic not found or unauthorized.' });
    }
    res.json({ success: true, message: 'Topic deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 20. Upload Note Attachment
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Attachment file is required (PDF, DOCX, PPTX).' });
    }

    const { subject_id, topic_id, title, description } = req.body;
    if (!subject_id || !title) {
      // Remove uploaded file if validation fails
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Subject ID and title are required.' });
    }

    const ext = path.extname(req.file.originalname).replace('.', '').toLowerCase();
    const relativePath = path.relative(path.join(__dirname, '..'), req.file.path).replace(/\\/g, '/');

    const id = await StudyModel.createAttachment(req.user.id, {
      subject_id,
      topic_id: topic_id || null,
      title: title.trim(),
      description: description ? description.trim() : null,
      file_name: req.file.filename,
      original_name: req.file.originalname,
      file_path: relativePath,
      file_size: req.file.size,
      file_type: ext
    });

    res.status(201).json({
      success: true,
      message: 'Attachment uploaded successfully.',
      id,
      fileName: req.file.originalname
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      try { fs.unlinkSync(req.file.path); } catch {}
    }
    next(error);
  }
};

// 21. Delete Attachment
exports.deleteAttachment = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }
    const { id } = req.params;
    const attachment = await StudyModel.getAttachment(id);
    if (!attachment) {
      return res.status(404).json({ success: false, message: 'Attachment not found.' });
    }

    await StudyModel.deleteAttachment(id, req.user.id, isAdmin(req.user));

    // Optionally delete physical file
    const fullPath = path.isAbsolute(attachment.file_path)
      ? attachment.file_path
      : path.join(__dirname, '..', attachment.file_path);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch {}
    }

    res.json({ success: true, message: 'Attachment deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

// 22. Admin Studio Overview
exports.getAdminOverview = async (req, res, next) => {
  try {
    if (!isFacultyOrAdmin(req.user)) {
      return res.status(403).json({ success: false, message: 'Faculty or admin rights required.' });
    }

    const subjects = await StudyModel.listSubjects({
      includeUnpublished: true
    });

    const attachments = await StudyModel.listAttachments();

    res.json({
      success: true,
      overview: {
        totalSubjects: subjects.length,
        totalChapters: subjects.reduce((sum, s) => sum + s.chapter_count, 0),
        totalTopics: subjects.reduce((sum, s) => sum + s.topic_count, 0),
        totalAttachments: attachments.length,
        subjects,
        attachments
      }
    });
  } catch (error) {
    next(error);
  }
};
