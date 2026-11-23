const USERNAME = /^[A-Za-z0-9_.-]{3,30}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{10,30}$/;
const isText = (v) => typeof v === 'string' && v !== '';
const tooLongForBcrypt = (p) => Buffer.byteLength(p) > 72; // bcrypt ignores the rest

// Both return { error } or { value }. Non-strings (such as {"$ne": null}) are rejected first.
function parseRegister({ username, email, password } = {}) {
  if (![username, email, password].every(isText)) return { error: 'All fields are required.' };
  const value = { username: username.trim(), email: email.trim().toLowerCase(), password };
  if (!USERNAME.test(value.username)) {
    return { error: 'Username must be 3-30 characters: letters, numbers, dots, dashes or underscores.' };
  }
  if (value.email.length > 100 || !EMAIL.test(value.email)) {
    return { error: 'Please enter a valid email address.' };
  }
  if (!PASSWORD.test(password) || tooLongForBcrypt(password)) {
    return { error: 'Password must be 10-30 characters long and include at least one lower and upper case letter, one number, and one special character.' };
  }
  return { value };
}

function parseLogin({ username, password } = {}) {
  if (![username, password].every(isText) || username.length > 254 || tooLongForBcrypt(password)) {
    return { error: 'Username and password are required.' };
  }
  return { value: { username: username.trim(), password } };
}

module.exports = { parseRegister, parseLogin };
