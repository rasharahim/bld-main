const db = require('../config/db');

async function columnExists(tableName, columnName) {
    const [columns] = await db.execute(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = ? 
        AND COLUMN_NAME = ?
    `, [tableName, columnName]);
    
    return columns.length > 0;
}

async function addLocationColumns() {
    try {
        console.log('Starting migration: Adding location columns to users table...');
        
        // Check and add location_lat
        if (!await columnExists('users', 'location_lat')) {
            console.log('Adding location_lat column...');
            await db.execute('ALTER TABLE users ADD COLUMN location_lat DECIMAL(10, 8) NULL');
        }

        // Check and add location_lng
        if (!await columnExists('users', 'location_lng')) {
            console.log('Adding location_lng column...');
            await db.execute('ALTER TABLE users ADD COLUMN location_lng DECIMAL(11, 8) NULL');
        }

        // Check and add address
        if (!await columnExists('users', 'address')) {
            console.log('Adding address column...');
            await db.execute('ALTER TABLE users ADD COLUMN address VARCHAR(255) NULL');
        }

        console.log('Migration completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

addLocationColumns(); 