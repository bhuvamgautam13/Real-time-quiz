const jwt = require('jsonwebtoken');


const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};


const sendTokenCookie = (res, userId) => {
  const token = generateToken(userId);

  const cookieOptions = {
    httpOnly: true,                                      // Not accessible via document.cookie
    secure: process.env.NODE_ENV === 'production',       // HTTPS only in production
    sameSite: 'strict',                                  // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000,                   // 7 days in ms
  };

  res.cookie('token', token, cookieOptions);

  return token;
};


const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
};

module.exports = { generateToken, sendTokenCookie, verifyToken };