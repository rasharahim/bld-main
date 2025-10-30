require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5175','http://localhost:5174','http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.options('*', cors()); 

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));


// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import routes
const authRoutes = require('./routes/authRoutes');
const donorRoutes = require('./routes/donorRoutes');
const receiverRoutes = require('./routes/receiverRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Request logging middleware
app.use((req, res, next) => {
  console.log('\n=== New Request ===');
  console.log('Time:', new Date().toISOString());
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  console.log('Query:', req.query);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/donors', donorRoutes);
app.use('/api/receivers', receiverRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Response logging middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    console.log('\n=== Response Data ===');
    console.log('Status:', res.statusCode);
    console.log('Data:', data);
    return originalJson.call(this, data);
  };
  next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await db.execute('SELECT 1');
    res.json({ 
      status: 'Server is running',
      database: 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ 
      status: 'Server is running',
      database: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});





// Error handling middleware
app.use((err, req, res, next) => {
  console.error('\n=== Error Handler ===');
  console.error('Error:', err);
  console.error('Stack:', err.stack);
  
  // Handle specific types of errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized access'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error'
  });
});

// Start server
db.testConnection()
  .then(() => {
    console.log('Database connection pool initialized successfully');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database connection pool:', err);
    process.exit(1);
  });
