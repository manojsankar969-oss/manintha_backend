const dbService = require('../services/dbService');

/**
 * Handles GET /api/history
 */
const getHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = req.query.search || '';
    
    const filters = {
      dateRange: req.query.dateRange || null,
      rating: req.query.rating ? parseInt(req.query.rating, 10) : null,
      vehicleType: req.query.vehicleType || null
    };

    const userId = req.user.id;
    const role = req.user.role;

    const [data, total] = await Promise.all([
      dbService.getHistory(page, limit, userId, role, search, filters),
      dbService.getHistoryCount(userId, role, search, filters)
    ]);

    // Create an audit log for viewing history
    await dbService.createAuditLog(
      userId,
      'VIEW_HISTORY',
      `Page: ${page}, Limit: ${limit}, Search: "${search}"`,
      req.ip
    );

    return res.json({ data, total, page, limit });
  } catch (err) {
    next(err);
  }
};

/**
 * Handles GET /api/history/:id
 */
const getGenerationById = async (req, res, next) => {
  const { id } = req.params;
  const userId = req.user.id;
  const role = req.user.role;

  try {
    const targetId = parseInt(id, 10);
    if (isNaN(targetId)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const generation = await dbService.getGenerationById(targetId, userId, role);
    
    if (!generation) {
      return res.status(404).json({ error: 'Generation not found or access denied' });
    }

    // Create audit log for viewing a specific generation
    await dbService.createAuditLog(
      userId,
      'VIEW_GENERATION_DETAILS',
      `Generation ID: ${targetId}`,
      req.ip
    );

    return res.json(generation);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getHistory,
  getGenerationById
};
