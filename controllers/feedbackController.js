const dbService = require('../services/dbService');

/**
 * Handles POST /api/feedback
 */
const submitFeedback = async (req, res, next) => {
  const { generation_id, rating, comment } = req.body;

  try {
    // Check if the generation exists first (uses req.user for RBAC)
    const generation = await dbService.getGenerationById(generation_id, req.user.id, req.user.role);
    if (!generation) {
      return res.status(404).json({ error: `Generation with ID ${generation_id} not found` });
    }

    const feedbackRecord = await dbService.createFeedback(generation_id, rating, comment);
    
    console.log(`✅ Feedback recorded for generation ID ${generation_id}`);
    return res.status(201).json(feedbackRecord);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  submitFeedback
};
