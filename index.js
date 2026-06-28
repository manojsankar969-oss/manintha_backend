const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const { initDb } = require('./config/db');
const apiRouter = require('./routes/api');
const errorHandler = require('./middlewares/errorHandler');
const { generalLimiter } = require('./middlewares/rateLimiter');

const app = express();
const port = process.env.PORT || 5001;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:5173'];

// 1. CORS Middleware (Must run before routes)
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// 2. Security and Logging Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(morgan('dev'));
app.use(express.json());

// 3. Global rate limiter
app.use(generalLimiter);

// 4. Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// 5. API Routes
app.use('/api', apiRouter);

// 5. Global Error Handling Middleware (Must be registered last)
app.use(errorHandler);

// 6. Database Initialization and Server Bootstrap
const bootstrap = async () => {
  try {
    // Run database table checks
    await initDb();
  } catch (err) {
    console.warn('⚠️ Warning: Database connection failed. Please check your DATABASE_URL in .env.');
    console.warn(`Details: ${err.message}`);
  }

  // Start Server
  const server = app.listen(port, () => {
    console.log(`✅ Upgradeable backend is ACTIVE and listening on port ${port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${port} is already in use. Retrying with a different port or kill the blocking process.`);
    } else {
      console.error('❌ Server bootstrap error:', err);
    }
  });
};

bootstrap();

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at Promise:', promise, 'reason:', reason);
});
