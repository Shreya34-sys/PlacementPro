const express = require('express');
const path = require('path');

const router = express.Router();
const pages = path.join(__dirname, '..', 'public', 'pages');

router.get('/admin-coding-rounds', (_req, res) => res.sendFile(path.join(pages, 'admin-coding-rounds.html')));
router.get('/admin-coding-builder', (_req, res) => res.sendFile(path.join(pages, 'admin-coding-builder.html')));
router.get('/admin-coding-monitor', (_req, res) => res.sendFile(path.join(pages, 'admin-coding-monitor.html')));
router.get('/admin-coding-results', (_req, res) => res.sendFile(path.join(pages, 'admin-coding-results.html')));
router.get('/coding-rounds', (_req, res) => res.sendFile(path.join(pages, 'coding-rounds.html')));
router.get('/coding-round', (_req, res) => res.sendFile(path.join(pages, 'coding-round.html')));
router.get('/coding-result', (_req, res) => res.sendFile(path.join(pages, 'coding-result.html')));

module.exports = router;
