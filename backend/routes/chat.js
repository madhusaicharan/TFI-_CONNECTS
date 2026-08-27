'use strict';

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const aiChatService = require('../services/aiChatService');

// Rate limiter for AI Chat requests (cost & quota protection)
const chatLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI search requests. Please wait a few minutes before trying again.'
  }
});

// POST /api/chat - RAG AI Movie Assistant Chat Endpoint
router.post('/', chatLimiter, async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'A valid message string is required.'
      });
    }

    console.log(`[ChatRoute] Received user message: "${message.slice(0, 80)}..."`);
    const result = await aiChatService.chatWithAI(message, history);

    res.json({
      success: true,
      reply: result.reply,
      source: result.source,
      retrievedCount: result.retrievedCount
    });

  } catch (err) {
    console.error('[ChatRoute] Error handling AI request:', err.message);
    // Strict error security: Return generic 500 message without leaking stack traces or API credentials
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your AI movie search request.'
    });
  }
});

module.exports = router;
