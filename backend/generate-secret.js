// generate-secret.js
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=', secretKey);