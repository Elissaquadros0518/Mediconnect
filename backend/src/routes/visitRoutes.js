import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, (_req, res) => res.status(501).json({ error: { message: 'Visit records are not configured.' } }));
export default router;
