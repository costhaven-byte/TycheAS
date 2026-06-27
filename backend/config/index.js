// config/index.js
// Re-export the validated env config plus small app-wide constants.

import env, { validateEnv } from './env.js';

// Centralized list of allowed CORS origins, derived from env.
export const allowedOrigins = [env.frontendUrl, env.productionFrontendUrl].filter(Boolean);

export { env, validateEnv };
export default env;
