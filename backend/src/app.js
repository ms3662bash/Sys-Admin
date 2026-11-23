const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { rateLimit } = require('express-rate-limit');
const { parseRegister, parseLogin } = require('./validate');
const { signToken, requireAuth } = require('./tokens');

function createApp(users, config) {
  const app = express();
  const fail = (res, status, error) => res.status(status).json({ success: false, error });
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: config.authLimit || 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many attempts. Please try again later.' },
  });
  // Compared when the username is unknown, so response time does not reveal which names exist.
  const dummyHash = bcrypt.hashSync('unused', config.bcryptRounds);

  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins }));
  app.use(express.json({ limit: '10kb' }));

  app.get('/api/health', async (req, res) => {
    try {
      await users.ping();
      res.json({ success: true, database: 'up' });
    } catch (err) {
      console.error('Database check failed:', err.code || err.message);
      res.status(503).json({ success: false, database: 'down' });
    }
  });

  app.post('/api/auth/register', limiter, async (req, res) => {
    const { error, value } = parseRegister(req.body);
    if (error) return fail(res, 400, error);
    const hash = await bcrypt.hash(value.password, config.bcryptRounds);
    try {
      await users.create(value.username, value.email, hash);
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') return fail(res, 409, 'Username or email is already registered.');
      throw err;
    }
    res.status(201).json({ success: true, message: 'Registration successful! Redirecting to login...' });
  });

  app.post('/api/auth/login', limiter, async (req, res) => {
    const { error, value } = parseLogin(req.body);
    if (error) return fail(res, 400, error);
    const user = await users.findByUsername(value.username);
    const matches = await bcrypt.compare(value.password, user ? user.password_hash : dummyHash);
    if (!user || !matches) return fail(res, 401, 'Invalid credentials.');
    res.json({ success: true, message: 'Login successful!', token: signToken(user, config.jwt) });
  });

  app.get('/api/auth/me', requireAuth(users, config.jwt), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  app.use((req, res) => fail(res, 404, 'Not found.'));
  app.use((err, req, res, next) => {
    if (err.status >= 400 && err.status < 500) return fail(res, err.status, 'Invalid request body.');
    console.error('Request failed:', err.code || err.message);
    fail(res, 500, 'Server error. Please try again later.');
  });
  return app;
}

module.exports = { createApp };
