const db = require('../db');

exports.index = async (req, res) => {
  const [products] = await db.query(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.stock > 0
    ORDER BY p.name ASC
  `);

  // DAILY SUMMARY (POS ONLY)
  const [[summary]] = await db.query(`
    SELECT
      COUNT(*) AS transactions,
      SUM(total) AS total_sales,
      SUM(CASE WHEN payment_mode = 'cash' THEN total ELSE 0 END) AS cash_total,
      SUM(CASE WHEN payment_mode = 'gcash' THEN total ELSE 0 END) AS gcash_total
    FROM orders
    WHERE source = 'POS'
      AND DATE(created_at) = CURDATE()
  `);

  res.render('admin/pos/index', {
    products,
    summary
  });
};

exports.complete = async (req, res) => {
  const { items, payment_mode } = req.body;

  if (!items || !items.length) {
    return res.json({ ok: false });
  }

  let total = 0;
  for (const i of items) {
    total += i.price * i.qty;
  }

  const [orderRes] = await db.query(
    `
    INSERT INTO orders
    (status, total, payment_mode, source, confirmed_at, created_at)
    VALUES ('confirmed', ?, ?, 'POS', NOW(), NOW())
    `,
    [total, payment_mode]
  );

  const orderId = orderRes.insertId;

  for (const i of items) {
    const [[p]] = await db.query(
      `SELECT stock FROM products WHERE id = ?`,
      [i.product_id]
    );

    const newStock = p.stock - i.qty;

    await db.query(
      `UPDATE products SET stock = ? WHERE id = ?`,
      [newStock, i.product_id]
    );

    await db.query(
      `
      INSERT INTO order_items
      (order_id, product_id, qty, price)
      VALUES (?, ?, ?, ?)
      `,
      [orderId, i.product_id, i.qty, i.price]
    );

    await db.query(
      `
      INSERT INTO products_stock_logs
      (product_id, action, qty, prev_stock, new_stock, reason)
      VALUES (?, 'pos_sale', ?, ?, ?, 'POS Sale')
      `,
      [i.product_id, i.qty, p.stock, newStock]
    );
  }

  res.json({ ok: true });
};
