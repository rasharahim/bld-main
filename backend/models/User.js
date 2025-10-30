const db = require('../config/db');
const bcrypt = require('bcryptjs');

class User {
  static async findByEmail(email) {
    return new Promise((resolve, reject) => {
      db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
        if (err) return reject(err);
        resolve(results[0]);
      });
    });
  }

  static async create({ fullName, phoneNumber, email, password, isAdmin = false }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    return new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO users (full_name, phone_number, email, password, is_admin) VALUES (?, ?, ?, ?, ?)',
        [fullName, phoneNumber, email, hashedPassword, isAdmin],
        (err, results) => {
          if (err) return reject(err);
          resolve(results.insertId);
        }
      );
    });
  }

  static async comparePasswords(candidatePassword, hashedPassword) {
    return await bcrypt.compare(candidatePassword, hashedPassword);
  }
}

module.exports = User;