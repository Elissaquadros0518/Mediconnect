import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { getCurrentUser } from '../controllers/authController.js';

const router = Router();
router.get('/me', requireAuth, getCurrentUser);
export default router;
