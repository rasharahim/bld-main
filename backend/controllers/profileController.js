const db = require('../config/db');
const multer = require('../config/multer'); // Import multer configuration
const BASE_URL = "http://localhost:5000"; // Change this to your actual backend URL
const fs = require('fs').promises;
const path = require('path');

const profileController = {
    // Get user profile
    getProfile: async (req, res) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    success: false,
                    message: 'User not authenticated'
                });
            }

            const userId = req.user.id;

            // Get user profile data
            const [userRows] = await db.execute(
                `SELECT 
                    id, full_name, email, phone_number, dob, blood_type,
                    profile_picture, is_available, location_lat, location_lng,
                    address, created_at
                FROM users 
                WHERE id = ?`,
                [userId]
            );

            if (userRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Profile not found'
                });
            }

            const user = userRows[0];
            
            // Calculate age from date of birth
            if (user.dob) {
                const dob = new Date(user.dob);
                const today = new Date();
                let age = today.getFullYear() - dob.getFullYear();
                const monthDiff = today.getMonth() - dob.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
                    age--;
                }
                user.age = age;
            }

            // Format profile picture URL if exists
            if (user.profile_picture) {
                user.profile_picture = `${BASE_URL}${user.profile_picture}`;
            }

            // Get donor information if exists
            const [donorRows] = await db.execute(
                `SELECT 
                    weight, has_donated_before, last_donation_date,
                    donation_gap_months, health_conditions,
                    availability_start, availability_end,
                    country, state, district, street
                FROM donors 
                WHERE user_id = ?`,
                [userId]
            );

            // Get user activities (both donations and requests)
            const [activities] = await db.execute(`
                (SELECT 
                    'Donation' as type,
                    d.id,
                    d.created_at as date,
                    d.status,
                    d.blood_type,
                    CONCAT(d.street, ', ', d.district, ', ', d.state) as location,
                    d.status = 'pending' as isPending
                FROM donors d
                WHERE d.user_id = ?)
                
                UNION ALL
                
                (SELECT 
                    'Request' as type,
                    r.id,
                    r.created_at as date,
                    r.status,
                    r.blood_type,
                    r.location_address as location,
                    r.status = 'pending' as isPending
                FROM receivers r
                WHERE r.user_id = ?)
                
                ORDER BY date DESC
            `, [userId, userId]);

            res.json({
                success: true,
                profile: {
                    ...user,
                    donor_info: donorRows[0] || null,
                    activities
                }
            });

        } catch (error) {
            console.error('Error in getProfile:', error);
            res.status(500).json({
                success: false,
                message: 'Error fetching profile',
                error: error.message
            });
        }
    },

    // Update user profile
    updateProfile: async (req, res) => {
        try {
            const userId = req.user.id;
            const {
                fullName,
                phoneNumber,
                dateOfBirth,
                bloodType,
                isAvailable,
                location_lat,
                location_lng,
                address,
                // Donor specific fields
                weight,
                hasDonatedBefore,
                lastDonationDate,
                donationGapMonths,
                healthConditions,
                availabilityStart,
                availabilityEnd,
                country,
                state,
                district,
                street
            } = req.body;

            // Update user table
            let userUpdateFields = [];
            let userQueryParams = [];

            if (fullName !== undefined) {
                userUpdateFields.push('full_name = ?');
                userQueryParams.push(fullName);
            }
            if (phoneNumber !== undefined) {
                userUpdateFields.push('phone_number = ?');
                userQueryParams.push(phoneNumber);
            }
            if (dateOfBirth !== undefined) {
                userUpdateFields.push('dob = ?');
                userQueryParams.push(dateOfBirth);
            }
            if (bloodType !== undefined) {
                userUpdateFields.push('blood_type = ?');
                userQueryParams.push(bloodType);
            }
            if (typeof isAvailable === 'boolean') {
                userUpdateFields.push('is_available = ?');
                userQueryParams.push(isAvailable);
            }
            if (location_lat !== undefined && location_lng !== undefined) {
                userUpdateFields.push('location_lat = ?');
                userUpdateFields.push('location_lng = ?');
                userQueryParams.push(parseFloat(location_lat));
                userQueryParams.push(parseFloat(location_lng));
            }
            if (address !== undefined) {
                userUpdateFields.push('address = ?');
                userQueryParams.push(address);
            }

            if (userUpdateFields.length > 0) {
                userQueryParams.push(userId);
                const userQuery = `
                    UPDATE users 
                    SET ${userUpdateFields.join(', ')}
                    WHERE id = ?
                `;
                await db.execute(userQuery, userQueryParams);
            }

            // Update or insert donor information
            if (weight || hasDonatedBefore || lastDonationDate || donationGapMonths || 
                healthConditions || availabilityStart || availabilityEnd || 
                country || state || district || street) {
                
                // Check if donor record exists
                const [existingDonor] = await db.execute(
                    'SELECT id FROM donors WHERE user_id = ?',
                    [userId]
                );

                if (existingDonor.length > 0) {
                    // Update existing donor
                    let donorUpdateFields = [];
                    let donorQueryParams = [];

                    if (weight !== undefined) {
                        donorUpdateFields.push('weight = ?');
                        donorQueryParams.push(weight);
                    }
                    if (hasDonatedBefore !== undefined) {
                        donorUpdateFields.push('has_donated_before = ?');
                        donorQueryParams.push(hasDonatedBefore);
                    }
                    if (lastDonationDate !== undefined) {
                        donorUpdateFields.push('last_donation_date = ?');
                        donorQueryParams.push(lastDonationDate);
                    }
                    if (donationGapMonths !== undefined) {
                        donorUpdateFields.push('donation_gap_months = ?');
                        donorQueryParams.push(donationGapMonths);
                    }
                    if (healthConditions !== undefined) {
                        donorUpdateFields.push('health_conditions = ?');
                        donorQueryParams.push(JSON.stringify(healthConditions));
                    }
                    if (availabilityStart !== undefined) {
                        donorUpdateFields.push('availability_start = ?');
                        donorQueryParams.push(availabilityStart);
                    }
                    if (availabilityEnd !== undefined) {
                        donorUpdateFields.push('availability_end = ?');
                        donorQueryParams.push(availabilityEnd);
                    }
                    if (country !== undefined) {
                        donorUpdateFields.push('country = ?');
                        donorQueryParams.push(country);
                    }
                    if (state !== undefined) {
                        donorUpdateFields.push('state = ?');
                        donorQueryParams.push(state);
                    }
                    if (district !== undefined) {
                        donorUpdateFields.push('district = ?');
                        donorQueryParams.push(district);
                    }
                    if (street !== undefined) {
                        donorUpdateFields.push('street = ?');
                        donorQueryParams.push(street);
                    }

                    if (donorUpdateFields.length > 0) {
                        donorQueryParams.push(userId);
                        const donorQuery = `
                            UPDATE donors 
                            SET ${donorUpdateFields.join(', ')}
                            WHERE user_id = ?
                        `;
                        await db.execute(donorQuery, donorQueryParams);
                    }
                } else {
                    // Insert new donor
                    const donorFields = [];
                    const donorValues = [];
                    const donorPlaceholders = [];
                    const donorData = {
                        user_id: userId,
                        weight,
                        has_donated_before: hasDonatedBefore,
                        last_donation_date: lastDonationDate,
                        donation_gap_months: donationGapMonths,
                        health_conditions: healthConditions ? JSON.stringify(healthConditions) : null,
                        availability_start: availabilityStart,
                        availability_end: availabilityEnd,
                        country,
                        state,
                        district,
                        street
                    };

                    for (const [key, value] of Object.entries(donorData)) {
                        if (value !== undefined) {
                            donorFields.push(key);
                            donorValues.push(value);
                            donorPlaceholders.push('?');
                        }
                    }

                    if (donorFields.length > 0) {
                        const donorQuery = `
                            INSERT INTO donors (${donorFields.join(', ')})
                            VALUES (${donorPlaceholders.join(', ')})
                        `;
                        await db.execute(donorQuery, donorValues);
                    }
                }
            }

            // Get updated profile data
            const [updatedProfile] = await db.execute(
                `SELECT * FROM users WHERE id = ?`,
                [userId]
            );

            const [updatedDonor] = await db.execute(
                `SELECT * FROM donors WHERE user_id = ?`,
                [userId]
            );

            res.json({
                success: true,
                profile: {
                    ...updatedProfile[0],
                    donor_info: updatedDonor[0] || null
                }
            });

        } catch (error) {
            console.error('Error updating profile:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile',
                error: error.message
            });
        }
    },

    // Toggle availability status
    toggleAvailability: async (req, res) => {
    try {
        const userId = req.user.id;

            // Get current availability status
            const [currentStatus] = await db.execute(
                'SELECT is_available FROM users WHERE id = ?',
                [userId]
            );

            if (currentStatus.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const newStatus = !currentStatus[0].is_available;

            // Update availability status
            const [result] = await db.execute(
                'UPDATE users SET is_available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [newStatus, userId]
            );

            res.json({
                success: true,
                message: `You are now ${newStatus ? 'available' : 'unavailable'} as a donor`,
                isAvailable: newStatus
            });

        } catch (error) {
            console.error('Error toggling availability:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to toggle availability status',
                error: error.message
            });
        }
    },

    // Update profile picture
    updateProfilePicture: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    message: 'No file uploaded'
                });
            }

            const userId = req.user.id;
            const profilePicturePath = '/uploads/profile-pictures/' + req.file.filename;

            // Get old profile picture path
            const [oldPicture] = await db.execute(
                'SELECT profile_picture FROM users WHERE id = ?',
                [userId]
            );

            // Update database with new picture path
            await db.execute(
                'UPDATE users SET profile_picture = ? WHERE id = ?',
                [profilePicturePath, userId]
            );

            // Delete old picture if it exists
            if (oldPicture[0]?.profile_picture) {
                const oldPath = path.join(__dirname, '..', oldPicture[0].profile_picture);
                try {
                    await fs.unlink(oldPath);
                } catch (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            }

            res.json({
                success: true,
                message: 'Profile picture updated successfully',
                profile_picture: `${BASE_URL}${profilePicturePath}`
            });

        } catch (error) {
            console.error('Error updating profile picture:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to update profile picture',
                error: error.message
            });
        }
    }
};

module.exports = profileController;