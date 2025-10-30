const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const db = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'));
    }
  }
});

// Get donor profile
router.get('/profile', authenticateToken, async (req, res) => {
  console.log('Fetching donor profile for user:', req.user.id);
  
  try {
    // First check if user exists
    const [userRows] = await db.execute(
      'SELECT id, email FROM users WHERE id = ?',
      [req.user.id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Then check if user is registered as a donor
    const [donorRows] = await db.execute(
      `SELECT d.*, 
              CASE 
                WHEN d.status = 'pending' THEN 'Pending Approval'
                WHEN d.status = 'active' THEN 'Active Donor'
                WHEN d.status = 'rejected' THEN 'Registration Rejected'
                WHEN d.status = 'inactive' THEN 'Account Inactive'
              END as display_status,
              CASE 
                WHEN d.status = 'pending' THEN 'Your registration is pending approval from the admin. Please wait for confirmation.'
                WHEN d.status = 'active' THEN 'Your registration has been approved. You can now receive and respond to donation requests.'
                WHEN d.status = 'rejected' THEN 'Your registration has been rejected. Please contact support for more information.'
                WHEN d.status = 'inactive' THEN 'Your account is currently inactive. Please contact support to reactivate.'
              END as status_message
       FROM donors d
       WHERE d.user_id = ?`,
      [req.user.id]
    );

    if (donorRows.length === 0) {
      return res.status(200).json({
        success: true,
        isRegistered: false,
        message: 'User is not registered as a donor',
        user: {
          id: userRows[0].id,
          email: userRows[0].email
        }
      });
    }

    const donor = donorRows[0];
    return res.status(200).json({
      success: true,
      isRegistered: true,
      data: {
        id: donor.id,
        userId: donor.user_id,
        fullName: donor.full_name,
        bloodType: donor.blood_type,
        status: donor.status,
        displayStatus: donor.display_status,
        statusMessage: donor.status_message,
        contactNumber: donor.contact_number,
        address: donor.address,
        district: donor.district,
        state: donor.state,
        country: donor.country,
        lastDonationDate: donor.last_donation_date,
        donationGapMonths: donor.donation_gap_months,
        totalDonations: donor.total_donations || 0
      }
    });
  } catch (error) {
    console.error('Error fetching donor profile:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch donor profile',
      details: error.message
    });
  }
});

// Create donor
router.post('/createDonor', authenticateToken, async (req, res) => {
  try {
    const {
      full_name,
      date_of_birth,
      blood_type,
      weight,
      contact_number,
      availability_time,
      health_condition,
      last_donation_date,
      donation_gap_months,
      country,
      state,
      district,
      address,
      location_lat,
      location_lng,
      location_address
    } = req.body;

    // Validate required fields
    const requiredFields = [
      'full_name', 'date_of_birth', 'blood_type', 'weight',
      'contact_number', 'availability_time', 'country',
      'state', 'district', 'address'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Insert into database with status 'pending'
    const sql = `INSERT INTO donors (
      user_id, full_name, date_of_birth, blood_type, weight,
      contact_number, availability_time, health_condition,
      last_donation_date, donation_gap_months, country,
      state, district, address, location_lat, location_lng,
      location_address, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const values = [
      req.user.id,
      full_name,
      date_of_birth,
      blood_type,
      parseFloat(weight),
      contact_number,
      availability_time,
      health_condition || null,
      last_donation_date || null,
      parseInt(donation_gap_months) || 0,
      country,
      state,
      district,
      address,
      location_lat ? parseFloat(location_lat) : null,
      location_lng ? parseFloat(location_lng) : null,
      location_address || null,
      'pending'  // Explicitly set status as pending
    ];

    const [result] = await db.execute(sql, values);

    // Update user's blood type
    await db.execute(
      'UPDATE users SET blood_type = ? WHERE id = ?',
      [blood_type, req.user.id]
    );

    // Fetch the created donor to get complete data
    const [newDonor] = await db.execute(
      `SELECT d.*, 
              CASE 
                WHEN d.status = 'pending' THEN 'Pending Approval'
                WHEN d.status = 'active' THEN 'Active Donor'
                WHEN d.status = 'rejected' THEN 'Registration Rejected'
                WHEN d.status = 'inactive' THEN 'Account Inactive'
              END as display_status,
              CASE 
                WHEN d.status = 'pending' THEN 'Your registration is pending approval from the admin. Please wait for confirmation.'
                WHEN d.status = 'active' THEN 'Your registration has been approved. You can now receive and respond to donation requests.'
                WHEN d.status = 'rejected' THEN 'Your registration has been rejected. Please contact support for more information.'
                WHEN d.status = 'inactive' THEN 'Your account is currently inactive. Please contact support to reactivate.'
              END as status_message
       FROM donors d
       WHERE d.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Donor registration submitted successfully. Waiting for admin approval.',
      data: {
        id: result.insertId,
        userId: req.user.id,
        fullName: full_name,
        bloodType: blood_type,
        status: 'pending',
        displayStatus: 'Pending Approval',
        statusMessage: 'Your registration is pending approval from the admin. Please wait for confirmation.',
        contactNumber: contact_number,
        address: address,
        district: district,
        state: state,
        country: country,
        lastDonationDate: last_donation_date || null,
        donationGapMonths: parseInt(donation_gap_months) || 0
      }
    });
  } catch (error) {
    console.error('Error creating donor:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get donor status
router.get('/:donorId/status', authenticateToken, async (req, res) => {
  try {
    const { donorId } = req.params;
    const userId = req.user.id;

    const sql = `
      SELECT 
        status,
        last_donation_date,
        donation_gap_months,
        CASE 
          WHEN status = 'pending' THEN 'Your registration is pending approval'
          WHEN status = 'active' THEN 'Your registration has been approved'
          WHEN status = 'rejected' THEN 'Your registration has been rejected'
          WHEN status = 'inactive' THEN 'Your account is currently inactive'
          ELSE 'Unknown status'
        END as status_message
      FROM donors
      WHERE id = ? AND user_id = ?
    `;

    const [rows] = await db.execute(sql, [donorId, userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    res.json({
      success: true,
      data: {
        status: rows[0].status,
        statusMessage: rows[0].status_message,
        lastDonationDate: rows[0].last_donation_date,
        donationGapMonths: rows[0].donation_gap_months
      }
    });
  } catch (error) {
    console.error('Error fetching donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch donor status',
      error: error.message
    });
  }
});

// Update donor status
router.patch('/:donorId/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const { donorId } = req.params;

    if (!['pending', 'active', 'inactive', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be one of: pending, active, inactive, rejected'
      });
    }

    const [result] = await db.execute(
      'UPDATE donors SET status = ? WHERE id = ? AND user_id = ?',
      [status, donorId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found or you do not have permission to update this donor'
      });
    }

    // Get updated donor data
    const [updatedDonor] = await db.execute(`
      SELECT d.*, 
              CASE 
                WHEN d.status = 'pending' THEN 'Pending Approval'
                WHEN d.status = 'active' THEN 'Active Donor'
                WHEN d.status = 'rejected' THEN 'Registration Rejected'
                WHEN d.status = 'inactive' THEN 'Account Inactive'
              END as display_status,
              CASE 
                WHEN d.status = 'pending' THEN 'Your registration is pending approval from the admin. Please wait for confirmation.'
                WHEN d.status = 'active' THEN 'Your registration has been approved. You can now receive and respond to donation requests.'
                WHEN d.status = 'rejected' THEN 'Your registration has been rejected. Please contact support for more information.'
                WHEN d.status = 'inactive' THEN 'Your account is currently inactive. Please contact support to reactivate.'
              END as status_message
       FROM donors d
       WHERE d.id = ?`,
      [donorId]
    );

    res.json({
      success: true,
      message: 'Status updated successfully',
      data: updatedDonor[0]
    });
  } catch (error) {
    console.error('Error updating donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Get donors from same location as receiver
router.get('/:requestId/location-donors', authenticateToken, async (req, res) => {
  const { requestId } = req.params;
  
  try {
    // First get the request details to get location
    const [request] = await db.execute(
      'SELECT country, state, district, blood_type FROM blood_requests WHERE id = ?',
      [requestId]
    );

    if (!request[0]) {
      return res.status(404).json({
        success: false,
        message: 'Blood request not found'
      });
    }

    const { country, state, district, blood_type } = request[0];

    // Get donors from same location with matching blood type
    const [donors] = await db.execute(
      `SELECT d.id, u.full_name, u.phone_number, d.blood_type, d.availability_time,
              d.district, d.state, d.country, d.last_donation_date
       FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE d.country = ? 
       AND d.state = ?
       AND d.district = ?
       AND d.blood_type = ?
       AND d.status = 'active'
       AND (d.last_donation_date IS NULL OR 
            DATEDIFF(CURRENT_DATE, d.last_donation_date) >= 90)`,
      [country, state, district, blood_type]
    );

    res.json({
      success: true,
      donors: donors
    });

  } catch (error) {
    console.error('Error fetching location-based donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching donors'
    });
  }
});

// Get the receiver who selected this donor (if any)
// Get the receiver who selected this donor
router.get('/selected-receiver', authenticateToken, async (req, res) => {
  try {
    const donorUserId = req.user.id;

    // Find the donor ID from the donors table
    const [donorRows] = await db.execute(
      'SELECT id FROM donors WHERE user_id = ? AND status = "active"',
      [donorUserId]
    );

    if (!donorRows[0]) {
      return res.status(404).json({ success: false, message: 'Donor not found or not active' });
    }

    const donorId = donorRows[0].id;

    // Find the receiver who selected this donor
    const [receiverRows] = await db.execute(
      `SELECT r.full_name AS receiverName,
              r.phone_number AS receiverContact,
              r.blood_type AS receiverBloodType,
              r.address,
              r.district,
              r.state,
              r.status AS requestStatus,
              r.created_at AS requestDate
       FROM receivers r
       WHERE r.selected_donor_id = ?  AND r.status = 'matched'
       LIMIT 1`,
      [donorId]
    );

    if (!receiverRows[0]) {
      return res.json({ success: true, receiver: null }); // No receiver selected yet
    }

    return res.json({ success: true, receiver: receiverRows[0] });
  } catch (err) {
    console.error('Error fetching selected receiver:', err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});




module.exports = router;
