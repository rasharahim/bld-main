// backend/routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/stats', async (req, res) => {
  try {
    const [donors] = await db.promise().query('SELECT COUNT(*) as count FROM users');
    const [requests] = await db.promise().query('SELECT COUNT(*) as count FROM blood_requests');
    const [donations] = await db.promise().query('SELECT SUM(units) as total FROM donations');
    
    res.json({
      donors: donors[0].count,
      requests: requests[0].count,
      livesSaved: Math.floor(donations[0].total / 2) // Assuming 1 donation saves ~2 lives
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;