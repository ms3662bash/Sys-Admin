function loadConfig(env = process.env) {
  const missing = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'JWT_SECRET'].filter((k) => !env[k]);
  if (missing.length) throw new Error(`Missing in .env: ${missing.join(', ')}`);
  if (env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
  return {
    port: Number(env.PORT || 3000),
    corsOrigins: (env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
    bcryptRounds: Number(env.BCRYPT_ROUNDS || 12),
    jwt: { secret: env.JWT_SECRET, expiresIn: env.JWT_EXPIRES_IN || '1h' },
    db: {
      host: env.DB_HOST,
      port: Number(env.DB_PORT || 3306),
      database: env.DB_NAME || 'sysadmin_db',
      user: env.DB_USER,
      password: env.DB_PASSWORD,
    },
  };
}

module.exports = { loadConfig };
