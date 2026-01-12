const db = require('../db');

exports.findAll = async () => {
  const [rows] = await db.query(`SELECT * FROM categories ORDER BY name ASC`);
  return rows;
};
