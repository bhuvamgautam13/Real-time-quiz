const rateLimit = require('express-rate-limit');


const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   
  max: 10,               
  standardHeaders: true,       
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
  skipSuccessfulRequests: true, 
});


const quizLimiter = rateLimit({
  windowMs: 60 * 1000,        
  max: 30,                    
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many quiz requests. Please slow down.',
  },
});


const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 5,                     
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many file uploads. Please try again in 1 hour.',
  },
});


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  
  max: 200,                  
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
  },
});


const leaderboardLimiter = rateLimit({
  windowMs: 60 * 1000,        
  max: 60,                    
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many leaderboard requests. Please slow down.',
  },
});

module.exports = {
  authLimiter,
  quizLimiter,
  uploadLimiter,
  generalLimiter,
  leaderboardLimiter,
};