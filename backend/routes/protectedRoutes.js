// backend/routes/protectedRoutes.js
const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');

const router = express.Router();

// Protected user route
router.get('/user-data', authMiddleware.authenticate, (req, res) => {
  res.json({ 
    message: 'User data accessed successfully',
    user: req.user // Includes the decoded user information from the JWT
  });
});

// Protected admin route
router.get('/admin-data', authMiddleware.authenticate, authMiddleware.authorizeAdmin, (req, res) => {
  res.json({ 
    message: 'Admin data accessed successfully',
    user: req.user
  });
});

module.exports = router;