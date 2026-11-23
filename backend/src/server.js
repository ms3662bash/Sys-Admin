require('dotenv').config({ quiet: true });
const { loadConfig } = require('./config');
const { createPool, createUserStore } = require('./db');
const { createApp } = require('./app');

let config;
try {
  config = loadConfig();
} catch (err) {
  console.error(err.message);
  process.exit(1);
}
const pool = createPool(config.db);
const server = createApp(createUserStore(pool), config).listen(config.port, () =>
  console.log(`API on port ${config.port}, database ${config.db.host}:${config.db.port}/${config.db.database}`));

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => pool.end().finally(() => process.exit(0))));
}
