/**
 * PlacementPro Theory Learning Library - Master Curriculum Seeder
 * Connects to MySQL and idempotently populates all 15 Core Computer Science subjects
 * with deep theory, SVGs, code, comparisons, MCQs, and verified educational video lectures.
 */

require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const db = require('../../config/db');
const StudyModel = require('../../models/studyModel');

// Import all curriculum modules
const javaCurriculum = require('./java');
const cCppOopCurriculum = require('./c_cpp_oop');
const dbmsSqlCurriculum = require('./dbms_sql');
const dsaCurriculum = require('./dsa');
const osCurriculum = require('./os');
const cnCurriculum = require('./cn');
const systemsTheoryCurriculum = require('./systems_theory');

const ADMIN_ID = '8b964856-ee3c-45cd-a048-7d4a991734c3';

// Consolidated curriculum map by subject code
const CURRICULUM_REGISTRY = {
  java: javaCurriculum,
  c: cCppOopCurriculum.c,
  cpp: cCppOopCurriculum.cpp,
  oop: cCppOopCurriculum.oop,
  dbms: dbmsSqlCurriculum.dbms,
  sql: dbmsSqlCurriculum.sql,
  dsa: dsaCurriculum,
  os: osCurriculum,
  cn: cnCurriculum,
  'compiler-design': systemsTheoryCurriculum['compiler-design'],
  toc: systemsTheoryCurriculum.toc,
  coa: systemsTheoryCurriculum.coa,
  'software-engineering': systemsTheoryCurriculum['software-engineering'],
  'web-development': systemsTheoryCurriculum['web-development'],
  'discrete-mathematics': systemsTheoryCurriculum['discrete-mathematics']
};

async function seedComprehensiveCurriculum() {
  console.log('====================================================');
  console.log('PLACEMENTPRO - SEEDING COMPREHENSIVE CS CURRICULA');
  console.log('====================================================\n');

  try {
    // 1. Ensure schema and video columns exist
    await StudyModel.ensureTables();

    // 2. Clean up test subjects
    await db.execute("DELETE FROM study_subjects WHERE code LIKE 'cloud-test-%'");

    let totalChaptersInserted = 0;
    let totalTopicsSeeded = 0;

    for (const [subjectCode, chapters] of Object.entries(CURRICULUM_REGISTRY)) {
      if (!chapters || !chapters.length) continue;

      // Find subject in DB
      const [subs] = await db.execute("SELECT id, name FROM study_subjects WHERE code = ? LIMIT 1", [subjectCode]);
      if (!subs.length) {
        console.warn(`[WARN] Subject code '${subjectCode}' not found in study_subjects. Skipping.`);
        continue;
      }
      const subject = subs[0];
      console.log(`\nProcessing Subject: ${subject.name} (${subjectCode})`);

      for (let cIdx = 0; cIdx < chapters.length; cIdx++) {
        const chapData = chapters[cIdx];

        // Find or create chapter
        const [existingChaps] = await db.execute(
          "SELECT id FROM study_chapters WHERE subject_id = ? AND title = ? AND deleted_at IS NULL LIMIT 1",
          [subject.id, chapData.chapterTitle]
        );

        let chapterId;
        if (existingChaps.length) {
          chapterId = existingChaps[0].id;
        } else {
          chapterId = uuidv4();
          await db.execute(
            `INSERT INTO study_chapters (id, subject_id, title, description, display_order, status, created_by)
             VALUES (?, ?, ?, ?, ?, 'published', ?)`,
            [chapterId, subject.id, chapData.chapterTitle, chapData.chapterDescription || null, cIdx + 1, ADMIN_ID]
          );
          totalChaptersInserted++;
          console.log(`  + Chapter created: ${chapData.chapterTitle}`);
        }

        // Process topics
        const topics = chapData.topics || [];
        for (let tIdx = 0; tIdx < topics.length; tIdx++) {
          const tData = topics[tIdx];

          const [existingTopics] = await db.execute(
            "SELECT id FROM study_topics WHERE slug = ? LIMIT 1",
            [tData.slug]
          );

          if (existingTopics.length) {
            // Update topic with comprehensive content and verified video
            await db.execute(
              `UPDATE study_topics SET
                 title = ?,
                 content = ?,
                 summary = ?,
                 estimated_reading_minutes = ?,
                 video_url = ?,
                 video_title = ?,
                 video_source = ?,
                 video_objective = ?,
                 status = 'published',
                 display_order = ?
               WHERE id = ?`,
              [
                tData.title,
                tData.content,
                tData.summary || null,
                tData.minutes || 10,
                tData.video_url || null,
                tData.video_title || null,
                tData.video_source || null,
                tData.video_objective || null,
                tIdx + 1,
                existingTopics[0].id
              ]
            );
            console.log(`    &bull; Topic updated: ${tData.title} (${tData.slug})`);
          } else {
            // Insert brand-new topic
            const topicId = uuidv4();
            await db.execute(
              `INSERT INTO study_topics (
                 id, chapter_id, subject_id, title, slug, content, summary,
                 video_url, video_title, video_source, video_objective,
                 estimated_reading_minutes, display_order, status, created_by
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', ?)`,
              [
                topicId,
                chapterId,
                subject.id,
                tData.title,
                tData.slug,
                tData.content,
                tData.summary || null,
                tData.video_url || null,
                tData.video_title || null,
                tData.video_source || null,
                tData.video_objective || null,
                tData.minutes || 10,
                tIdx + 1,
                ADMIN_ID
              ]
            );
            console.log(`    + Topic created: ${tData.title} (${tData.slug})`);
          }
          totalTopicsSeeded++;
        }
      }
    }

    console.log('\n====================================================');
    console.log(`SEEDING COMPLETE! Total Topics Processed: ${totalTopicsSeeded}`);
    console.log('====================================================');

    // Query stats
    const [statRows] = await db.execute(`
      SELECT 
        (SELECT COUNT(*) FROM study_subjects WHERE status = 'published') as subjects,
        (SELECT COUNT(*) FROM study_chapters WHERE status = 'published') as chapters,
        (SELECT COUNT(*) FROM study_topics WHERE status = 'published') as topics,
        (SELECT COUNT(*) FROM study_topics WHERE video_url IS NOT NULL) as videos
    `);

    console.log('Database Summary:', statRows[0]);
    process.exit(0);
  } catch (err) {
    console.error('Fatal error during seeding:', err);
    process.exit(1);
  }
}

seedComprehensiveCurriculum();
