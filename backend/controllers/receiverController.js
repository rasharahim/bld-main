const Receiver = require('../models/receiver');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads/prescriptions');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  // Set directory permissions to 777 (full read/write/execute)
  fs.chmodSync(uploadsDir, '0777');
}

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Create a unique filename with timestamp and original extension
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `prescription_${timestamp}${ext}`);
  }
});

// Add file filter to only allow images and PDFs
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only images and PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

exports.upload = upload.single('prescription');

exports.createReceiver = async (req, res) => {
  try {
    console.log('Received request data:', req.body); // Debug log

    const receiverData = {
      user_id: req.user.id,
      full_name: req.body.fullName,
      age: req.body.age,
      blood_type: req.body.bloodType,
      contact_number: req.body.contactNumber,
      country: req.body.country,
      state: req.body.state,
      district: req.body.district,
      address: req.body.address,
      location_lat: req.body.lat,
      location_lng: req.body.lng,
      location_address: req.body.locationAddress,
      reason_for_request: req.body.reasonForRequest,
      prescription_path: req.file ? req.file.filename : null
    };

    
    // Validate required fields
    const requiredFields = ['full_name', 'age', 'blood_type', 'contact_number', 'country', 'state', 'district', 'address', 'reason_for_request'];
    const missingFields = requiredFields.filter(field => !receiverData[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields: missingFields
      });
    }

    // Convert age to number
    receiverData.age = Number(receiverData.age);

    // Validate blood type
    const validBloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (!validBloodTypes.includes(receiverData.blood_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid blood type'
      });
    }

    const receiverId = await Receiver.create(receiverData);
    const [request] = await db.execute(
      `SELECT * FROM receivers WHERE id = ?`,
      [receiverId]
    );

    res.status(201).json({
      success: true,
      message: 'Receiver request created successfully',
      data:{
        id: receiverId  // Ensure this matches what frontend expects
      }
    });
  } catch (error) {
    console.error('Error creating receiver:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating receiver request',
      error: error.message
    });
  }
};

exports.getAllReceivers = async (req, res) => {
  try {
    const receivers = await Receiver.getAll();
    res.status(200).json({
      success: true,
      data: receivers
    });
  } catch (error) {
    console.error('Error fetching receivers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receiver requests',
      error: error.message
    });
  }
};

exports.getReceiverById = async (req, res) => {
  try {
    const receiver = await Receiver.getById(req.params.id);
    if (!receiver) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }
    res.status(200).json({
      success: true,
      data: receiver
    });
  } catch (error) {
    console.error('Error fetching receiver:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching receiver request',
      error: error.message
    });
  }
};

exports.getUserReceivers = async (req, res) => {
  try {
    const receivers = await Receiver.getByUserId(req.user.id);
    res.status(200).json({
      success: true,
      data: receivers
    });
  } catch (error) {
    console.error('Error fetching user receivers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user receiver requests',
      error: error.message
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be pending, approved, or rejected'
      });
    }

    const updated = await Receiver.updateStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
      error: error.message
    });
  }
};

// Create a new blood request
exports.createRequest = async (req, res) => {
  try {
    const {
      full_name,
      age,
      blood_type,
      contact_number,
      reason_for_request,
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
      'full_name', 'age', 'blood_type', 'contact_number',
      'reason_for_request', 'country', 'state', 'district',
      'address'
    ];

    const missingFields = requiredFields.filter(field => !req.body[field]);
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        missingFields
      });
    }

    // Validate age
    if (isNaN(age) || age < 0 || age > 120) {
      return res.status(400).json({
        success: false,
        message: 'Invalid age'
      });
    }

    // Handle prescription file
    let prescription_path = null;
    if (req.file) {
      prescription_path = req.file.path;
    }

    // Insert into database
    const sql = `INSERT INTO receivers (
      user_id, full_name, age, blood_type, contact_number,
      reason_for_request, prescription_path, country,
      state, district, address, location_lat, location_lng,
      location_address, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`;

    const values = [
      req.user.id,
      full_name,
      parseInt(age),
      blood_type,
      contact_number,
      reason_for_request,
      prescription_path,
      country,
      state,
      district,
      address,
      location_lat ? parseFloat(location_lat) : null,
      location_lng ? parseFloat(location_lng) : null,
      location_address || null
    ];

    const [result] = await db.execute(sql, values);

    res.status(201).json({
      success: true,
      message: 'Blood request created successfully',
      data: {
        id: result.insertId,
        ...req.body,
        prescription_path
      }
    });
  } catch (error) {
    console.error('Error creating blood request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all requests for a user
exports.getUserRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    console.log('Fetching requests for user:', userId);

    // First, get all requests for the user
    const [requests] = await db.execute(
      `SELECT 
        r.*,
        u.full_name,
        u.phone_number,
        r.location_lat as latitude,
        r.location_lng as longitude
      FROM receivers r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ?
      ORDER BY r.created_at DESC`,
      [userId]
    );

    console.log('Found requests:', requests.length);

    // If there are requests with selected donors, get their information
    const requestsWithDonors = await Promise.all(requests.map(async (request) => {
      if (request.selected_donor_id) {
        const [donor] = await db.execute(
          `SELECT full_name, phone_number 
           FROM users 
           WHERE id = ?`,
          [request.selected_donor_id]
        );
        if (donor && donor.length > 0) {
          return {
            ...request,
            donor_name: donor[0].full_name,
            donor_contact: donor[0].phone_number
          };
        }
      }
      return request;
    }));

    res.json({
      success: true,
      requests: requestsWithDonors || []
    });
  } catch (error) {
    console.error('Error in getUserRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching requests',
      error: error.message
    });
  }
};

