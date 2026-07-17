const crypto = require('crypto');

const SECRET = process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 zile

// ---- Parole (scrypt cu salt) ----
function hashPassword(plain) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(plain, stored) {
  if (!stored || typeof stored !== 'string' || !stored.includes(':')) return false;
  const [salt, hash] = stored.split(':');
  const test = crypto.scryptSync(String(plain), salt, 64).toString('hex');
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(test, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// ---- Token semnat (HMAC) ----
function signToken(payload) {
  const data = { ...payload, exp: Date.now() + TOKEN_TTL_MS };
  const body = Buffer.from(JSON.stringify(data)).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  let payload;
  try { payload = JSON.parse(Buffer.from(body, 'base64url').toString()); }
  catch { return null; }
  if (payload.exp && Date.now() > payload.exp) return null;
  return payload;
}

// ---- Middleware ----
function getToken(req) {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : null;
}

function requireAuth(req, res, next) {
  const payload = verifyToken(getToken(req));
  if (!payload) return res.status(401).json({ error: 'Neautentificat' });
  req.user = payload;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acces interzis' });
  }
  next();
}

module.exports = {
  hashPassword, verifyPassword,
  signToken, verifyToken,
  requireAuth, requireAdmin,
};
