import { pool } from '../config/db.js';

export async function findUserByCognitoSub(subject) {
  const [rows] = await pool.execute(
    'SELECT id, email, full_name, role FROM users WHERE cognito_sub = ? LIMIT 1',
    [subject],
  );
  return rows[0] ?? null;
}
