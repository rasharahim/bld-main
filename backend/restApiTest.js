const express = require('express');
const request = require('supertest');
const app = express();
const fs = require('fs');
const path = require('path');

// Your backend server URL (or run locally)
const SERVER_URL = 'http://localhost:5000';

// Test user credentials
const TEST_USER = {
  email: 'ami@gmail.com',
  password: 'zxcvbnm',
};

let authToken = '';

// (1) Test Login (POST /auth/login)
async function testLogin() {
  console.log('\n=== Testing Login (POST /auth/login) ===');
  const response = await request(SERVER_URL)
    .post('/api/auth/login')
    .send(TEST_USER);

  if (response.status === 200) {
    authToken = response.body.token;
    console.log('✅ Login Success! Token:', authToken.slice(0, 15) + '...');
  } else {
    console.error('❌ Login Failed:', response.body.error);
  }
}

// (2) Test Get Profile (GET /profile)
async function testGetProfile() {
  console.log('\n=== Testing Get Profile (GET /profile) ===');
  const response = await request(SERVER_URL)
    .get('/api/profile')
    .set('Authorization', `Bearer ${authToken}`);

  if (response.status === 200) {
    console.log('✅ Profile Data:', {
      name: response.body.user.fullName,
      email: response.body.user.email,
    });
  } else {
    console.error('❌ Failed to fetch profile:', response.body.error);
  }
}

// (3) Test Update Profile (PUT /profile/update)
async function testUpdateProfile() {
  console.log('\n=== Testing Update Profile (PUT /profile/update) ===');

  // Create a fake image file for testing
  const testImagePath = path.join(__dirname, 'test-image.jpg');
  if (!fs.existsSync(testImagePath)) {
    fs.writeFileSync(testImagePath, 'Fake image content'); // Creates a dummy file
  }

  const response = await request(SERVER_URL)
    .put('/api/profile/update')
    .set('Authorization', `Bearer ${authToken}`)
    .attach('profilePicture', testImagePath) // File upload
    .field('fullName', 'New Name')
    .field('phoneNumber', '1234567890')
    .field('date_of_birth', '2000-01-01')
    .field('blood_type', 'A+');

  if (response.status === 200) {
    console.log('✅ Profile Updated:', response.body.message);
    console.log('New Picture URL:', response.body.profilePicture || 'None');
  } else {
    console.error('❌ Update Failed:', response.body.error);
  }
}

// Run all tests sequentially
(async () => {
  await testLogin();
  await testGetProfile();
  await testUpdateProfile();
  await testGetProfile(); // Check if update worked
})();