const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/auth');
const db = require('../config/db');

// Add logging middleware for admin actions
const logAdminAction = async (req, res, next) => {
  try {
    const adminId = req.user.id;
    const action = req.method + ' ' + req.path;
    const details = JSON.stringify({
      params: req.params,
      body: req.body,
      query: req.query
    });

    await db.execute(
      'INSERT INTO admin_logs (admin_id, action, details, created_at) VALUES (?, ?, ?, NOW())',
      [adminId, action, details]
    );
    next();
  } catch (error) {
    console.error('Error logging admin action:', error);
    next(); // Continue even if logging fails
  }
};

// Apply logging middleware to all admin routes
router.use(logAdminAction);

// Get all donors
router.get('/donors', authenticateToken, isAdmin, async (req, res) => {
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
});

// Update donor status with enhanced logging
router.put('/donors/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate input parameters
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Donor ID is required'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    if (!['active', 'rejected', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "active", "rejected", or "inactive"'
      });
    }

    // Check if donor exists before updating
    const [donor] = await db.execute(
      'SELECT * FROM donors WHERE id = ?',
      [id]
    );

    if (donor.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Donor not found'
      });
    }

    // Log the status change attempt
    await db.execute(
      'INSERT INTO admin_logs (admin_id, action_type, action_path, request_details) VALUES (?, ?, ?, ?)',
      [
        req.user.id,
        'PUT',
        `/admin/donors/${id}/status`,
        JSON.stringify({
          donorId: id,
          oldStatus: donor[0].status,
          newStatus: status,
          adminId: req.user.id,
          timestamp: new Date().toISOString()
        })
      ]
    );

    const [result] = await db.execute(
      'UPDATE donors SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
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
    `, [id]);

    res.json({
      success: true,
      message: `Donor ${status === 'active' ? 'approved' : status === 'rejected' ? 'rejected' : 'deactivated'} successfully`,
      data: updatedDonor[0]
    });
  } catch (error) {
    console.error('Error updating donor status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donor status',
      error: error.message
    });
  }
});

// Get all receiver requests
router.get('/receiver-requests', authenticateToken, isAdmin, async (req, res) => {
  try {
    const [requests] = await db.execute(`
      SELECT r.*, u.full_name, u.email, u.phone_number,
      CASE 
        WHEN r.status = 'pending' THEN 'Pending Approval'
        WHEN r.status = 'approved' THEN 'Request Approved'
        WHEN r.status = 'rejected' THEN 'Request Rejected'
        ELSE 'Unknown Status'
      END as display_status
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
    `);

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching receiver requests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receiver requests',
      error: error.message
    });
  }
});

// Update receiver request status
router.put('/receiver-requests/:id/status', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Status must be either "approved" or "rejected"'
      });
    }

    const [result] = await db.execute(
      'UPDATE receivers SET status = ? WHERE id = ?',
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Get updated receiver data
    const [updatedRequest] = await db.execute(`
      SELECT r.*, u.full_name, u.email, u.phone_number,
      CASE 
        WHEN r.status = 'pending' THEN 'Pending Approval'
        WHEN r.status = 'approved' THEN 'Request Approved'
        WHEN r.status = 'rejected' THEN 'Request Rejected'
        ELSE 'Unknown Status'
      END as display_status
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `, [id]);

    res.json({
      success: true,
      message: `Request ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      data: updatedRequest[0]
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating request status',
      error: error.message
    });
  }
});

