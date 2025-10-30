const db = require('../config/db');

const adminController = {
    getDonors: async (req, res) => {
        try {
            console.log('Admin check:', req.user);
            
            if (!req.user?.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: Admin access required'
                });
            }

            console.log('Starting donor fetch...');
            
            // Simplified query first
            const [donors] = await db.execute(`
                SELECT d.*, u.full_name, u.email, u.phone_number
                FROM donors d
                LEFT JOIN users u ON d.user_id = u.id
            `);

            console.log('Query executed, donor count:', donors.length);

            // Basic formatting
            const formattedDonors = donors.map(donor => ({
                id: donor.id,
                user_id: donor.user_id,
                full_name: donor.full_name || 'Unknown',
                email: donor.email || 'No email',
                phone_number: donor.phone_number || 'No phone',
                blood_type: donor.blood_type || 'Unknown',
                status: donor.status || 'pending',
                created_at: donor.created_at
            }));

            console.log('Data formatted successfully');

            res.json({
                success: true,
                data: formattedDonors
            });

        } catch (error) {
            console.error('Detailed error in getDonors:', {
                message: error.message,
                stack: error.stack,
                code: error.code,
                sqlMessage: error.sqlMessage,
                sqlState: error.sqlState
            });
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch donors',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? {
                    code: error.code,
                    sqlMessage: error.sqlMessage
                } : undefined
            });
        }
    },

    getReceiverRequests: async (req, res) => {
        try {
            if (!req.user?.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: Admin access required'
                });
            }

            const [requests] = await db.execute(`
                SELECT 
                    r.*,
                    u.full_name,
                    u.email,
                    u.phone_number as contact_number,
                    TIMESTAMPDIFF(YEAR, u.dob, CURDATE()) as age
                FROM receivers r
                LEFT JOIN users u ON r.user_id = u.id
                ORDER BY r.created_at DESC
            `);

            // Format the response data
            const formattedRequests = requests.map(request => ({
                id: request.id,
                user_id: request.user_id,
                full_name: request.full_name || 'Unknown',
                email: request.email || 'No email',
                contact_number: request.contact_number || 'No contact',
                age: request.age || 'N/A',
                blood_type: request.blood_type,
                reason_for_request: request.reason || '',
                units_needed: request.units_needed,
                needed_by_date: request.needed_by_date,
                hospital_name: request.hospital_name,
                hospital_address: request.hospital_address,
                prescription_path: request.prescription_path,
                status: request.status || 'pending',
                created_at: request.created_at,
                location_lat: request.location_lat,
                location_lng: request.location_lng,
                address: request.address || 'No location information available'
            }));

            res.json({
                success: true,
                data: formattedRequests
            });

        } catch (error) {
            console.error('Error fetching receiver requests:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to fetch receiver requests',
                error: error.message
            });
        }
    },

    updateDonorStatus: async (req, res) => {
        try {
            if (!req.user?.is_admin) {
                return res.status(403).json({
                    success: false,
                    message: 'Unauthorized: Admin access required'
                });
            }

            const { id } = req.params;
            const { status } = req.body;

            if (!['approved', 'rejected'].includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status value'
                });
            }

            const [result] = await db.execute(
                'UPDATE donors SET status = ? WHERE id = ?',
                [status, id]
            );

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Donor not found'
                });
            }

            res.json({
                success: true,
                message: `Donor ${status} successfully`
            });

        } catch (error) {
            console.error('Error updating donor status:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update donor status',
                error: error.message
            });
        }
    }
};

module.exports = adminController; 