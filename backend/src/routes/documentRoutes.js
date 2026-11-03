import express from 'express';
import { getUploadUrl, completeUpload, getMyDocuments, getDownloadUrl } from '../controllers/documentController.js';
import {
  completeAzureUpload,
  createAzureDownloadUrl,
  createAzureUploadUrl,
  deleteAzureDocument
} from '../controllers/azureDocumentController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/me', authenticateToken, getMyDocuments);
router.post('/upload-url', authenticateToken, getUploadUrl);
router.post('/complete-upload', authenticateToken, completeUpload);
router.get('/:id/download-url', authenticateToken, getDownloadUrl);

router.post('/azure/upload-url', authenticateToken, createAzureUploadUrl);
router.post('/azure/complete-upload', authenticateToken, completeAzureUpload);
router.get('/azure/:documentId/download-url', authenticateToken, createAzureDownloadUrl);
router.delete('/azure/:documentId', authenticateToken, deleteAzureDocument);

export default router;
