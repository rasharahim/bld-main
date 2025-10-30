const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Get user's notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const [notifications] = await db.execute(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.execute(
      'UPDATE notifications SET is_read = true WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message
    });
  }
});

module.exports = router;
