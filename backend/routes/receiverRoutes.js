const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const receiverController = require('../controllers/receiverController');
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const axios = require('axios');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/prescriptions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'prescription-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Create a new blood request - protected route
//router.post('/create', authMiddleware.authenticate, receiverController.upload, receiverController.createReceiver);

// Get user's requests - protected route
router.get('/my-requests', authenticateToken, async (req, res) => {
  console.log('=== Fetching requests for user ===');
  console.log('User ID:', req.user.id);

  try {
    const [userRows] = await db.execute('SELECT id FROM users WHERE id = ?', [req.user.id]);
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch requests + selected donor details (if any)
    const [rows] = await db.execute(
      `SELECT 
        r.*,
        u.full_name AS receiver_name,
        u.email AS receiver_email,
        u.phone_number AS receiver_phone,
        d.full_name AS donor_name,
        d.blood_type AS donor_blood_type,
        d.contact_number AS donor_contact,
        d.district AS donor_district,
        d.state AS donor_state,
        d.last_donation_date AS donor_last_donation_date,
        d.availability_time AS donor_availability_time
       FROM receivers r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN donors d ON r.selected_donor_id = d.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );

    console.log('Found requests:', rows.length);

    return res.status(200).json({
      success: true,
      requests: rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        bloodType: row.blood_type,
        status: row.status,
        fullName: row.receiver_name,
        phoneNumber: row.receiver_phone,
        reasonForRequest: row.reason_for_request,
        address: row.address,
        district: row.district,
        state: row.state,
        country: row.country,
        prescriptionPath: row.prescription_path,
        locationLat: row.location_lat,
        locationLng: row.location_lng,
        createdAt: row.created_at,
        selectedDonor: row.selected_donor_id
          ? {
              name: row.donor_name,
              bloodType: row.donor_blood_type,
              contact: row.donor_contact,
              district: row.donor_district,
              state: row.donor_state,
              availability_time: row.donor_availability_time,
              lastDonationDate: row.donor_last_donation_date
            }
          : null
      }))
    });

  } catch (error) {
    console.error('=== Error fetching receiver requests ===');
    console.error('Error message:', error.message);
    if (error.sql) console.error('SQL Error:', { sql: error.sql, sqlMessage: error.sqlMessage });
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch blood requests',
      error: error.message
    });
  }
});


// Get all pending requests - protected route
router.get('/pending', authMiddleware.authenticate, receiverController.getAllPendingRequests);

// Update request status - protected route
router.put('/:requestId/status', authMiddleware.authenticate, receiverController.updateRequestStatus);

// Delete request - protected route
router.delete('/:requestId', authMiddleware.authenticate, receiverController.deleteRequest);

// Get receiver request by ID
// Get receiver request by ID
router.get('/request/:id', authenticateToken, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT r.*, u.full_name, u.phone_number
       FROM receivers r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    const request = rows[0];
    return res.json({
      success: true,
      request: {
        id: request.id,
        userId: request.user_id,
        bloodType: request.blood_type,
        status: request.status,
        fullName: request.full_name,
        phoneNumber: request.phone_number,
        district: request.district,
        state: request.state
      }
    });
  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch request details'
    });
  }
});


// Create new receiver request
router.post('/create-request', authenticateToken, upload.single('prescription'), async (req, res) => {
  try {
    // Log all received fields for debugging
    console.log('Received fields:', Object.keys(req.body));
    console.log('Received file:', req.file);
    console.log('Request user:', req.user);

    // Validate required fields
    const requiredFields = [
      'full_name', 'age', 'blood_type', 'phone_number',
      'country', 'state', 'district', 'address', 'reason_for_request'
    ];
    
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Log the SQL query and values
    const sql = `INSERT INTO receivers (
      id, user_id, full_name, age, blood_type, phone_number,
      country, state, district, address,
      location_lat, location_lng, location_address,
      reason_for_request, prescription_path,
      status, created_at
    ) VALUES (
      NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW()
    )`;

    const values = [
      req.user.id,
      req.body.full_name,
      parseInt(req.body.age),
      req.body.blood_type,
      req.body.phone_number,
      req.body.country,
      req.body.state,
      req.body.district,
      req.body.address,
      req.body.location_lat === 'null' ? null : parseFloat(req.body.location_lat),
      req.body.location_lng === 'null' ? null : parseFloat(req.body.location_lng),
      req.body.address, // Use the full address for location_address
      req.body.reason_for_request,
      req.file ? req.file.filename : null,
      'pending'  // Default status for new requests
    ];

    // Insert into database
    const [result] = await db.execute(sql, values);
    console.log('Successfully inserted receiver with ID:', result.insertId);

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: {
        id: result.insertId
      }
    });

  } catch (error) {
    console.error('Error in /create-request:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get request by ID
router.get('/:requestId', authenticateToken, receiverController.getRequest);

// Get request status
router.get('/:requestId/status', authenticateToken, receiverController.getRequestStatus);

// Update request status
router.patch('/:requestId/status', authenticateToken, receiverController.updateRequestStatus);

// Select a donor
router.post('/select-donor', authMiddleware.authenticate, async (req, res) => {
  try {
    const { requestId, donorId } = req.body;
    const userId = req.user.id;

    // Verify the request belongs to the user
    const [request] = await db.execute(
      'SELECT * FROM receivers WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    // Update the request with selected donor
    await db.execute(
      'UPDATE receivers SET selected_donor_id = ?, status = "matched" WHERE id = ?',
      [donorId, requestId]
    );

    // Create a notification for the donor
    await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donor_selected")',
      [donorId, `You have been selected as a donor for a blood request`]
    );

    res.json({
      success: true,
      message: 'Donor selected successfully'
    });

  } catch (error) {
    console.error('Error selecting donor:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to select donor',
      error: error.message
    });
  }
});

// Complete donation
router.post('/complete-donation', authMiddleware.authenticate, async (req, res) => {
  try {
    const { requestId, donorId } = req.body;
    const userId = req.user.id;

    // Verify the request belongs to the user
    const [request] = await db.execute(
      'SELECT * FROM receivers WHERE id = ? AND user_id = ?',
      [requestId, userId]
    );

    if (request.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or unauthorized'
      });
    }

    // Update the request status
    await db.execute(
      'UPDATE receivers SET status = "completed" WHERE id = ?',
      [requestId]
    );

    // Create notifications for both parties
    await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donation_completed")',
      [donorId, 'The blood donation has been marked as completed']
    );

    await db.execute(
      'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donation_completed")',
      [userId, 'The blood donation has been marked as completed']
    );

    res.json({
      success: true,
      message: 'Donation marked as completed'
    });

  } catch (error) {
    console.error('Error completing donation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete donation',
      error: error.message
    });
  }
});

// Get matching donors
router.get('/:requestId/location-donors', authenticateToken, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get receiver's blood type and location
    const [receiver] = await db.execute(
      `SELECT blood_type, district, state FROM receivers WHERE id = ?`,
      [requestId]
    );

    if (!receiver[0]) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Find matching donors
    const [donors] = await db.execute(
      `SELECT 
        d.id,
        u.full_name as name,
        u.blood_type as bloodType,
        u.phone_number as contact,
        d.district,
        d.state,
        d.availability_time,
        d.last_donation_date
       FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE u.blood_type = ?
       AND d.district = ?
       AND d.state = ?
       AND d.status = 'active'`,
      [receiver[0].blood_type, receiver[0].district, receiver[0].state]
    );

    return res.json({
      success: true,
      donors: donors
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch donors'
    });
  }
});

module.exports = router;