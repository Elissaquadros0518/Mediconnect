import express from 'express';
import { getDoctors, getDoctorById, getDoctorSlots } from '../controllers/doctorController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, getDoctors);
router.get('/:id', authenticateToken, getDoctorById);
router.get('/:id/slots', authenticateToken, getDoctorSlots);

export default router;