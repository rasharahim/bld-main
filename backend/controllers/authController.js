const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

exports.register = async (req, res) => {
  try {
    const { full_name, phone_number, email, password } = req.body;

    // Validate input
    if (!full_name || !phone_number || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Validate phone number format (10 digits)
    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(phone_number)) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be 10 digits'
      });
    }

    // Check if email already exists
    const [existingUsers] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered'
      });
    }

    // Check if phone number already exists
    const [existingPhone] = await db.execute(
      'SELECT * FROM users WHERE phone_number = ?',
      [phone_number]
    );

    if (existingPhone.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert new user
    const [result] = await db.execute(
      'INSERT INTO users (full_name, phone_number, email, password, is_admin) VALUES (?, ?, ?, ?, ?)',
      [full_name, phone_number, email, hashedPassword, false]
    );

    // Get the created user with timestamps
    const [newUser] = await db.execute(
      'SELECT id, full_name, email, phone_number, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [result.insertId]
    );

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: result.insertId, 
        email, 
        is_admin: false 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: newUser[0]
    });

    } catch (error) {
      console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

exports.login = async (req, res) => {
  console.log('=== Starting login request ===');
  console.log('Request body:', req.body);
  
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      console.log('Missing email or password');
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find user by email
    console.log('Searching for user with email:', email);
    const [users] = await db.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    console.log('User query result:', users);

    if (users.length === 0) {
      console.log('User not found');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const user = users[0];
    console.log('Found user:', { id: user.id, email: user.email });

    // Verify password
    console.log('Verifying password');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      console.log('Password mismatch');
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    console.log('Generating JWT token');
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        is_admin: user.is_admin 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('Login successful');
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        is_admin: user.is_admin
      }
    });
  } catch (error) {
    console.error('=== Login error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    if (error.sql) {
      console.error('SQL Error:', {
        sql: error.sql,
        sqlMessage: error.sqlMessage,
        sqlState: error.sqlState
      });
    }
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  } finally {
    console.log('=== End of login request ===');
  }
};

exports.getProfile = async (req, res) => {
  try {
    const [users] = await db.execute(
      'SELECT id, full_name, email, phone_number, is_admin, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};

exports.makeAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Update user to admin
    const [result] = await db.execute(
      'UPDATE users SET is_admin = 1 WHERE email = ?',
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get updated user info
    const [users] = await db.execute(
      'SELECT id, full_name, email, is_admin FROM users WHERE email = ?',
      [email]
    );

    // Generate new token with admin privileges
    const token = jwt.sign(
      { 
        id: users[0].id, 
        email: users[0].email, 
        is_admin: true 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'User is now an admin',
      token,
      user: users[0]
    });

  } catch (error) {
    console.error('Make admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make user admin',
      error: error.message
    });
  }
};