// Get matching donors for a blood request
router.get('/matching-donors/:requestId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get request details including location information and receiver name
    const [request] = await db.execute(
      `SELECT r.*, u.full_name as receiver_name 
       FROM receivers r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ?`,
      [requestId]
    );

    if (!request.length) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Find matching donors based on blood type and location
    const [donors] = await db.execute(
      `SELECT 
        d.id, 
        u.full_name, 
        u.phone_number, 
        d.blood_type, 
        d.district,
        d.state,
        d.country,
        d.last_donation_date,
        CASE 
          WHEN d.district = ? AND d.state = ? AND d.country = ? THEN 'Same District'
          WHEN d.state = ? AND d.country = ? THEN 'Same State'
          WHEN d.country = ? THEN 'Same Country'
        END as location_match
       FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE d.status = 'active'
       AND d.blood_type = ?
       AND (
         (d.district = ? AND d.state = ? AND d.country = ?) OR  -- Same district
         (d.state = ? AND d.country = ?) OR                     -- Same state
         (d.country = ?)                                        -- Same country
       )
       AND d.id NOT IN (
         SELECT COALESCE(selected_donor_id, 0)
         FROM receivers 
         WHERE selected_donor_id IS NOT NULL
         AND status NOT IN ('completed', 'rejected')
       )
       ORDER BY 
         CASE 
           WHEN d.district = ? THEN 1  -- Prioritize same district
           WHEN d.state = ? THEN 2     -- Then same state
           ELSE 3                      -- Then same country
         END,
         d.last_donation_date ASC      -- Prioritize donors who haven't donated recently
       `,
      [
        // For CASE statement
        request[0].district, request[0].state, request[0].country,
        request[0].state, request[0].country,
        request[0].country,
        // For WHERE clause
        request[0].blood_type,
        request[0].district, request[0].state, request[0].country,
        request[0].state, request[0].country,
        request[0].country,
        // For ORDER BY
        request[0].district,
        request[0].state
      ]
    );

    res.json({
      success: true,
      request: {
        id: request[0].id,
        receiver_name: request[0].receiver_name,
        blood_type: request[0].blood_type,
        location: {
          district: request[0].district,
          state: request[0].state,
          country: request[0].country
        }
      },
      donors: donors.map(donor => ({
        ...donor,
        match_level: donor.location_match,
        distance_info: `${donor.location_match} - ${donor.district}, ${donor.state}, ${donor.country}`
      }))
    });
  } catch (error) {
    console.error('Error finding matching donors:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding matching donors',
      error: error.message
    });
  }
});

// Assign donor to request
router.post('/assign-donor', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { requestId, donorId } = req.body;

    // Update receiver request with selected donor
    const [result] = await db.execute(
      'UPDATE receivers SET selected_donor_id = ?, status = "pending_donation" WHERE id = ?',
      [donorId, requestId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    // Update donor status to indicate pending donation
    await db.execute(
      'UPDATE donors SET current_request_id = ? WHERE id = ?',
      [requestId, donorId]
    );

    // Get donor and receiver details for notification
    const [donorDetails] = await db.execute(
      `SELECT u.full_name, u.phone_number
       FROM donors d
       JOIN users u ON d.user_id = u.id
       WHERE d.id = ?`,
      [donorId]
    );

    res.json({
      success: true,
      message: 'Donor assigned successfully',
      data: {
        donor: donorDetails[0]
      }
    });
  } catch (error) {
    console.error('Error assigning donor:', error);
    res.status(500).json({
      success: false,
      message: 'Error assigning donor',
      error: error.message
    });
  }
});

// Update donation status
router.post('/donation-complete', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { requestId, donorId } = req.body;

    // Update receiver request status
    await db.execute(
      'UPDATE receivers SET status = "completed" WHERE id = ?',
      [requestId]
    );

    // Update donor status and clear current request
    await db.execute(
      'UPDATE donors SET current_request_id = NULL WHERE id = ?',
      [donorId]
    );

    res.json({
      success: true,
      message: 'Donation marked as complete'
    });
  } catch (error) {
    console.error('Error updating donation status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating donation status',
      error: error.message
    });
  }
});

router.get('/requests', async (req, res) => {
  try {
    const sql = `
      SELECT r.*, u.full_name as requester_name, u.email as requester_email,
             u.phone_number as requester_phone
      FROM blood_requests r
      JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC`;
    
    const [requests] = await db.execute(sql);
    res.json(requests);
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.patch('/requests/:requestId/status', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    const sql = 'UPDATE blood_requests SET status = ? WHERE id = ?';
    const [result] = await db.execute(sql, [status, requestId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    res.json({ message: 'Request status updated successfully' });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({ error: 'Failed to update request status' });
  }
});

module.exports = router; 