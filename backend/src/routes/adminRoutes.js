import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
const router = Router();
router.use(requireAuth, requireRole('admin'));
router.get('/summary', (_req, res) => res.status(501).json({ error: { message: 'Admin reporting is not configured.' } }));
export default router;
