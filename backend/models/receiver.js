const db = require('../config/db');

class Receiver {
  static async create(receiverData) {
    const {
      user_id,
      full_name,
      age,
      blood_type,
      contact_number,
      country,
      state,
      district,
      address,
      location_lat,
      location_lng,
      location_address,
      reason_for_request,
      prescription_path
    } = receiverData;

    const sql = `
      INSERT INTO blood_requests (
        user_id, full_name, age, blood_type, contact_number,
        country, state, district, address, location_lat,
        location_lng, location_address, reason_for_request, prescription_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      user_id,
      full_name,
      age,
      blood_type,
      contact_number,
      country,
      state,
      district,
      address,
      location_lat,
      location_lng,
      location_address,
      reason_for_request,
      prescription_path
    ];

    try {
      const [result] = await db.execute(sql, values);
      return result.insertId;
    } catch (error) {
      throw error;
    }
  }

  static async getAll() {
    const sql = 'SELECT * FROM blood_requests ORDER BY created_at DESC';
    try {
      const [rows] = await db.execute(sql);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    const sql = `
      SELECT 
        r.*,
        u.full_name as user_full_name,
        u.phone_number as user_phone,
        d.id as donor_id,
        d.full_name as donor_name,
        d.contact_number as donor_contact,
        d.blood_type as donor_blood_type,
        d.location_lat as donor_latitude,
        d.location_lng as donor_longitude,
        d.location_address as donor_address,
        (
          6371 * acos(
            cos(radians(r.location_lat)) * cos(radians(d.location_lat)) *
            cos(radians(d.location_lng) - radians(r.location_lng)) +
            sin(radians(r.location_lat)) * sin(radians(d.location_lat))
          )
        ) AS distance_km
      FROM blood_requests r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN donors d ON r.selected_donor_id = d.id
      WHERE r.id = ?
    `;
    
    try {
      const [rows] = await db.execute(sql, [id]);
      if (rows.length === 0) return null;
      
      const request = rows[0];
      
      // Format the distance if it exists
      if (request.distance_km) {
        request.distance = `${parseFloat(request.distance_km).toFixed(2)} km`;
      }
      
      return request;
    } catch (error) {
      throw error;
    }
  }

  static async getByUserId(userId) {
    const sql = 'SELECT * FROM blood_requests WHERE user_id = ? ORDER BY created_at DESC';
    try {
      const [rows] = await db.execute(sql, [userId]);
      return rows;
    } catch (error) {
      throw error;
    }
  }

  static async updateStatus(id, status) {
    const sql = 'UPDATE blood_requests SET status = ? WHERE id = ?';
    try {
      const [result] = await db.execute(sql, [status, id]);
      return result.affectedRows > 0;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = Receiver;