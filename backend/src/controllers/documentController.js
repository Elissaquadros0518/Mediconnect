import pool from '../config/db.js';
import { generateUploadPresignedUrl, generateDownloadPresignedUrl } from '../services/s3Service.js';
import crypto from 'crypto';

export async function getUploadUrl(req, res, next) {
  try {
    const { originalFilename, mimeType, documentType, patientId } = req.body;
    const uploaderId = req.user.id;
    const targetPatientId = req.user.role === 'PATIENT' ? uploaderId : (patientId || uploaderId);

    if (!originalFilename || !mimeType || !documentType) {
      return res.status(400).json({ success: false, error: 'Missing required document metadata' });
    }

    const fileHash = crypto.randomBytes(16).toString('hex');
    const ext = originalFilename.split('.').pop();
    const s3ObjectKey = `patients/${targetPatientId}/docs/${fileHash}.${ext}`;

    const uploadUrl = await generateUploadPresignedUrl(s3ObjectKey, mimeType);

    res.status(200).json({
      success: true,
      data: {
        uploadUrl,
        s3ObjectKey,
        targetPatientId
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function completeUpload(req, res, next) {
  try {
    const { patientId, documentType, originalFilename, s3ObjectKey, mimeType, fileSize, appointmentId } = req.body;
    const uploaderId = req.user.id;
    const targetPatientId = req.user.role === 'PATIENT' ? uploaderId : (patientId || uploaderId);

    const [result] = await pool.execute(
      `INSERT INTO medical_documents (patient_id, uploaded_by, appointment_id, document_type, original_filename, s3_object_key, mime_type, file_size)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [targetPatientId, uploaderId, appointmentId || null, documentType, originalFilename, s3ObjectKey, mimeType, fileSize]
    );

    res.status(201).json({
      success: true,
      message: 'Document registered successfully',
      data: { documentId: result.insertId }
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyDocuments(req, res, next) {
  try {
    const userId = req.user.id;
    let query = `
      SELECT id, patient_id, uploaded_by, appointment_id, document_type, original_filename, mime_type, file_size, created_at
      FROM medical_documents
    `;
    const params = [];

    if (req.user.role === 'PATIENT') {
      query += ` WHERE patient_id = ?`;
      params.push(userId);
    } else if (req.user.role === 'DOCTOR') {
      // Doctor can see documents of patients they have authorized appointments with
      query += ` WHERE patient_id IN (
        SELECT patient_id FROM appointments a
        JOIN doctors d ON a.doctor_id = d.id
        WHERE d.user_id = ?
      )`;
      params.push(userId);
    }

    query += ` ORDER BY created_at DESC`;
    const [rows] = await pool.execute(query, params);
    res.status(200).json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function getDownloadUrl(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const [docs] = await pool.execute(`SELECT * FROM medical_documents WHERE id = ?`, [id]);
    if (docs.length === 0) return res.status(404).json({ success: false, error: 'Document not found' });
    const doc = docs[0];

    if (role === 'PATIENT' && doc.patient_id !== userId) {
      return res.status(403).json({ success: false, error: 'Unauthorized access to document' });
    }

    const downloadUrl = await generateDownloadPresignedUrl(doc.s3_object_key);
    res.status(200).json({ success: true, data: { downloadUrl } });
  } catch (err) {
    next(err);
  }
}