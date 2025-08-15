import { query } from '../config/database.js';

/**
 * JobModel provides data-access helpers for jobs table
 */
export const JobModel = {
  async getAllJobs() {
    const sql = `
      SELECT
        id,
        title,
        location_type,
        location,
        company_name,
        notification_email,
        reference_code,
        job_type,
        salary,
        currency,
        pay_frequency,
        additional_compensation,
        employee_benefits,
        description,
        selected_oracles,
        verification_notes,
        responsibilities,
        skills,
        associated_skills,
        company_description,
        employer_id,
        status,
        created_at,
        updated_at
      FROM jobs
      ORDER BY created_at DESC
    `;
    const result = await query(sql);
    return result.rows;
  },

  async getJobById(jobId) {
    const sql = `
      SELECT
        id,
        title,
        location_type,
        location,
        company_name,
        notification_email,
        reference_code,
        job_type,
        salary,
        currency,
        pay_frequency,
        additional_compensation,
        employee_benefits,
        description,
        selected_oracles,
        verification_notes,
        responsibilities,
        skills,
        associated_skills,
        company_description,
        employer_id,
        status,
        created_at,
        updated_at
      FROM jobs
      WHERE id = $1
    `;
    const result = await query(sql, [jobId]);
    return result.rows[0] || null;
  },

  async createJob(employerId, payload) {
    const sql = `
      INSERT INTO jobs (
        title,
        location_type,
        location,
        company_name,
        notification_email,
        reference_code,
        job_type,
        salary,
        currency,
        pay_frequency,
        additional_compensation,
        employee_benefits,
        description,
        selected_oracles,
        verification_notes,
        responsibilities,
        skills,
        associated_skills,
        company_description,
        employer_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING id, title, company_name, employer_id, created_at
    `;

    const values = [
      payload.title,
      payload.location_type,
      payload.location,
      payload.company_name,
      payload.notification_email,
      payload.reference_code,
      payload.job_type,
      payload.salary,
      payload.currency,
      payload.pay_frequency,
      payload.additional_compensation,
      payload.employee_benefits,
      payload.description,
      payload.selected_oracles,
      payload.verification_notes,
      payload.responsibilities,
      payload.skills,
      payload.associated_skills,
      payload.company_description,
      employerId,
    ];

    const result = await query(sql, values);
    return result.rows[0];
  },

  async updateJob(jobId, updateData) {
    const fields = Object.keys(updateData);
    if (fields.length === 0) {
      return null;
    }

    const setClause = fields
      .map((field, index) => `${field} = $${index + 2}`)
      .join(', ');

    const sql = `
      UPDATE jobs
      SET ${setClause}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, title, company_name, employer_id, updated_at
    `;

    const values = [jobId, ...Object.values(updateData)];
    const result = await query(sql, values);
    return result.rows[0] || null;
  },

  async deleteJob(jobId) {
    const sql = 'DELETE FROM jobs WHERE id = $1 RETURNING id, title';
    const result = await query(sql, [jobId]);
    return result.rows[0] || null;
  },
};

export default JobModel;
