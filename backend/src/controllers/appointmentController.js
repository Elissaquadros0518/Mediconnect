import * as appointmentRepo from '../repositories/appointmentRepo.js';
import pool from '../config/db.js';

export async function bookAppointment(req, res, next) {
  try {
    const patientId = req.user.id;
    const { doctorId, slotId, reason } = req.body;

    if (!doctorId || !slotId) {
      return res.status(400).json({ success: false, error: 'Doctor ID and Slot ID are required' });
    }

    const result = await appointmentRepo.createAppointmentTransaction({
      patientId,
      doctorId,
      slotId,
      reason
    });

    res.status(201).json({ success: true, message: 'Appointment booked successfully', data: result });
  } catch (err) {
    if (err.message.includes('not available') || err.message.includes('belong')) {
      return res.status(409).json({ success: false, error: err.message });
    }
    next(err);
  }
}

export async function getMyAppointments(req, res, next) {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const appointments = await appointmentRepo.findAppointmentsByUser(userId, role);
    res.status(200).json({ success: true, count: appointments.length, data: appointments });
  } catch (err) {
    next(err);
  }
}

export async function cancelAppointment(req, res, next) {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;
    const userId = req.user.id;
    const role = req.user.role;

    const [appts] = await pool.execute(`SELECT * FROM appointments WHERE id = ?`, [id]);
    if (appts.length === 0) return res.status(404).json({ success: false, error: 'Appointment not found' });

    const appt = appts[0];
    if (role === 'PATIENT' && appt.patient_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized to cancel this appointment' });
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.execute(
        `UPDATE appointments SET status = 'CANCELLED', cancellation_reason = ? WHERE id = ?`,
        [cancellationReason || 'Cancelled by user', id]
      );

      // Release slot back to available
      await connection.execute(
        `UPDATE availability_slots SET status = 'AVAILABLE' WHERE id = ?`,
        [appt.slot_id]
      );

      await connection.commit();
      res.status(200).json({ success: true, message: 'Appointment cancelled successfully' });
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  } catch (err) {
    next(err);
  }
}