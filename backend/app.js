// app.js
// Builds and configures the Express application (no network listening here —
// that's server.js). Kept separate so the app can be imported in tests.

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import env, { allowedOrigins } from './config/index.js';
import apiRouter from './routes/index.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();

// Security headers.
app.use(helmet());

// CORS — only allow the configured frontend origins. Requests with no Origin
// (curl, server-to-server, health checks) are allowed through.
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      logger.warn(`CORS blocked origin: ${origin}`);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parsing. Capture the raw body so webhook signatures can be verified
// (Meta signs the exact bytes; we must hash the raw payload, not a re-serialized
// version).
app.use(
  express.json({
    limit: '1mb',
    verify(req, _res, buf) {
      req.rawBody = buf;
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Request logging (skip in test).
if (env.nodeEnv !== 'test') {
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));
}

// Global rate limit for all API traffic.
app.use('/api', apiLimiter);

// Root — quick liveness probe.
app.get('/', (_req, res) => {
  res.json({ service: 'lucrator-backend', status: 'ok', docs: '/api/meta/health' });
});

// API routes.
app.use('/api', apiRouter);

// 404 + centralized error handling (order matters: these go last).
app.use(notFound);
app.use(errorHandler);

export default app;
