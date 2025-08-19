import { query } from '../config/database.js';

class Profile {
  static async upsertByUserId(userId, data) {
    const {
      email,
      role,
      first_name,
      last_name,
      phone_number,
      country_code,
      country,
      zip_code,
      state,
      city
    } = data;

    const sql = `
      INSERT INTO profile (
        user_id, email, role, first_name, last_name, phone_number,
        country_code, country, zip_code, state, city
      ) VALUES (
        $1, $2, $3, $4, $5, $6,
        $7, $8, $9, $10, $11
      )
      ON CONFLICT (user_id)
      DO UPDATE SET
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        phone_number = EXCLUDED.phone_number,
        country_code = EXCLUDED.country_code,
        country = EXCLUDED.country,
        zip_code = EXCLUDED.zip_code,
        state = EXCLUDED.state,
        city = EXCLUDED.city,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const result = await query(sql, [
      userId,
      email,
      role,
      first_name,
      last_name,
      phone_number,
      country_code,
      country,
      zip_code,
      state,
      city
    ]);
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const sql = 'SELECT * FROM profile WHERE user_id = $1';
    const result = await query(sql, [userId]);
    return result.rows[0];
  }
}

export default Profile;


