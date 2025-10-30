USE auth_system;

CREATE TABLE IF NOT EXISTS receivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  blood_type VARCHAR(5) NOT NULL,
  country VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  contact_number VARCHAR(20) NOT NULL,
  reason_for_request TEXT NOT NULL,
  prescription VARCHAR(255),
  location_method ENUM('address', 'gps') NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  location_address TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
); 