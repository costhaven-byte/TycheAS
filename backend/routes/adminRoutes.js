// routes/adminRoutes.js
// Internal admin API. Everything here requires the backend API key (x-api-key),
// so only you/your tooling can call it — never the public.

import { Router } from 'express';
import * as admin from '../controllers/adminController.js';
import { apiKeyAuth } from '../middleware/apiKeyAuth.js';
import { validate } from '../middleware/validate.js';
import { writeLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.use(apiKeyAuth);

router.post(
  '/provision',
  writeLimiter,
  validate({
    clientName: { required: true, type: 'string', maxLength: 120 },
    industry: { required: false, type: 'string', maxLength: 80 },
  }),
  admin.provision,
);

export default router;
