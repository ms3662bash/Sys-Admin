// Uses a throwaway local MySQL, never the shared sysadmin_db.
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { createDB } = require('mysql-memory-server');
const { createPool, createUserStore } = require('../src/db');
const { createApp } = require('../src/app');

const secret = 's'.repeat(48);
const config = { corsOrigins: ['http://fe.test'], bcryptRounds: 4, authLimit: 1000, jwt: { secret, expiresIn: '1h' } };
const alice = { username: 'alice', email: 'Alice@Example.com', password: 'Str0ng!Passw' };
let db, pool, app, token;
const post = (route, body) => request(app).post(`/api/auth/${route}`).send(body);
const me = (t) => request(app).get('/api/auth/me').set('Authorization', `Bearer ${t}`);

before(async () => {
  db = await createDB({ version: '8.4.x', dbName: 'sysadmin_db' });
  pool = createPool({ host: '127.0.0.1', port: db.port, user: db.username, password: '', database: db.dbName });
  await pool.query(fs.readFileSync(path.join(__dirname, '../sql/users.sql'), 'utf8'));
  app = createApp(createUserStore(pool), config);
}, { timeout: 240000 });
after(async () => { await pool?.end(); await db?.stop(); });

test('register stores a bcrypt hash', async () => {
  assert.equal((await post('register', alice)).status, 201);
  const [[row]] = await pool.query('SELECT * FROM users');
  assert.match(row.password_hash, /^\$2b\$04\$.{53}$/);
  assert.equal(row.email, 'alice@example.com');
});
test('duplicates give 409', async () => {
  assert.equal((await post('register', { ...alice, email: 'x@example.com' })).status, 409);
  assert.equal((await post('register', { ...alice, username: 'bob' })).status, 409);
});
test('bad registration input gives 400', async () => {
  for (const change of [{ username: '' }, { username: { $ne: null } }, { username: "x' OR 1=1" }, { email: 'nope' }, { email: 'a'.repeat(95) + '@x.com' },
    { password: 'Sh0rt!' }, { password: 'nouppercase1!' }, { password: ['a'] }]) {
    assert.equal((await post('register', { ...alice, ...change })).status, 400, JSON.stringify(change));
  }
  assert.equal((await request(app).post('/api/auth/register')).status, 400);
});
test('login returns a JWT that /me accepts', async () => {
  const res = await post('login', { username: 'alice', password: alice.password });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  token = res.body.token;
  const { body } = await me(token);
  assert.deepEqual(Object.keys(body.user).sort(), ['email', 'id', 'username']);
});
test('wrong password and unknown user get the same 401', async () => {
  const a = await post('login', { username: 'alice', password: 'Wr0ng!Passwd' });
  const b = await post('login', { username: 'nobody', password: 'Wr0ng!Passwd' });
  assert.equal(a.status, 401);
  assert.equal(b.status, 401);
  assert.deepEqual(a.body, b.body);
});
test('injection attempts fail', async () => {
  for (const u of ["alice' -- ", "' OR '1'='1", "a'; DROP TABLE users; --"]) {
    assert.equal((await post('login', { username: u, password: 'x' })).status, 401);
  }
  for (const v of [{ $ne: null }, ['alice'], 1, true, null]) {
    assert.equal((await post('login', { username: v, password: alice.password })).status, 400);
    assert.equal((await post('login', { username: 'alice', password: v })).status, 400);
  }
});
test('missing, forged, expired, unsigned and foreign tokens are rejected', async () => {
  const opts = { subject: '1', issuer: 'sysadmin-notes' };
  const bad = ['junk', jwt.sign({}, 'w'.repeat(48), opts), jwt.sign({}, secret, { ...opts, expiresIn: -10 }),
    jwt.sign({}, '', { ...opts, algorithm: 'none' }), jwt.sign({}, secret, { ...opts, issuer: 'other' }),
    jwt.sign({}, secret, { ...opts, subject: '9999' })];
  for (const t of bad) assert.equal((await me(t)).status, 401);
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
});
test('malformed JSON gives 400, unknown route 404', async () => {
  assert.equal((await request(app).post('/api/auth/login').type('json').send('{')).status, 400);
  assert.equal((await request(app).get('/nope')).status, 404);
});
test('CORS allows only configured origins', async () => {
  const origin = async (o) => (await request(app).get('/api/health').set('Origin', o)).headers['access-control-allow-origin'];
  assert.equal(await origin('http://fe.test'), 'http://fe.test');
  assert.equal(await origin('http://evil.test'), undefined);
});
test('rate limit returns 429', async () => {
  const limited = createApp(createUserStore(pool), { ...config, authLimit: 2 });
  const hit = async () => (await request(limited).post('/api/auth/login').send({})).status;
  assert.deepEqual([await hit(), await hit(), await hit()], [400, 400, 429]);
});
test('token stops working once the user is deleted', async () => {
  await pool.query('DELETE FROM users');
  assert.equal((await me(token)).status, 401);
});
