const jwt = require('jsonwebtoken');

const authenticateToken = async (req, res, next) => {
  try {
    console.log('=== Starting authentication ===');
    const authHeader = req.headers['authorization'];
    console.log('Auth header:', authHeader);

    if (!authHeader) {
      console.log('No auth header found');
      return res.status(401).json({
        success: false,
        message: 'No authorization header'
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.log('No token found in auth header');
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }

    // Convert jwt.verify to promise-based
    const user = await new Promise((resolve, reject) => {
      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
          console.error('Token verification failed:', err);
          reject(err);
        } else {
          resolve(decoded);
        }
      });
    });

    console.log('Token verified successfully. User:', user);
    req.user = user;
    next();
  } catch (error) {
    console.error('=== Authentication error ===');
    console.error('Error type:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication error',
      error: error.message
    });
  }
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  isAdmin
}; 