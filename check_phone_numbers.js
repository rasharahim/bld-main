const db = require('./backend/config/db');

async function checkAndUpdatePhoneNumbers() {
    try {
        // Get all users with their phone numbers
        const [users] = await db.execute(`
            SELECT id, email, phone_number 
            FROM users
        `);

        console.log('Users found:', users.length);
        
        // For each user, check their receiver records
        for (const user of users) {
            console.log(`\nChecking user: ${user.email}`);
            console.log(`Phone number in users table: ${user.phone_number}`);

            // Get receiver records for this user
            const [receivers] = await db.execute(`
                SELECT id, contact_number 
                FROM receivers 
                WHERE user_id = ?
            `, [user.id]);

            if (receivers.length > 0) {
                console.log(`Found ${receivers.length} receiver records`);
                
                // Check if phone numbers match
                for (const receiver of receivers) {
                    console.log(`Contact number in receivers table: ${receiver.contact_number}`);
                    
                    if (receiver.contact_number !== user.phone_number) {
                        console.log('Phone numbers do not match!');
                        console.log('Would you like to update the receiver record to match the user phone number? (y/n)');
                        // Note: In a real implementation, you would handle the user input here
                        // For now, we'll just log the suggested update
                        console.log(`Suggested update: UPDATE receivers SET contact_number = '${user.phone_number}' WHERE id = ${receiver.id}`);
                    } else {
                        console.log('Phone numbers match!');
                    }
                }
            } else {
                console.log('No receiver records found for this user');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        process.exit();
    }
}

checkAndUpdatePhoneNumbers(); 