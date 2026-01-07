const db = require('../db');

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0];
};

exports.create = async (email, hashedPassword) => {
  const [result] = await db.query(
    'INSERT INTO users (email, password) VALUES (?, ?)',
    [email, hashedPassword]
  );
  return result.insertId;
};
