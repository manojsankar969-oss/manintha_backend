const templateService = require('../services/templateService');
const dbService = require('../services/dbService');

const listTemplates = async (req, res, next) => {
  try {
    const templates = await templateService.getTemplates();
    return res.json(templates);
  } catch (err) {
    next(err);
  }
};

const createTemplate = async (req, res, next) => {
  const { name, data } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'name is required' });
  }

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ error: 'data object is required' });
  }

  try {
    const template = await templateService.createTemplate(name.trim(), data);
    
    // Log template creation
    await dbService.createAuditLog(
      req.user.id,
      'CREATE_TEMPLATE',
      `Created or updated template: "${name.trim()}"`,
      req.ip
    );

    return res.status(201).json(template);
  } catch (err) {
    next(err);
  }
};

const deleteTemplate = async (req, res, next) => {
  const { id } = req.params;
  const targetId = parseInt(id, 10);

  if (isNaN(targetId)) {
    return res.status(400).json({ error: 'Invalid ID format' });
  }

  try {
    const deleted = await templateService.deleteTemplate(targetId);
    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Log template deletion
    await dbService.createAuditLog(
      req.user.id,
      'DELETE_TEMPLATE',
      `Deleted template: "${deleted.name}" (ID: ${targetId})`,
      req.ip
    );

    return res.json({ message: 'Template deleted', template: deleted });
  } catch (err) {
    next(err);
  }
};

module.exports = { listTemplates, createTemplate, deleteTemplate };
