const express = require('express');
const router = express.Router();
const db = require('../config/db');
const authMiddleware = require('../middlewares/authMiddleware');
const profileController = require('../controllers/profileController');
const upload = require('../config/multer');
const bcrypt = require('bcrypt');

// Get user profile
router.get('/', authMiddleware.authenticate, profileController.getProfile);

// Update user profile
router.put('/', authMiddleware.authenticate, profileController.updateProfile);

// Upload profile picture
router.post('/profile-picture', authMiddleware.authenticate, upload.single('profilePicture'), profileController.updateProfilePicture);

// Update password
router.put('/update-password', authMiddleware.authenticate, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    // Verify old password
    const [user] = await db.execute(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user[0].password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await db.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Error updating password:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update password',
      error: error.message
    });
  }
});

// Toggle availability
router.post('/toggle-availability', authMiddleware.authenticate, async (req, res) => {
  try {
    const [user] = await db.execute(
      'SELECT is_available FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user.length) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const newAvailability = !user[0].is_available;

    await db.execute(
      'UPDATE users SET is_available = ? WHERE id = ?',
      [newAvailability, req.user.id]
    );

    res.json({
      success: true,
      message: `You are now ${newAvailability ? 'available' : 'unavailable'} for donation`,
      isAvailable: newAvailability
    });

  } catch (error) {
    console.error('Error toggling availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
      error: error.message
    });
  }
});

module.exports = router;
