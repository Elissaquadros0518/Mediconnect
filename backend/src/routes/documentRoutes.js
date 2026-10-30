import express from 'express';
import { getUploadUrl, completeUpload, getMyDocuments, getDownloadUrl } from '../controllers/documentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticateToken, getMyDocuments);
router.post('/upload-url', authenticateToken, getUploadUrl);
router.post('/complete-upload', authenticateToken, completeUpload);
router.get('/:id/download-url', authenticateToken, getDownloadUrl);

export default router;