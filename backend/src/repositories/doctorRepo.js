import pool from '../config/db.js';

export async function findAllDoctors({ specialty, search }) {
  let query = `
    SELECT d.id, d.specialty, d.qualification, d.experience_years, d.consultation_fee, d.bio,
           u.name, u.email, u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE u.status = 'ACTIVE'
  `;
  const params = [];

  if (specialty) {
    query += ` AND d.specialty = ?`;
    params.push(specialty);
  }
  if (search) {
    query += ` AND (u.name LIKE ? OR d.specialty LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ` ORDER BY u.name ASC`;
  const [rows] = await pool.execute(query, params);
  return rows;
}

export async function findDoctorById(id) {
  const [rows] = await pool.execute(`
    SELECT d.id, d.specialty, d.qualification, d.experience_years, d.consultation_fee, d.bio,
           u.id AS user_id, u.name, u.email, u.phone
    FROM doctors d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = ? AND u.status = 'ACTIVE'
  `, [id]);
  return rows[0];
}

export async function findDoctorSlots(doctorId) {
  const [rows] = await pool.execute(`
    SELECT id, doctor_id, start_time, end_time, status
    FROM availability_slots
    WHERE doctor_id = ? AND status = 'AVAILABLE' AND start_time > NOW()
    ORDER BY start_time ASC
  `, [doctorId]);
  return rows;
}