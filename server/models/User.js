import { query } from '../config/database.js';
import bcrypt from 'bcryptjs';

class User {
  // Create a new user
  static async create(userData) {
    const { email, password, first_name, last_name, role = 'user' } = userData;
    
    // Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    const sql = `
      INSERT INTO users (email, password_hash, first_name, last_name, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, first_name, last_name, role, created_at
    `;
    
    const result = await query(sql, [email, password_hash, first_name, last_name, role]);
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = $1';
    const result = await query(sql, [email]);
    return result.rows[0];
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT id, email, first_name, last_name, role, created_at FROM users WHERE id = $1';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Verify password
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Update user
  static async update(id, updateData) {
    const { first_name, last_name, email } = updateData;
    const sql = `
      UPDATE users 
      SET first_name = $1, last_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING id, email, first_name, last_name, role, created_at, updated_at
    `;
    
    const result = await query(sql, [first_name, last_name, email, id]);
    return result.rows[0];
  }

  // Delete user
  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = $1 RETURNING id';
    const result = await query(sql, [id]);
    return result.rows[0];
  }

  // Get all users (for admin purposes)
  static async findAll(limit = 10, offset = 0) {
    const sql = `
      SELECT id, email, first_name, last_name, role, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await query(sql, [limit, offset]);
    return result.rows;
  }
}

export default User; 