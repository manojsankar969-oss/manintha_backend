const dbService = require('../services/dbService');

/**
 * Handles GET /api/admin/analytics
 */
const getAnalytics = async (req, res, next) => {
  try {
    const analyticsData = await dbService.getAnalytics();

    // Create audit log for viewing analytics
    await dbService.createAuditLog(
      req.user.id,
      'VIEW_ANALYTICS',
      'Accessed business analytics dashboard',
      req.ip
    );

    return res.json(analyticsData);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getAnalytics
};
