'use strict';

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();

// ── Trust proxy (required for Render / Railway / Heroku) ──────────────────────
app.set('trust proxy', 1);

// ── Security headers ──────────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://www.instagram.com'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        mediaSrc: ["'self'", 'https:', 'blob:'],
        connectSrc: [
          "'self'",
          'https://api.themoviedb.org',
          'https://image.tmdb.org',
          'https://news.google.com',
          'https://www.reddit.com',
          'https://t2blive.com',
        ],
        frameSrc: [
          "'self'",
          'https://www.youtube.com',
          'https://www.instagram.com',
        ],
      },
    },
    crossOriginEmbedderPolicy: false, // needed for YouTube iframes
  })
);

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like curl, mobile apps, server-to-server)
      if (!origin) return callback(null, true);

      const cleanOrigin = origin.trim().replace(/\/$/, '');
      const isAllowed =
        ALLOWED_ORIGINS.includes(cleanOrigin) ||
        cleanOrigin.endsWith('.vercel.app');

      if (isAllowed) {
        callback(null, true);
      } else {
        console.warn(`[CORS Blocked] Origin not allowed: ${origin}`);
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // Prevent large payload attacks
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ── HTTP request logging ──────────────────────────────────────────────────────
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 500,                   // 500 requests per window per IP (handles homepage Promise.all)
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again in 15 minutes.' },
  skip: (req) => process.env.NODE_ENV === 'development', // relax in dev
});
app.use('/api/', apiLimiter);

// Stricter limiter for auth endpoints
const authLimiterStrict = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth attempts. Please try again later.' },
});

// ── Root health check ─────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  const dbStates = { 0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting' };
  res.json({
    success: true,
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    db: dbStates[mongoose.connection.readyState] || 'unknown',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── Routes ────────────────────────────────────────────────────────────────────
const moviesRouter = require('./routes/movies');
const celebritiesRouter = require('./routes/celebrities');
const boxOfficeRouter = require('./routes/boxoffice');
const socialRouter = require('./routes/social');
const authRouter = require('./routes/auth');
const favouritesRouter = require('./routes/favourites');
const memesRouter = require('./routes/memes');
const watchlistRouter = require('./routes/watchlist');
const chatRouter = require('./routes/chat');

app.use('/api/movies', moviesRouter);
app.use('/api/celebrities', celebritiesRouter);
app.use('/api/boxoffice', boxOfficeRouter);
app.use('/api/social', socialRouter);
app.use('/api/auth', authLimiterStrict, authRouter);
app.use('/api/favourites', favouritesRouter);
app.use('/api/memes', memesRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/chat', chatRouter);

// ── 404 + Error Handlers (must be last) ──────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Database connection ───────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('[server] ❌ FATAL: MONGO_URI environment variable is not set.');
  process.exit(1);
}

// Connection Event Logging
mongoose.connection.on('connected', () => console.log('[server] 🟢 MongoDB connected successfully'));
mongoose.connection.on('error', (err) => console.error('[server] 🔴 MongoDB connection error:', err.message));
mongoose.connection.on('disconnected', () => console.warn('[server] 🟡 MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('[server] 🟢 MongoDB reconnected'));

// Production-ready connection logic with Automatic Retry and Exponential Backoff
const connectDB = async () => {
  let retries = 5;
  let delay = 2000;

  while (retries > 0) {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 5000, // Connection Timeout
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 10000,
        retryWrites: true,
        w: 'majority'
      });
      return; // Success
    } catch (err) {
      retries -= 1;
      console.error(`[server] ❌ MongoDB Connection Failed: ${err.message}`);
      
      // Meaningful Error Messages based on common issues
      if (err.message.includes('whitelist') || err.message.includes('not connect to any servers')) {
        console.error('[server] 💡 HINT: Your IP might have changed (Dynamic IP issue). Please update your MongoDB Atlas Network Access whitelist to 0.0.0.0/0 for development.');
      }

      if (retries === 0) {
        console.error('[server] ❌ FATAL: Max connection retries reached. Exiting.');
        process.exit(1);
      }
      
      console.log(`[server] ⏳ Retrying connection in ${delay / 1000} seconds... (${retries} retries left)`);
      // Exponential Backoff
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; 
    }
  }
};

connectDB();

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
const server = app.listen(PORT, () =>
  console.log(`[server] 🚀 Running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
const gracefulShutdown = async (signal) => {
  console.log(`\n[server] ${signal} received — shutting down gracefully…`);
  
  // Force exit after 10 seconds if shutdown hangs
  const forceExit = setTimeout(() => {
    console.error('[server] ❌ Forced exit after 10s timeout.');
    process.exit(1);
  }, 10000);
  forceExit.unref();

  try {
    await new Promise((resolve) => server.close(resolve));
    console.log('[server] HTTP server closed.');
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close(false);
      console.log('[server] 🟢 MongoDB connection closed successfully.');
    }
    clearTimeout(forceExit);
    process.exit(0);
  } catch (err) {
    console.error('[server] ❌ Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ── Unhandled rejections ──────────────────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app; // for testing
