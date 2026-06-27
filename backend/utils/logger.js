// utils/logger.js
// Tiny structured logger. Intentionally dependency-free.
// IMPORTANT: never pass secrets (tokens/app secret) into the logger.

import env from '../config/env.js';

function ts() {
  return new Date().toISOString();
}

const logger = {
  info(message, meta) {
    console.log(`[${ts()}] [info] ${message}`, meta ? meta : '');
  },
  warn(message, meta) {
    console.warn(`[${ts()}] [warn] ${message}`, meta ? meta : '');
  },
  error(message, meta) {
    console.error(`[${ts()}] [error] ${message}`, meta ? meta : '');
  },
  debug(message, meta) {
    if (!env.isProduction) {
      console.log(`[${ts()}] [debug] ${message}`, meta ? meta : '');
    }
  },
};

export default logger;
