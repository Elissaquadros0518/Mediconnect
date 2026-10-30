import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

export const authenticateToken = async (req, res, next) => {
  // Check bypass for local mock testing if explicitly enabled
  if (process.env.LOCAL_AUTH_BYPASS === 'true' || (process.env.AWS_USE_LOCAL_AUTH === 'true' && process.env.NODE_ENV === 'development')) {
    const mockRole = req?.headers ? (req.headers['x-mock-role'] || 'PATIENT') : 'PATIENT';
    const mockUserId = req?.headers ? (req.headers['x-mock-user-id'] || 1) : 1;
    req.user = { id: mockUserId, role: mockRole.toLowerCase(), email: 'dev@mediconnect.local' };
    return next();
  }

  const authHeader = req?.headers ? (req.headers['authorization'] || req.headers['Authorization']) : null;
  const token = authHeader && typeof authHeader === 'string' && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Access token missing or malformed' });
  }

  try {
    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(403).json({ error: 'Invalid or expired authentication token' });
    }

    // Attach user profile role
    const role = (user.user_metadata?.role || 'patient').toLowerCase();
    req.user = {
      id: user.id,
      email: user.email,
      role,
      user_metadata: user.user_metadata
    };
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Authentication verification failed: ' + err.message });
  }
};

export const requireAuth = authenticateToken;

export const requireRole = (allowedRoles) => {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  const normalizedAllowed = rolesArray.map(r => r.toLowerCase());

  return (req, res, next) => {
    const userRole = (req.user?.role || '').toLowerCase();
    if (!req.user || !normalizedAllowed.includes(userRole)) {
      return res.status(403).json({ error: 'Access denied: insufficient role permissions' });
    }
    next();
  };
};

export default { authenticateToken, requireAuth, requireRole };