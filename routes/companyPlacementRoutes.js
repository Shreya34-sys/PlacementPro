const router = require('express').Router();
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const c = require('../controllers/companyPlacementController');

const admin = [verifyToken, verifyAdmin];
const student = [verifyToken];

router.get('/admin/assessments/:moduleType', ...admin, c.adminListAssessments);
router.get('/admin/companies', ...admin, c.adminListCompanies);
router.get('/admin/history', ...admin, c.adminSimulationHistory);
router.post('/admin/companies', ...admin, c.adminCreateCompany);
router.get('/admin/companies/:companyId', ...admin, c.adminGetCompany);
router.put('/admin/companies/:companyId', ...admin, c.adminUpdateCompany);
router.delete('/admin/companies/:companyId', ...admin, c.adminDeleteCompany);
router.post('/admin/companies/:companyId/rounds', ...admin, c.adminSaveRound);
router.put('/admin/rounds/:roundId', ...admin, c.adminUpdateRound);
router.delete('/admin/rounds/:roundId', ...admin, c.adminDeleteRound);
router.post('/admin/companies/:companyId/publish', ...admin, c.adminPublishCompany);
router.post('/admin/ai/suggest-rounds', ...admin, c.aiSuggestRounds);

router.get('/student/companies', ...student, c.studentListCompanies);
router.get('/student/history', ...student, c.studentHistory);
router.post('/student/companies/:companyId/start', ...student, c.studentStartSimulation);
router.get('/student/simulations/:simulationId', ...student, c.studentSimulationState);
router.post('/student/simulations/:simulationId/rounds/:roundId/start', ...student, c.studentStartRound);

module.exports = router;
