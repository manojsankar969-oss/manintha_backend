const express = require('express');
const router = express.Router();

const { validateGenerateInput, validateFeedbackInput } = require('../middlewares/validator');
const { requireAuth, requireAdmin } = require('../middlewares/auth');
const { generateLimiter } = require('../middlewares/rateLimiter');
const { generateScript } = require('../controllers/scriptController');
const { getHistory, getGenerationById } = require('../controllers/historyController');
const { submitFeedback } = require('../controllers/feedbackController');
const { getAnalytics } = require('../controllers/analyticsController');
const {
  listTemplates,
  createTemplate,
  deleteTemplate
} = require('../controllers/templateController');

// All API routes require a valid Supabase JWT
router.use(requireAuth);

// 0. Current User Profile (returns role from DB)
router.get('/auth/me', (req, res) => {
  res.json(req.user);
});

// 1. Script Generation (with stricter rate limit)
router.post('/generate', generateLimiter, validateGenerateInput, generateScript);

// 2. Generation History
router.get('/history', getHistory);
router.get('/history/:id', getGenerationById);

// 3. Script Feedback
router.post('/feedback', validateFeedbackInput, submitFeedback);

// 4. Admin Analytics (RBAC Protected)
router.get('/admin/analytics', requireAdmin, getAnalytics);

// 5. Templates CRUD
// Staff and Admins can list templates
router.get('/templates', listTemplates);
// Only Admins can create or delete templates
router.post('/templates', requireAdmin, createTemplate);
router.delete('/templates/:id', requireAdmin, deleteTemplate);

module.exports = router;
