import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import dotenv from 'dotenv';

dotenv.config();

const client = jwksClient({
  jwksUri: `https://cognito-idp.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${process.env.COGNITO_USER_POOL_ID || 'ap-south-1_dummy'}/.well-known/jwks.json`,
  rateLimit: true,
  jwksRequestsPerMinute: 5
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) return callback(err);
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

export const authenticateToken = async (req, res, next) => {
  if (process.env.AWS_USE_LOCAL_AUTH === 'true' && process.env.NODE_ENV === 'development') {
    const mockRole = req.headers['x-mock-role'] || 'PATIENT';
    const mockUserId = req.headers['x-mock-user-id'] || 1;
    req.user = { id: parseInt(mockUserId), role: mockRole, email: 'dev@mediconnect.local' };
    return next();
  }

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token missing or malformed' });

  jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired authentication token' });
    req.user = user;
    next();
  });
};

export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied: insufficient role permissions' });
    }
    next();
  };
};