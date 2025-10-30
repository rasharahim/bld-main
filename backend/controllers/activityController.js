const db = require('../config/db');
const upload = require('../config/multer');

exports.createDonation = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { 
      blood_type, 
      availability_start, 
      availability_end,
      health_conditions,
      location
    } = req.body;

    await db.beginTransaction();

    try {
      // Create donation activity
      const [result] = await db.query(`
        INSERT INTO activities (
          user_id, type, status, blood_type,
          availability_start, availability_end, location
        ) VALUES (?, 'DONATION', 'AVAILABLE', ?, ?, ?, ?)
      `, [userId, blood_type, availability_start, availability_end, location]);

      // Update donor availability
      await db.query(`
        UPDATE donor_availability 
        SET is_available = TRUE 
        WHERE user_id = ?
      `, [userId]);

      await db.commit();
      res.status(201).json({ message: 'Donation registered successfully' });
    } catch (err) {
      await db.rollback();
      throw err;
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createRequest = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { blood_type, quantity, hospital, reason } = req.body;
    const prescription_path = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(`
      INSERT INTO activities (
        user_id, type, status, blood_type,
        quantity, hospital, reason, prescription_path
      ) VALUES (?, 'REQUEST', 'PENDING', ?, ?, ?, ?, ?)
    `, [userId, blood_type, quantity, hospital, reason, prescription_path]);

    res.status(201).json({ 
      message: 'Blood request submitted',
      activityId: result.insertId
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};