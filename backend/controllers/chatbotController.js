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
      // True when the booking/buying agent can actually write to the calendar.
      agentEnabled: chatbot.agentEnabled(),
      questionLimit: env.chatbot.questionLimit,
    },
  });
};

export const ask = asyncHandler(async (req, res) => {
  const { messages, lang, clientId } = req.body;
  // clientId tells the agent whose sheet to book into (the client whose site this
  // widget is on). Falls back to the backend's default client (env.crm.clientId).
  const { reply, actions } = await chatbot.ask({ messages, lang, clientId });

  // express-rate-limit populates req.rateLimit on the chatLimiter'd route.
  const remaining = typeof req.rateLimit?.remaining === 'number' ? req.rateLimit.remaining : null;

  res.json({
    success: true,
    data: {
      reply,
      // Bookings/sales the agent actually landed this turn (for the UI to confirm).
      actions: actions || [],
      limitReached: remaining === 0,
      questionsRemaining: remaining,
    },
  });
});

export default { health, ask };
