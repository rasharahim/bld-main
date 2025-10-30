const bcrypt = require('bcryptjs');
const db = require('../config/db');

async function createAdmin() {
  try {
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    const adminPhone = '9895823557';
    
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(adminPassword, salt);

    // Insert admin user
    const [result] = await db.execute(
      'INSERT INTO users (full_name, email, password, phone_number, is_admin) VALUES (?, ?, ?, ?, ?)',
      ['Admin User', adminEmail, hashedPassword, adminPhone, true]
    );

    console.log('Admin user created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin(); 