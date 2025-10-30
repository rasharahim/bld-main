const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'auth_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: false,
  dateStrings: true,
  timezone: 'local',
  connectTimeout: 10000,
  debug: process.env.NODE_ENV === 'development'
});

// Wrapper function to handle database queries with better error handling
const execute = async (sql, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('=== Database Query Start ===');
    console.log('SQL:', sql);
    console.log('Parameters:', params);
    
    const result = await connection.execute(sql, params);
    console.log('Query successful, result length:', Array.isArray(result[0]) ? result[0].length : 1);
    return result;
  } catch (error) {
    console.error('=== Database Error ===');
    console.error('Error type:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.sql) {
      console.error('SQL statement:', error.sql);
      console.error('SQL message:', error.sqlMessage);
    }
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.release();
        console.log('Database connection released');
      } catch (releaseError) {
        console.error('Error releasing connection:', releaseError);
      }
    }
    console.log('=== Database Query End ===');
  }
};

// Test the connection and log database details
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('=== Database Connection Test ===');
    console.log('Connected to database:', process.env.DB_NAME);
    console.log('Host:', process.env.DB_HOST);
    console.log('User:', process.env.DB_USER);
    
    const [rows] = await connection.execute('SELECT 1');
    console.log('Test query successful');
    
    connection.release();
    return true;
  } catch (error) {
    console.error('=== Database Connection Error ===');
    console.error('Error type:', error.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.sqlMessage) {
      console.error('SQL message:', error.sqlMessage);
    }
    throw error;
  }
};

module.exports = {
  pool,
  execute,
  testConnection
};