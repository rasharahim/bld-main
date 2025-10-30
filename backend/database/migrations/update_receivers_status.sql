-- Drop the existing status ENUM and recreate it with new values
ALTER TABLE receivers MODIFY COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE receivers MODIFY COLUMN status ENUM('pending', 'approved', 'rejected', 'completed', 'cancelled') DEFAULT 'pending';

-- Add nearby_donors column if it doesn't exist
ALTER TABLE receivers ADD COLUMN IF NOT EXISTS nearby_donors JSON; 