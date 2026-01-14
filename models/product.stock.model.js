const db = require('../db');

exports.adjustStock = async ({ product_id, qty_change, reason }) => {
  const [[p]] = await db.query(`SELECT stock FROM products WHERE id=?`, [product_id]);
  const prev = p.stock;
  const next = prev + qty_change;

  await db.query(`UPDATE products SET stock=? WHERE id=?`, [next, product_id]);

  await db.query(
    `INSERT INTO products_stock_logs (product_id, qty_change, previous_stock, new_stock, reason)
     VALUES (?,?,?,?,?)`,
    [product_id, qty_change, prev, next, reason]
  );

  return next;
};
