const { pool } = require('../config/db');

const getTemplates = async () => {
  const query = 'SELECT * FROM templates ORDER BY name ASC';
  const { rows } = await pool.query(query);
  return rows;
};

const createTemplate = async (name, data) => {
  const query = `
    INSERT INTO templates (name, data)
    VALUES ($1, $2)
    ON CONFLICT (name) DO UPDATE SET data = EXCLUDED.data
    RETURNING *
  `;
  const values = [name, JSON.stringify(data)];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

const deleteTemplate = async (id) => {
  const query = 'DELETE FROM templates WHERE id = $1 RETURNING *';
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
};

module.exports = { getTemplates, createTemplate, deleteTemplate };
