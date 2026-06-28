/**
 * Global centralized error-handling middleware.
 */
const errorHandler = (err, req, res, next) => {
  console.error('❌ Express Server Error:', err.message || err);
  
  const statusCode = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    // Avoid leaking stack trace in production environments
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
};

module.exports = errorHandler;
