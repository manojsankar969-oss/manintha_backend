const dbService = require('../services/dbService');

/**
 * Handles GET /api/admin/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analyticsData = await dbService.getAnalytics();

    return res.json(analyticsData);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics
};
