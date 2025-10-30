const db = require('../config/db');
const { validationResult } = require('express-validator');

const donorController = {
  // Create a new donor
  createDonor: async (req, res) => {
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

      // Check if user is already a donor
      const [existingDonor] = await db.execute(
        'SELECT id FROM donors WHERE user_id = ?',
        [req.user.id]
      );

      if (existingDonor.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'User is already registered as a donor'
        });
      }

      // Insert into database
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
        'pending'  // Set status explicitly as the last parameter
      ];

      const [result] = await db.execute(sql, values);

      // Update user's blood type
      await db.execute(
        'UPDATE users SET blood_type = ? WHERE id = ?',
        [blood_type, req.user.id]
      );

      res.status(201).json({
        success: true,
        message: 'Donor registered successfully',
        data: {
          id: result.insertId,
          ...req.body
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
  },

  // Get donor by ID
  getDonor: async (req, res) => {
    try {
      const [rows] = await db.execute(
        `SELECT d.*, u.email, u.phone_number
         FROM donors d
         JOIN users u ON d.user_id = u.id
         WHERE d.user_id = ?`,
        [req.user.id]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }

      res.json({
        success: true,
        data: rows[0]
      });
    } catch (error) {
      console.error('Error fetching donor:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Update donor status
  updateStatus: async (req, res) => {
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
          message: 'Donor not found'
        });
      }

      res.json({
        success: true,
        message: 'Status updated successfully'
      });
    } catch (error) {
      console.error('Error updating donor status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get nearby blood requests
  getNearbyRequests: async (req, res) => {
    try {
      const { latitude, longitude, radius = 20 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({
          success: false,
          message: 'Latitude and longitude are required'
        });
      }

      const [donor] = await db.execute(
        'SELECT blood_type FROM donors WHERE user_id = ?',
        [req.user.id]
      );

      if (!donor.length) {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }

      // Get nearby requests using Haversine formula
      const [requests] = await db.execute(`
        SELECT 
          r.*,
          u.full_name as requester_name,
          u.phone_number as requester_contact,
          (
            6371 * acos(
              cos(radians(?)) * cos(radians(r.location_lat)) *
              cos(radians(r.location_lng) - radians(?)) +
              sin(radians(?)) * sin(radians(r.location_lat))
            )
          ) AS distance
        FROM receivers r
        JOIN users u ON r.user_id = u.id
        WHERE r.status = 'pending'
          AND r.blood_type = ?
        HAVING distance <= ?
        ORDER BY distance
      `, [latitude, longitude, latitude, donor[0].blood_type, radius]);

      res.json({
        success: true,
        data: requests
      });
    } catch (error) {
      console.error('Error fetching nearby requests:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  },

  // Get all donors (admin only)
  getAllDonors: async (req, res) => {
    try {
      const [donors] = await db.execute(`
        SELECT d.*, u.email, u.phone_number,
        CASE 
          WHEN d.status = 'pending' THEN 'Pending Approval'
          WHEN d.status = 'active' THEN 'Active Donor'
          WHEN d.status = 'rejected' THEN 'Registration Rejected'
          WHEN d.status = 'inactive' THEN 'Account Inactive'
        END as display_status
        FROM donors d
        JOIN users u ON d.user_id = u.id
        ORDER BY d.created_at DESC
      `);

      res.json({
        success: true,
        data: donors
      });
    } catch (error) {
      console.error('Error fetching all donors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching donors',
        error: error.message
      });
    }
  },

  // Admin: Update donor approval status
  updateDonorApproval: async (req, res) => {
    try {
      const { status } = req.body;
      const { donorId } = req.params;

      if (!['active', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid status. Status must be either "active" or "rejected"'
        });
      }

      const [result] = await db.execute(
        'UPDATE donors SET status = ? WHERE id = ?',
        [status, donorId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Donor not found'
        });
      }

      // Get updated donor data
      const [updatedDonor] = await db.execute(`
        SELECT d.*, u.email, u.phone_number,
        CASE 
          WHEN d.status = 'pending' THEN 'Pending Approval'
          WHEN d.status = 'active' THEN 'Active Donor'
          WHEN d.status = 'rejected' THEN 'Registration Rejected'
          WHEN d.status = 'inactive' THEN 'Account Inactive'
        END as display_status
        FROM donors d
        JOIN users u ON d.user_id = u.id
        WHERE d.id = ?
      `, [donorId]);

      res.json({
        success: true,
        message: `Donor ${status === 'active' ? 'approved' : 'rejected'} successfully`,
        data: updatedDonor[0]
      });
    } catch (error) {
      console.error('Error updating donor approval:', error);
      res.status(500).json({
        success: false,
        message: 'Error updating donor status',
        error: error.message
      });
    }
  }
};

console.log("donorController:", donorController);

module.exports = donorController;