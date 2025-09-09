import { query } from '../config/database.js';

const EMPLOYEE_COLUMNS = [
  'first_name','last_name','phone_number','email','wallet_address','street_address','country','state','zip_code','city'
];

export const createEmployee = async (req, res) => {
  try {
    const payload = req.body || {};
    const values = EMPLOYEE_COLUMNS.map((c) => payload[c] ?? null);
    const placeholders = EMPLOYEE_COLUMNS.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO employee(${EMPLOYEE_COLUMNS.join(',')}) VALUES(${placeholders}) RETURNING id`;
    const result = await query(sql, values);
    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to create employee' });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};
    const setClauses = [];
    const values = [];
    let idx = 1;
    for (const col of EMPLOYEE_COLUMNS) {
      if (payload[col] !== undefined) {
        setClauses.push(`${col} = $${idx++}`);
        values.push(payload[col]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    const sql = `UPDATE employee SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING id`;
    const result = await query(sql, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found' });
    }
    return res.json({ success: true, id: result.rows[0].id });
  } catch (error) {
    return res.status(500).json({ success: false, error: 'Failed to update employee' });
  }
};


