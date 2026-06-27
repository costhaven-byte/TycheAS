// server.js
// Entry point. Validates env, starts the HTTP listener, and wires graceful
// shutdown + last-resort crash handlers.

import app from './app.js';
import env, { validateEnv } from './config/index.js';
import logger from './utils/logger.js';

// Validate Meta config (warns, does not crash — health endpoint stays up).
validateEnv();

const server = app.listen(env.port, () => {
  logger.info(`Lucrator backend listening on http://localhost:${env.port} [${env.nodeEnv}]`);
  logger.info(`Health:  GET http://localhost:${env.port}/api/meta/health`);
  logger.info(`Verify:  GET http://localhost:${env.port}/api/meta/test`);
});

// Graceful shutdown.
function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully.`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
  // Force-exit if it hangs.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Last-resort handlers — log (never the secret) and exit so a supervisor restarts.
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason?.message || reason) });
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err?.message });
  process.exit(1);
});

export default server;
