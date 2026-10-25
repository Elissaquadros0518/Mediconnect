import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
const router = Router();
router.get('/', requireAuth, (_req, res) => res.json({ items: [] }));
export default router;
