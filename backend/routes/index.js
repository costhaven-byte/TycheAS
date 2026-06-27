// routes/index.js
// Top-level API router. Mounts each provider's routes under its own namespace.
// Future providers (whatsapp, linkedin, tiktok, google, stripe) mount here too:
//   router.use('/whatsapp', whatsappRoutes);

import { Router } from 'express';
import metaRoutes from './metaRoutes.js';
import chatbotRoutes from './chatbotRoutes.js';

const router = Router();

router.use('/meta', metaRoutes);
router.use('/chatbot', chatbotRoutes);

export default router;
