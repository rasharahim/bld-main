const express = require("express");
const router = express.Router();
const donorStatusController = require("../controllers/DonorStatusController.js");
const { authenticateToken } = require('../middleware/auth');
const db = require('../config/db');

// Get donor profile
router.get('/profile', authenticateToken, async (req, res) => {
  console.log('=== Starting donor profile request ===');
  console.log('Request headers:', req.headers);
  console.log('Authenticated user:', req.user);
  
  try {
    // First check if user exists
    console.log('Executing user query for ID:', req.user.id);
    const [userRows] = await db.execute(
      'SELECT * FROM users WHERE id = ?',
      [req.user.id]
    );
    console.log('User query result length:', userRows.length);

    if (userRows.length === 0) {
      console.log('User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Then check if user is registered as a donor
    console.log('Executing donor query for user ID:', req.user.id);
    const [donorRows] = await db.execute(
      `SELECT d.*, 
              CASE 
                WHEN d.status = 'pending' THEN 'Pending Approval'
                WHEN d.status = 'active' THEN 'Active'
                WHEN d.status = 'inactive' THEN 'Inactive'
                WHEN d.status = 'rejected' THEN 'Registration Rejected'
                ELSE 'Unknown'
              END as display_status
       FROM donors d
       WHERE d.user_id = ?`,
      [req.user.id]
    );
    console.log('Donor query result length:', donorRows.length);

    if (donorRows.length === 0) {
      console.log('User is not registered as a donor');
      return res.status(200).json({
        success: true,
        isRegistered: false,
        message: 'User is not registered as a donor',
        user: {
          id: userRows[0].id,
          email: userRows[0].email,
          full_name: userRows[0].full_name
        }
      });
    }

    const donor = donorRows[0];
    console.log('Found donor details:', JSON.stringify(donor, null, 2));
    
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
        contactNumber: donor.contact_number,
        address: donor.address,
        district: donor.district,
        state: donor.state,
        country: donor.country,
        lastDonationDate: donor.last_donation_date,
        donationGapMonths: donor.donation_gap_months || 0,
        totalDonations: donor.total_donations || 0,
        dateOfBirth: donor.date_of_birth,
        weight: donor.weight,
        availabilityTime: donor.availability_time,
        healthCondition: donor.health_condition
      }
    });
  } catch (error) {
    console.error('=== Error in donor profile endpoint ===');
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    if (error.sql) {
      console.error('SQL Error:', {
        sql: error.sql,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
    }
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch donor profile',
      details: error.message
    });
  } finally {
    console.log('=== End of donor profile request ===');
  }
});

// Get all donors (for admin)
router.get("/donors", donorStatusController.getAllDonors);

// Get donors by status (new route)
//router.get("/donors/status", donorStatusController.getAllDonors);


// Update donor status (approve/reject)
router.put("/donors/:id", donorStatusController.updateDonorStatus);

// Get all pending donors (for admin)
router.get("/donors/pending", donorStatusController.getPendingDonors);


module.exports = router;
