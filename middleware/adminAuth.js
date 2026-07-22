// middleware/adminAuth.js — autentikasi superadmin via Bearer token

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'sigrade-admin-secret';

/**
 * Middleware: memastikan request membawa token admin yang valid.
 * Header: Authorization: Bearer <token>
 */
function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized: token admin tidak valid' });
  }

  next();
}

module.exports = adminAuth;
