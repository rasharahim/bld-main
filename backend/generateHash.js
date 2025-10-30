const bcrypt = require('bcryptjs');

// Configuration
const plainPassword = 'admin123'; // CHANGE THIS to your desired admin password
const saltRounds = 16; // Security level (higher = more secure but slower)

// Generate hash
bcrypt.hash(plainPassword, saltRounds, (err, hash) => {
  if (err) throw err;
  
  console.log('Hashed Password:', hash);
  console.log('New Hashed Password:', hash);
  console.log('\nSQL command:');
  console.log(`UPDATE users SET password = '${hash}' WHERE email = 'admin@example.com';`);
  
  // Outputs ready-to-use SQL command
  console.log('\nSQL command to update your database:');
  console.log(`UPDATE users SET password = '${hash}', role = 'admin' WHERE email = 'admin@example.com';`);
  console.log(`-- OR --`);
  console.log(`INSERT INTO users (email, password, role, fullName) VALUES ('admin@example.com', '${hash}', 'admin', 'Admin User');`);
});