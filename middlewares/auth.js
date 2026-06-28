const { createClient } = require('@supabase/supabase-js');
const { pool } = require('../config/db');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabase;
if (supabaseUrl && supabaseAnonKey && supabaseUrl !== 'YOUR_SUPABASE_URL') {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn('⚠️ Warning: Supabase client is not configured on the backend. Auth middleware will run in bypass/development mode if credentials are missing.');
}

/**
 * Ensures that a user profile exists in our PostgreSQL database.
 */
const ensureProfileExists = async (supabaseUser) => {
  const { id, email, user_metadata } = supabaseUser;
  const name = user_metadata?.full_name || user_metadata?.name || email.split('@')[0];

  try {
    const checkQuery = 'SELECT * FROM profiles WHERE id = $1';
    const { rows } = await pool.query(checkQuery, [id]);

    if (rows.length === 0) {
      // Determine role:
      // 1. If email contains 'manoj' or is manojsankar969@gmail.com, make it admin.
      // 2. If it's the first user in the database, make it admin.
      // 3. Otherwise, staff.
      let role = 'staff';
      const emailLower = email.toLowerCase();
      if (emailLower.includes('manoj') || emailLower === 'manojsankar969@gmail.com') {
        role = 'admin';
      } else {
        const countQuery = 'SELECT COUNT(*) FROM profiles';
        const countRes = await pool.query(countQuery);
        if (parseInt(countRes.rows[0].count, 10) === 0) {
          role = 'admin';
        }
      }

      const insertQuery = `
        INSERT INTO profiles (id, email, name, role)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `;
      const { rows: newProfile } = await pool.query(insertQuery, [id, email, name, role]);
      console.log(`👤 Created new profile for ${email} with role ${role}`);
      return newProfile[0];
    }
    return rows[0];
  } catch (err) {
    console.error('❌ Error ensuring profile exists:', err);
    throw err;
  }
};

/**
 * Middleware to require a valid Supabase JWT token.
 */
const requireAuth = async (req, res, next) => {
  // Support bypass mode for development if Supabase is not configured yet
  if (!supabase) {
    console.log('🛡️ Auth Bypass: Using development mock user.');
    req.user = {
      id: '00000000-0000-0000-0000-000000000000',
      email: 'development@manivtha.com',
      name: 'Development User',
      role: 'admin'
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized. Bearer token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or expired token.' });
    }

    // Sync user with our local profiles table and get their role
    const profile = await ensureProfileExists(user);
    
    // Attach user profile to request
    req.user = {
      id: user.id,
      email: user.email,
      name: profile.name,
      role: profile.role
    };

    next();
  } catch (err) {
    console.error('❌ Auth middleware error:', err);
    return res.status(401).json({ error: 'Unauthorized. Token verification failed.' });
  }
};

/**
 * Middleware to require Admin role.
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized. Please authenticate first.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden. Admin access required.' });
  }

  next();
};

module.exports = {
  requireAuth,
  requireAdmin
};
