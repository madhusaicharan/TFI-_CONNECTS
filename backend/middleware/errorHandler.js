/**
 * middleware/errorHandler.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralised Express error handler.
 * Must be registered LAST in server.js: app.use(errorHandler)
 *
 * Produces a consistent JSON error shape:
 *   { success: false, message: string, code: number }
 * Stack trace is hidden in production.
 */

const IS_PROD = process.env.NODE_ENV === 'production';

// ── 404 handler ───────────────────────────────────────────────────────────────
const notFound = (req, res, next) => {
  const err = new Error(`Not Found — ${req.originalUrl}`);
  err.statusCode = 404;
  next(err);
};

// ── Global error handler ──────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const isCorsError = err.message && err.message.startsWith('CORS:');
  const defaultStatus = isCorsError ? 403 : 500;
  const statusCode = err.statusCode || err.status || defaultStatus;

  // Mongoose validation error → 400
  const code = err.name === 'ValidationError' ? 400 : statusCode;

  // Build safe message
  let message = err.message || 'Internal Server Error';

  // Never leak internal messages in production
  if (IS_PROD && code === 500) {
    message = 'Internal Server Error';
  }

  const payload = {
    success: false,
    message,
    code,
    ...(IS_PROD ? {} : { stack: err.stack }),
  };

  res.status(code).json(payload);
};

module.exports = { notFound, errorHandler };
