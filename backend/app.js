const express = require('express');
const path = require("path");
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const profileRoutes = require('./routes/profileRoutes'); // Added profile routes ✅
const receiverRoutes = require('./routes/receiverRoutes'); // Add receiver routes
const donorRoutes = require('./routes/donorRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// CORS Middleware (Allow frontend connections)
app.use(cors({
  origin: ["http://localhost:5000", "http://localhost:5173"],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware for parsing JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (Profile pictures, uploads, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

// Test database connection
db.getConnection()
  .then(connection => {
    console.log('Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// Routes
app.use('/api/auth', authRoutes); // Authentication routes
app.use('/api/notifications', notificationRoutes); // Notifications route
app.use('/api/profile', profileRoutes); // Profile-related routes ✅
app.use('/api/receivers', receiverRoutes); // Add receiver routes
app.use('/api/donors', donorRoutes);
app.use('/api/admin', adminRoutes);

// Global Error Handler (Better debugging)
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err);
  res.status(500).json({ 
    success: false,
    message: 'Internal Server Error',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
