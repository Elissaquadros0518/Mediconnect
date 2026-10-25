import pool from '../config/db.js';

export async function createAppointmentTransaction({ patientId, doctorId, slotId, reason }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Lock slot and check availability
    const [slots] = await connection.execute(
      `SELECT * FROM availability_slots WHERE id = ? FOR UPDATE`,
      [slotId]
    );

    if (slots.length === 0 || slots[0].status !== 'AVAILABLE') {
      throw new Error('Selected time slot is no longer available.');
    }

    const slot = slots[0];
    if (slot.doctor_id !== parseInt(doctorId)) {
      throw new Error('Slot does not belong to the selected doctor.');
    }

    // Mark slot as booked
    await connection.execute(
      `UPDATE availability_slots SET status = 'BOOKED' WHERE id = ?`,
      [slotId]
    );

    // Create appointment record
    const [result] = await connection.execute(
      `INSERT INTO appointments (patient_id, doctor_id, slot_id, reason, status) VALUES (?, ?, ?, ?, 'CONFIRMED')`,
      [patientId, doctorId, slotId, reason || null]
    );

    const appointmentId = result.insertId;

    // Create notification for patient
    await connection.execute(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [patientId, 'Appointment Confirmed', `Your appointment has been successfully booked.`, 'APPOINTMENT']
    );

    await connection.commit();
    return { appointmentId, status: 'CONFIRMED' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function findAppointmentsByUser(userId, role) {
  let query = `
    SELECT a.id, a.reason, a.status, a.cancellation_reason, a.created_at,
           s.start_time, s.end_time,
           d.id AS doctor_id, du.name AS doctor_name, d.specialty,
           p.id AS patient_id, pu.name AS patient_name, pu.email AS patient_email
    FROM appointments a
    JOIN availability_slots s ON a.slot_id = s.id
    JOIN doctors d ON a.doctor_id = d.id
    JOIN users du ON d.user_id = du.id
    JOIN users pu ON a.patient_id = pu.id
  `;

  if (role === 'PATIENT') {
    query += ` WHERE a.patient_id = ?`;
  } else if (role === 'DOCTOR') {
    query += ` JOIN doctors cur_d ON cur_d.user_id = ? WHERE a.doctor_id = cur_d.id`;
  } else {
    // Admin sees all
    query += ` WHERE 1=1`;
  }

  query += ` ORDER BY s.start_time DESC`;
  const [rows] = await pool.execute(query, [userId]);
  return rows;
}