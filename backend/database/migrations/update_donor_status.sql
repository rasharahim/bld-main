-- Update donors table to modify status enum
ALTER TABLE donors 
MODIFY COLUMN status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending'; 