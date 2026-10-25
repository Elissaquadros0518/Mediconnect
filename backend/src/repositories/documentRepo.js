import { pool } from '../config/db.js';

export async function listDocumentsForOwner(ownerId) {
  const [rows] = await pool.execute(
    'SELECT id, file_name, content_type, created_at FROM documents WHERE owner_id = ? ORDER BY created_at DESC',
    [ownerId],
  );
  return rows;
}
