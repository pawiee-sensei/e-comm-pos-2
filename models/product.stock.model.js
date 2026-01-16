const db = require('../db');

exports.log = async ({ product_id, action, qty, prev_stock, new_stock, reason }) => {
  await db.query(
    `INSERT INTO products_stock_logs
      (product_id, action, qty, prev_stock, new_stock, reason, created_at)
     VALUES (?, ?, ?, ?, ?, ?, NOW())`,
    [product_id, action, qty, prev_stock, new_stock, reason || null]
  );
};
