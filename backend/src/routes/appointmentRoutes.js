import express from 'express';
import { bookAppointment, getMyAppointments, cancelAppointment } from '../controllers/appointmentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/', authenticateToken, bookAppointment);
router.get('/me', authenticateToken, getMyAppointments);
router.patch('/:id/cancel', authenticateToken, cancelAppointment);

export default router;