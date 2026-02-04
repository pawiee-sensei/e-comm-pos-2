

const db = require('../db');


/**
 * POS PAGE
 */
exports.index = async (req, res) => {
  const date = req.query.date || new Date().toISOString().slice(0, 10);

  const [products] = await db.query(`
    SELECT p.*, c.name AS category_name
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.stock > 0
    ORDER BY p.name ASC
  `);

  const [[summary]] = await db.query(`
    SELECT
  COUNT(*) AS transactions,
  IFNULL(SUM(total),0) AS total_sales,
  IFNULL(SUM(CASE WHEN payment_mode = 'COD' THEN total ELSE 0 END),0) AS cash_total,
  IFNULL(SUM(CASE WHEN payment_mode = 'GCASH' THEN total ELSE 0 END),0) AS gcash_total
FROM orders
WHERE DATE(created_at) = CURDATE()
  AND status = 'confirmed'


  `, [date]);

  const [sales] = await db.query(`
    SELECT id, payment_mode, total, created_at
    FROM orders
    WHERE source = 'POS'
      AND DATE(created_at) = ?
    ORDER BY created_at DESC
  `, [date]);

  res.render('admin/pos/index', {
    products,
    summary,
    sales,
    date
  });
};


/**
 * COMPLETE SALE
 */
exports.complete = async (req, res) => {
  const { items, payment_mode } = req.body;

  if (!items || !items.length) {
    return res.json({ ok: false });
  }

  let total = 0;
  items.forEach(i => {
    total += i.price * i.qty;
  });

  const [orderRes] = await db.query(
  `
  INSERT INTO orders
  (
    customer_name,
    phone,
    address,
    status,
    payment_mode,
    payment_status,
    source,
    total,
    confirmed_at,
    created_at
  )
  VALUES
  (
    'POS Walk-in',
    'N/A',
    'N/A',
    'confirmed',
    ?,
    'paid',
    'POS',
    ?,
    NOW(),
    NOW()
  )
  `,
  [payment_mode, total]
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
      VALUES (?, 'sale', ?, ?, ?, 'POS Sale')
      `,
      [i.product_id, i.qty, p.stock, newStock]
    );
  }

  res.json({ ok: true, orderId });
};

/**
 * RECEIPT
 */
exports.receipt = async (req, res) => {
  const id = req.params.id;

  const [[order]] = await db.query(
    `SELECT * FROM orders WHERE id = ?`,
    [id]
  );

  const [items] = await db.query(
    `
    SELECT oi.qty, oi.price, p.name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
    `,
    [id]
  );

  res.render('admin/pos/receipt', { order, items });
};


  const bcrypt = require('bcrypt');

/**
 * VOID / RETURN SALE (ADMIN APPROVED)
 */
exports.voidSale = async (req, res) => {
  const { order_id, pin, reason } = req.body;

  if (!order_id || !pin || !reason) {
    return res.json({ ok: false, error: 'Missing data' });
  }

  /* 1️⃣ Verify admin PIN */
  const [[admin]] = await db.query(
    `SELECT pin_hash FROM admins LIMIT 1`
  );

  if (!admin) {
    return res.json({ ok: false, error: 'Admin not found' });
  }

  const validPin = await bcrypt.compare(pin, admin.pin_hash);
  if (!validPin) {
    return res.json({ ok: false, error: 'Invalid PIN' });
  }

  /* 2️⃣ Get order */
  const [[order]] = await db.query(
    `SELECT * FROM orders WHERE id = ? AND status = 'confirmed'`,
    [order_id]
  );

  if (!order) {
    return res.json({ ok: false, error: 'Order not found or already voided' });
  }

  /* 3️⃣ Restore stock */
  const [items] = await db.query(
    `SELECT * FROM order_items WHERE order_id = ?`,
    [order_id]
  );

  for (const item of items) {
    const [[product]] = await db.query(
      `SELECT stock FROM products WHERE id = ?`,
      [item.product_id]
    );

    const restoredStock = product.stock + item.qty;

    await db.query(
      `UPDATE products SET stock = ? WHERE id = ?`,
      [restoredStock, item.product_id]
    );

    await db.query(
      `
      INSERT INTO products_stock_logs
      (product_id, action, qty, prev_stock, new_stock, reason)
      VALUES (?, 'void', ?, ?, ?, 'POS Void')
      `,
      [
        item.product_id,
        item.qty,
        product.stock,
        restoredStock
      ]
    );
  }

  /* 4️⃣ Mark order as voided */
  await db.query(
    `
    UPDATE orders
      SET status = 'cancelled',
          cancelled_at = NOW()
      WHERE id = ?
    `,
    [reason, order_id]
  );

  res.json({ ok: true });
};

