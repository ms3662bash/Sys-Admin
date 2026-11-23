const mysql = require('mysql2/promise');

const createPool = (db) => mysql.createPool({ ...db, connectionLimit: 10, connectTimeout: 5000 });

// The only SQL in the app. execute() sends prepared statements, so user input
// is always bound as data and never becomes part of the query text.
function createUserStore(pool) {
  return {
    async findByUsername(username) {
      const [rows] = await pool.execute(
        'SELECT id, username, email, password_hash FROM users WHERE username = ?', [username]);
      return rows[0];
    },
    async findById(id) {
      const [rows] = await pool.execute('SELECT id, username, email FROM users WHERE id = ?', [id]);
      return rows[0];
    },
    async create(username, email, passwordHash) {
      const [result] = await pool.execute(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
        [username, email, passwordHash]);
      return result.insertId;
    },
    ping: () => pool.query('SELECT 1'),
  };
}

module.exports = { createPool, createUserStore };
