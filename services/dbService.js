const { pool } = require('../config/db');

/**
 * Inserts a new script generation entry.
 */
const createGeneration = async (userId, data) => {
  const query = `
    INSERT INTO generations (
      user_id, staff_name, customer_name, destination, travel_date, trip_duration, 
      budget, vehicle_type, num_passengers, purpose, luxury_level, special_requests, 
      addons, current_package, current_vehicle, current_price, current_addons, 
      recommended_upgrade, upgrade_price, why_upgrade, suggested_script, 
      pricing_comparison, expected_benefits, objection_handling, 
      confidence_score, token_cost
    ) 
    VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26
    ) 
    RETURNING *
  `;
  
  const values = [
    userId,
    data.staff_name,
    data.customer_name,
    data.destination,
    data.travel_date,
    data.trip_duration,
    data.budget,
    data.vehicle_type,
    parseInt(data.num_passengers, 10) || 1,
    data.purpose,
    data.luxury_level,
    data.special_requests,
    Array.isArray(data.addons) ? JSON.stringify(data.addons) : data.addons,
    data.current_package,
    data.current_vehicle,
    data.current_price,
    data.current_addons,
    data.recommended_upgrade,
    data.upgrade_price,
    JSON.stringify(data.why_upgrade),
    data.suggested_script,
    data.pricing_comparison,
    JSON.stringify(data.expected_benefits),
    data.objection_handling ? JSON.stringify(data.objection_handling) : null,
    data.confidence_score || 'High',
    parseInt(data.token_cost, 10) || 0
  ];

  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Retrieves script generations ordered by date descending with search, filters, and RBAC.
 */
const getHistory = async (page = 1, limit = 20, userId, role, search = '', filters = {}) => {
  const offset = (page - 1) * limit;
  let query = `
    SELECT g.*, f.rating, f.comment 
    FROM generations g
    LEFT JOIN feedback f ON f.generation_id = g.id
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 0;

  // RBAC: Staff can only see their own history
  if (role !== 'admin') {
    paramCount++;
    query += ` AND g.user_id = $${paramCount}`;
    values.push(userId);
  }

  // Search filter
  if (search && search.trim()) {
    paramCount++;
    query += ` AND (g.customer_name ILIKE $${paramCount} OR g.destination ILIKE $${paramCount} OR g.staff_name ILIKE $${paramCount})`;
    values.push(`%${search.trim()}%`);
  }

  // Date filters
  if (filters.dateRange) {
    if (filters.dateRange === 'today') {
      query += ` AND g.created_at >= CURRENT_DATE`;
    } else if (filters.dateRange === 'week') {
      query += ` AND g.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (filters.dateRange === 'month') {
      query += ` AND g.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }
  }

  // Rating filter
  if (filters.rating) {
    paramCount++;
    query += ` AND f.rating = $${paramCount}`;
    values.push(parseInt(filters.rating, 10));
  }

  // Vehicle filter
  if (filters.vehicleType) {
    paramCount++;
    query += ` AND g.vehicle_type = $${paramCount}`;
    values.push(filters.vehicleType);
  }

  query += ` ORDER BY g.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
  values.push(limit, offset);

  const { rows } = await pool.query(query, values);
  return rows;
};

/**
 * Gets the total count of history records matching filters for pagination.
 */
const getHistoryCount = async (userId, role, search = '', filters = {}) => {
  let query = `
    SELECT COUNT(*) 
    FROM generations g
    LEFT JOIN feedback f ON f.generation_id = g.id
    WHERE 1=1
  `;
  const values = [];
  let paramCount = 0;

  if (role !== 'admin') {
    paramCount++;
    query += ` AND g.user_id = $${paramCount}`;
    values.push(userId);
  }

  if (search && search.trim()) {
    paramCount++;
    query += ` AND (g.customer_name ILIKE $${paramCount} OR g.destination ILIKE $${paramCount} OR g.staff_name ILIKE $${paramCount})`;
    values.push(`%${search.trim()}%`);
  }

  if (filters.dateRange) {
    if (filters.dateRange === 'today') {
      query += ` AND g.created_at >= CURRENT_DATE`;
    } else if (filters.dateRange === 'week') {
      query += ` AND g.created_at >= CURRENT_DATE - INTERVAL '7 days'`;
    } else if (filters.dateRange === 'month') {
      query += ` AND g.created_at >= CURRENT_DATE - INTERVAL '30 days'`;
    }
  }

  if (filters.rating) {
    paramCount++;
    query += ` AND f.rating = $${paramCount}`;
    values.push(parseInt(filters.rating, 10));
  }

  if (filters.vehicleType) {
    paramCount++;
    query += ` AND g.vehicle_type = $${paramCount}`;
    values.push(filters.vehicleType);
  }

  const { rows } = await pool.query(query, values);
  return parseInt(rows[0].count, 10);
};

/**
 * Retrieves a single script generation by ID.
 */
const getGenerationById = async (id, userId, role) => {
  let query = 'SELECT * FROM generations WHERE id = $1';
  const values = [id];

  if (role !== 'admin') {
    query += ' AND user_id = $2';
    values.push(userId);
  }

  const { rows } = await pool.query(query, values);
  return rows[0] || null;
};

/**
 * Submits feedback for a generation.
 */
const createFeedback = async (generationId, rating, comment) => {
  const query = `
    INSERT INTO feedback (generation_id, rating, comment) 
    VALUES ($1, $2, $3) 
    RETURNING *
  `;
  const values = [generationId, rating, comment];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

/**
 * Computes general metrics and distributions for analytics.
 */
const getAnalytics = async () => {
  // Total generations
  const totalRes = await pool.query('SELECT COUNT(*) FROM generations');
  const totalGenerations = parseInt(totalRes.rows[0].count, 10) || 0;

  // Average rating
  const avgRes = await pool.query('SELECT AVG(rating) FROM feedback');
  const averageRating = parseFloat(avgRes.rows[0].avg) || 0;

  // Success rate: percentage of generations with rating >= 4
  const successRes = await pool.query(`
    SELECT 
      CASE 
        WHEN COUNT(*) = 0 THEN 0
        ELSE (COUNT(CASE WHEN rating >= 4 THEN 1 END) * 100.0 / COUNT(*))
      END as rate
    FROM feedback
  `);
  const successRate = parseFloat(successRes.rows[0].rate) || 0;

  // Most popular destination
  const destRes = await pool.query(`
    SELECT destination, COUNT(*) as count 
    FROM generations 
    WHERE destination IS NOT NULL AND destination != ''
    GROUP BY destination 
    ORDER BY count DESC 
    LIMIT 1
  `);
  const mostPopularDestination = destRes.rows[0]?.destination || 'N/A';

  // Most used vehicle
  const vehicleRes = await pool.query(`
    SELECT vehicle_type, COUNT(*) as count 
    FROM generations 
    WHERE vehicle_type IS NOT NULL AND vehicle_type != ''
    GROUP BY vehicle_type 
    ORDER BY count DESC 
    LIMIT 1
  `);
  const mostUsedVehicle = vehicleRes.rows[0]?.vehicle_type || 'N/A';

  // Revenue opportunity: prefer real upgrade_price, fall back to 40% uplift estimate
  const revenueRes = await pool.query(`
    SELECT COALESCE(SUM(
      CASE 
        WHEN upgrade_price IS NOT NULL AND upgrade_price != '' 
        THEN COALESCE(NULLIF(REGEXP_REPLACE(upgrade_price, '[^0-9.]', '', 'g'), '')::NUMERIC, 0)
        ELSE COALESCE(NULLIF(REGEXP_REPLACE(current_price, '[^0-9.]', '', 'g'), '')::NUMERIC, 0) * 0.4
      END
    ), 0) as revenue
    FROM generations
  `);
  const revenueOpportunity = parseFloat(revenueRes.rows[0].revenue) || 0;

  // Rating distribution (1 to 5 stars)
  const trendRes = await pool.query(`
    SELECT rating, COUNT(*) 
    FROM feedback 
    WHERE rating IS NOT NULL 
    GROUP BY rating 
    ORDER BY rating ASC
  `);
  const ratingDistribution = [1, 2, 3, 4, 5].map(stars => {
    const found = trendRes.rows.find(row => parseInt(row.rating, 10) === stars);
    return {
      rating: stars,
      count: found ? parseInt(found.count, 10) : 0
    };
  });

  // Daily usage (last 30 days)
  const dailyRes = await pool.query(`
    SELECT DATE(created_at) as date, COUNT(*) as count 
    FROM generations 
    WHERE created_at >= NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at) 
    ORDER BY date ASC
  `);
  const dailyUsage = dailyRes.rows.map(row => ({
    date: new Date(row.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    count: parseInt(row.count, 10)
  }));

  // Vehicle types distribution
  const vehicleTypesRes = await pool.query(`
    SELECT vehicle_type, COUNT(*) as count 
    FROM generations 
    WHERE vehicle_type IS NOT NULL AND vehicle_type != ''
    GROUP BY vehicle_type
    ORDER BY count DESC
  `);
  const vehicleTypesDistribution = vehicleTypesRes.rows.map(row => ({
    vehicle: row.vehicle_type,
    count: parseInt(row.count, 10)
  }));

  return {
    total_generations: totalGenerations,
    average_rating: averageRating,
    success_rate: successRate,
    most_popular_destination: mostPopularDestination,
    most_used_vehicle: mostUsedVehicle,
    revenue_opportunity: revenueOpportunity,
    rating_distribution: ratingDistribution,
    daily_usage: dailyUsage,
    vehicle_types: vehicleTypesDistribution
  };
};

/**
 * Creates an audit log entry.
 */
const createAuditLog = async (userId, action, details, ipAddress) => {
  const query = `
    INSERT INTO audit_logs (user_id, action, details, ip_address)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const values = [userId, action, details, ipAddress];
  const { rows } = await pool.query(query, values);
  return rows[0];
};

module.exports = {
  createGeneration,
  getHistory,
  getHistoryCount,
  getGenerationById,
  createFeedback,
  getAnalytics,
  createAuditLog
};
