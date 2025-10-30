CREATE DATABASE IF NOT EXISTS blood_donation_db;
USE blood_donation_db;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  dob DATE,
  blood_type VARCHAR(5),
  profile_picture VARCHAR(255),
  is_available BOOLEAN DEFAULT false,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  blood_type VARCHAR(3) NOT NULL,
  weight DECIMAL(5,2) NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  availability_time VARCHAR(100) NOT NULL,
  health_condition TEXT,
  last_donation_date DATE,
  donation_gap_months INT DEFAULT 0,
  country VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  status ENUM('active', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS receivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  blood_type VARCHAR(3) NOT NULL,
  contact_number VARCHAR(15) NOT NULL,
  reason_for_request TEXT NOT NULL,
  prescription_path VARCHAR(255),
  country VARCHAR(50) NOT NULL,
  state VARCHAR(50) NOT NULL,
  district VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  location_address TEXT,
  status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 