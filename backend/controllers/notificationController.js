const db = require('../config/db'); 

exports.getNotifications = async (req, res) => {
    try {
        console.log("User object in notifications:", req.user); // Debug log

        if (!req.user || !req.user.id) {
            return res.status(400).json({ message: "User ID is missing" });
        }

        const [notifications] = await db.execute(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC',
            [req.user.id]
        );

        res.json(notifications);
    } catch (error) {
        console.error("Error fetching notifications:", error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
    console.log("User ID in request:", req.user?.id);

};


exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ message: "Notification ID is required" });
        }
        await db.execute('UPDATE notifications SET read_status = 1 WHERE id = ?', [id]);
        res.json({ message: 'Notification marked as read' });
    } catch (error) {
        console.error("Error updating notification status:", error);
        res.status(500).json({ message: 'Error updating notification status' });
    }
};

exports.createNotification = async (req, res) => {
    try {
        const { user_id, message, type } = req.body;
        if (!user_id || !message || !type) {
            return res.status(400).json({ message: "All fields (user_id, message, type) are required" });
        }
        await db.execute(
            'INSERT INTO notifications (user_id, message, type, read_status, created_at) VALUES (?, ?, ?, 0, NOW())',
            [user_id, message, type]
        );
        res.status(201).json({ message: 'Notification created' });
    } catch (error) {
        console.error("Error creating notification:", error);
        res.status(500).json({ message: 'Error creating notification' });
    }
};

console.log("Notification Controller Loaded");
