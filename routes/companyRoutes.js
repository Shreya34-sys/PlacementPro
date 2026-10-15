const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authMiddleware');

function normalizeCompanyRow(row) {
  return {
    id: row.id,
    name: row.name,
    short_name: row.short_name,
    overview: row.overview,
    eligibility: row.eligibility_rules ? (typeof row.eligibility_rules === 'string' ? JSON.parse(row.eligibility_rules) : row.eligibility_rules) : null,
    rounds: row.rounds ? (typeof row.rounds === 'string' ? JSON.parse(row.rounds) : row.rounds) : [],
    resources: row.resources ? (typeof row.resources === 'string' ? JSON.parse(row.resources) : row.resources) : [],
    topics: Array.isArray(row.topics) ? row.topics : [],
    created_at: row.created_at
  };
}

router.get('/', async (req, res) => {
  try {
    const [rows] = await db.execute('SELECT * FROM companies ORDER BY name ASC');
    const companies = rows.map(normalizeCompanyRow);
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch companies.' });
  }
});

router.get('/:companyName', async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName)
      .trim();
    const [rows] = await db.execute(
      'SELECT * FROM companies WHERE LOWER(name) = LOWER(?) OR LOWER(short_name) = LOWER(?) LIMIT 1',
      [companyName, companyName]
    );

    if (!rows[0]) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    res.json({ success: true, data: normalizeCompanyRow(rows[0]) });
  } catch (error) {
    console.error('Get company detail error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch company details.' });
  }
});

router.get('/:companyName/eligibility', verifyToken, async (req, res) => {
  try {
    const companyName = decodeURIComponent(req.params.companyName).trim();
    const [companyRows] = await db.execute(
      'SELECT * FROM companies WHERE LOWER(name) = LOWER(?) OR LOWER(short_name) = LOWER(?) LIMIT 1',
      [companyName, companyName]
    );

    if (!companyRows[0]) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    const company = normalizeCompanyRow(companyRows[0]);
    const profile = await db.execute(
      `SELECT p.cgpa, p.backlogs, p.branch, u.email
       FROM profiles p
       LEFT JOIN users u ON u.id = p.user_id
       WHERE p.user_id = ?`,
      [req.user.id]
    );

    const profileRow = profile[0][0] || {};
    const rules = company.eligibility || {};
    const eligible =
      (!rules.minCgpa || Number(profileRow.cgpa || 0) >= Number(rules.minCgpa)) &&
      (!rules.maxBacklogs && !rules.max_backlogs || Number(profileRow.backlogs || 0) <= Number(rules.maxBacklogs || rules.max_backlogs || 99)) &&
      (!rules.branches || !rules.branches.length || !profileRow.branch || rules.branches.includes(profileRow.branch));

    const reason = !eligible
      ? [
          Number(profileRow.cgpa || 0) < Number(rules.minCgpa || 0) ? `CGPA below ${rules.minCgpa}` : null,
          Number(profileRow.backlogs || 0) > Number(rules.maxBacklogs || rules.max_backlogs || 99) ? `Backlogs above ${rules.maxBacklogs || rules.max_backlogs || 99}` : null,
          profileRow.branch && rules.branches && rules.branches.length && !rules.branches.includes(profileRow.branch) ? `Branch ${profileRow.branch} is not eligible` : null
        ].filter(Boolean).join('; ') || 'Profile does not meet the company criteria.'
      : 'Eligible for this company based on your profile.';

    res.json({
      success: true,
      data: {
        company: company.name,
        eligible,
        reason,
        rules
      }
    });
  } catch (error) {
    console.error('Company eligibility error:', error);
    res.status(500).json({ success: false, message: 'Failed to evaluate eligibility.' });
  }
});

module.exports = router;
