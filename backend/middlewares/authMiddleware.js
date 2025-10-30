const jwt = require('jsonwebtoken');
require('dotenv').config();

const authMiddleware = {
  authenticate: (req, res, next) => {
    console.log('Auth headers:', req.headers);
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('No Authorization header found');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication failed: No Authorization header provided' 
      });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('No token found in Authorization header');
      return res.status(401).json({ 
        success: false,
        error: 'Authentication failed: No token found in Authorization header' 
      });
    }

    try {
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET not found in environment variables');
        return res.status(500).json({ 
          success: false,
          error: 'Server configuration error' 
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token decoded successfully:', { userId: decoded.id, email: decoded.email });
      req.user = decoded;
      next();
    } catch (error) {
      console.error('Token verification failed:', error.message);
      res.status(401).json({ 
        success: false,
        error: `Authentication failed: ${error.message}` 
      });
    }
  },

  authorizeAdmin: (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false,
        error: 'Authentication required before authorization' 
      });
    }

    if (!req.user.isAdmin) {
      return res.status(403).json({ 
        success: false,
        error: 'Admin access required for this operation' 
      });
    }
    next();
  }
};

module.exports = authMiddleware;