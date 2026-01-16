const db = require('../db');

exports.log = async ({ product_id, action, snapshot_name, details }) => {

  // normalize action to lowercase ENUM
  const normalized = String(action).toLowerCase();

  await db.query(
    `INSERT INTO products_activity_logs
      (product_id, action, snapshot_name, details)
     VALUES (?, ?, ?, ?)`,
    [product_id, normalized, snapshot_name || null, details || null]
  );
};
