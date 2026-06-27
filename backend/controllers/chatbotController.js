// controllers/chatbotController.js
// Public FAQ chatbot endpoints. The 5-questions-per-IP cap is enforced upstream
// by chatLimiter (see routes); by the time we get here the request is within
// budget, so we just answer and report how many questions remain.

import asyncHandler from '../utils/asyncHandler.js';
import * as chatbot from '../services/chatbot/ChatbotService.js';
import env from '../config/index.js';

export const health = (_req, res) => {
  res.json({
    success: true,
    data: {
      service: 'chatbot',
      configured: chatbot.isConfigured(),
      questionLimit: env.chatbot.questionLimit,
    },
  });
};

export const ask = asyncHandler(async (req, res) => {
  const { messages, lang } = req.body;
  const reply = await chatbot.ask({ messages, lang });

  // express-rate-limit populates req.rateLimit on the chatLimiter'd route.
  const remaining = typeof req.rateLimit?.remaining === 'number' ? req.rateLimit.remaining : null;

  res.json({
    success: true,
    data: {
      reply,
      limitReached: remaining === 0,
      questionsRemaining: remaining,
    },
  });
});

export default { health, ask };
