// middleware/teacherAuth.js — autentikasi guru via kunci guru

/**
 * Middleware: memastikan request membawa kunci guru yang valid.
 * Header: X-Teacher-Key: <kunci>
 * atau Body / Query: teacherKey=<kunci>
 */
function teacherAuth(req, res, next) {
  const key =
    req.headers['x-teacher-key'] ||
    req.body?.teacherKey ||
    req.query?.teacherKey;

  if (!key) {
    return res.status(401).json({ error: 'Unauthorized: kunci guru diperlukan' });
  }

  // Validasi kunci disimpan di state — dilewatkan ke route handler melalui req
  req.teacherKey = key;
  next();
}

module.exports = teacherAuth;
