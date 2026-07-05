const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Protects routes by verifying the JWT sent in the Authorization header.
 * Expected header format: "Authorization: Bearer <token>"
 * On success, attaches the authenticated user (minus password) to req.user.
 */
const protect = async (req, res, next) => {
  let token;

  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      token = authHeader.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach the user to the request, excluding the password field
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ message: 'User no longer exists' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error(`Auth middleware error: ${error.message}`);
      return res.status(401).json({ message: 'Not authorized, token invalid or expired' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

module.exports = { protect };
