const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getSystemSettings } = require('../config/systemConfig');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const systemSettings = await getSystemSettings();
      
      const decoded = jwt.verify(token, systemSettings.jwtSecret);
      req.user = await User.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if account is suspended
      if (req.user.isSuspended) {
        return res.status(403).json({ message: 'Account has been suspended' });
      }

      // Validate token version for session revocation / force logout
      if (decoded.tokenVersion !== undefined && decoded.tokenVersion !== req.user.tokenVersion) {
        return res.status(401).json({ message: 'Token has been revoked, please log in again' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };
