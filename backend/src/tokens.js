const jwt = require('jsonwebtoken');

const ISSUER = 'sysadmin-notes';

function signToken(user, { secret, expiresIn }) {
  return jwt.sign({}, secret, { algorithm: 'HS256', issuer: ISSUER, subject: String(user.id), expiresIn });
}

// Express middleware: requires "Authorization: Bearer <token>" and loads the
// user from the database, so tokens of deleted accounts stop working.
function requireAuth(users, { secret }) {
  return async (req, res, next) => {
    const token = /^Bearer (\S+)$/i.exec(req.get('authorization') || '')?.[1];
    let claims;
    try {
      claims = jwt.verify(token, secret, { algorithms: ['HS256'], issuer: ISSUER });
    } catch {
      return res.status(401).json({ success: false, error: 'Missing, invalid or expired token.' });
    }
    req.user = await users.findById(Number(claims.sub));
    if (!req.user) return res.status(401).json({ success: false, error: 'Missing, invalid or expired token.' });
    next();
  };
}

module.exports = { signToken, requireAuth };
