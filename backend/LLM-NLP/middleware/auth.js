// backend/LLM-NLP/middleware/auth.js
function authenticateToken(req, res, next) {
    // Simple stub implementation - replace with real auth logic
    console.log('Auth middleware called - allowing request');
    next();
  }
  
  module.exports = { authenticateToken };