// Get all pending requests (for donors to view)
exports.getAllPendingRequests = async (req, res) => {
  try {
    const [requests] = await db.execute(
      `SELECT r.*, u.full_name, u.phone_number
       FROM receivers r
       JOIN users u ON r.user_id = u.id
       WHERE r.status = 'Pending'
       ORDER BY r.created_at DESC`
    );

    res.json({
      success: true,
      requests
    });

  } catch (error) {
    console.error('Error in getAllPendingRequests:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending requests',
      error: error.message
    });
  }
};

// Update request status
exports.updateRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status } = req.body;

    if (!['pending', 'approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const [result] = await db.execute(
      'UPDATE receivers SET status = ? WHERE id = ? AND user_id = ?',
      [status, requestId, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      message: 'Status updated successfully'
    });
  } catch (error) {
    console.error('Error updating request status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Delete a request
exports.deleteRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    // Check if request exists and belongs to user
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

    // Delete request
    await db.execute(
      'DELETE FROM receivers WHERE id = ?',
      [requestId]
    );

    res.json({
      success: true,
      message: 'Request deleted successfully'
    });

  } catch (error) {
    console.error('Error in deleteRequest:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting request',
      error: error.message
    });
  }
};

// Get request by ID
exports.getRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const [rows] = await db.execute(
      `SELECT r.*, u.email, u.phone_number
       FROM receivers r
       JOIN users u ON r.user_id = u.id
       WHERE r.id = ? AND r.user_id = ?`,
      [requestId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      data: rows[0]
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get request status
exports.getRequestStatus = async (req, res) => {
  try {
    const { requestId } = req.params;

    const [rows] = await db.execute(
      'SELECT status FROM receivers WHERE id = ? AND user_id = ?',
      [requestId, req.user.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    res.json({
      success: true,
      status: rows[0].status
    });
  } catch (error) {
    console.error('Error fetching request status:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};


// ✅ Select a donor for a specific receiver request
exports.selectDonor = async (req, res) => {
  try {
    const { requestId, donorId } = req.body;

    // 1️⃣ Update receiver request with selected donor
    const [result] = await db.execute(
      'UPDATE receivers SET selected_donor_id = ?, status = "matched" WHERE id = ?',
      [donorId, requestId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }

    // 2️⃣ Get full donor details (with availability_time)
    const [donor] = await db.execute(`
      SELECT 
        d.id,
        u.full_name AS name,
        u.phone_number AS contact,
        u.blood_type AS bloodType,
        d.district,
        d.state,
        d.availability_time,
        d.last_donation_date
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE d.id = ?
    `, [donorId]);

    // 3️⃣ Optional: Add notification for the donor
    try {
      await db.execute(
        'INSERT INTO notifications (user_id, message, type) VALUES (?, ?, "donor_selected")',
        [donorId, 'You have been selected as a donor for a blood request']
      );
    } catch (notifyErr) {
      console.warn('Notification insert failed:', notifyErr.message);
    }

    // 4️⃣ Return donor data so frontend can display details immediately
    res.json({
      success: true,
      message: 'Donor selected successfully',
      donor: donor[0] || null
    });

  } catch (error) {
    console.error('Error selecting donor:', error);
    res.status(500).json({
      success: false,
      message: 'Error selecting donor',
      error: error.message
    });
  }
};



// Get nearby donors
// Get matching donors for a receiver request (by location)
exports.getDonorsByLocation = async (req, res) => {
  try {
    const { requestId } = req.params;

    // Get receiver info
    const [receiver] = await db.execute(
      'SELECT blood_type, district, state FROM receivers WHERE id = ?',
      [requestId]
    );

    if (!receiver.length) {
      return res.status(404).json({
        success: false,
        message: 'Receiver request not found'
      });
    }

    // Fetch donors in same location and blood type
    const [donors] = await db.execute(`
      SELECT 
        d.id,
        u.full_name AS name,
        u.phone_number AS contact,
        u.blood_type AS bloodType,
        d.district,
        d.state,
        d.availability_time,
        d.last_donation_date
      FROM donors d
      JOIN users u ON d.user_id = u.id
      WHERE u.blood_type = ?
        AND d.district = ?
        AND d.state = ?
        AND d.status = 'active'
    `, [receiver[0].blood_type, receiver[0].district, receiver[0].state]);

    res.json({
      success: true,
      donors
    });
  } catch (error) {
    console.error('Error fetching donors by location:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matching donors',
      error: error.message
    });
  }
};
