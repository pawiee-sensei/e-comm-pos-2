const db = require('../db');

exports.log = async ({ product_id, qty_change, previous_stock, new_stock, reason }) => {
  await db.query(
    `INSERT INTO products_stock_logs
      (product_id, qty_change, previous_stock, new_stock, reason, created_at)
     VALUES (?, ?, ?, ?, ?, NOW())`,
    [product_id, qty_change, previous_stock, new_stock, reason]
  );
};
