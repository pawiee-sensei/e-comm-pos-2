const db = require('../db');

exports.findByEmail = async (email) => {
  const [rows] = await db.query(
    'SELECT * FROM admins WHERE email = ? LIMIT 1',
    [email]
  );
  return rows[0];
};
