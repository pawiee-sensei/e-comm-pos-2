const db = require('../db');

exports.findAll = async () => {
  const [rows] = await db.query(
    `SELECT id, name FROM categories ORDER BY name ASC`
  );
  return rows;
};
