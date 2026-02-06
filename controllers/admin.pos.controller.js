const db = require('../db');
const bcrypt = require('bcrypt');

/**
 * ======================================================
 * POS PAGE
 * ======================================================
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

  // DAILY SUMMARY — CONFIRMED POS SALES ONLY
  const [[summary]] = await db.query(`
    SELECT
      COUNT(*) AS transactions,
      IFNULL(SUM(total),0) AS total_sales,
      IFNULL(SUM(CASE WHEN payment_mode='COD' THEN total ELSE 0 END),0) AS cash_total,
      IFNULL(SUM(CASE WHEN payment_mode='GCASH' THEN total ELSE 0 END),0) AS gcash_total
    FROM orders
    WHERE source='POS'
      AND status='confirmed'
      AND DATE(confirmed_at)=CURDATE()
  `);

  // POS SALES LIST (CONFIRMED + VOIDED ONLY)
  const [sales] = await db.query(`
    SELECT id, payment_mode, total, created_at, status
    FROM orders
    WHERE source='POS'
      AND status IN ('confirmed','voided')
      AND DATE(created_at)=?
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
 * ======================================================
 * STEP 1 — CREATE TEMP POS SALE
 * status = 'pending'
 * NO STOCK
 * NO LOGS
 * ======================================================
 */
exports.complete = async (req, res) => {
  const { items, payment_mode } = req.body;
  if (!items || !items.length) {
    return res.json({ ok: false, error: 'Empty cart' });
  }

  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  const [orderRes] = await db.query(`
    INSERT INTO orders
    (customer_name, phone, address, status, payment_mode, payment_status, source, total, created_at)
    VALUES
    ('POS Walk-in','N/A','N/A','pending',?, 'unpaid','POS',?, NOW())
  `, [payment_mode, total]);

  const orderId = orderRes.insertId;

  for (const i of items) {
    await db.query(`
      INSERT INTO order_items (order_id, product_id, qty, price)
      VALUES (?,?,?,?)
    `, [orderId, i.product_id, i.qty, i.price]);
  }

  res.json({ ok: true, orderId });
};

/**
 * ======================================================
 * STEP 2 — CONFIRM POS SALE (AFTER 10s)
 * DEDUCT STOCK
 * WRITE STOCK LOGS
 * ======================================================
 */
exports.confirmSale = async (req, res) => {
  const { order_id } = req.body;

  const [[order]] = await db.query(`
    SELECT * FROM orders
    WHERE id = ?
      AND status = 'pending'
      AND source = 'POS'
  `, [order_id]);

  if (!order) {
    return res.json({ ok: false, error: 'Order not found or already handled' });
  }

  const [items] = await db.query(`
    SELECT * FROM order_items WHERE order_id = ?
  `, [order_id]);

  for (const item of items) {
    const [[product]] = await db.query(
      `SELECT stock FROM products WHERE id = ?`,
      [item.product_id]
    );

    const newStock = product.stock - item.qty;

    await db.query(
      `UPDATE products SET stock = ? WHERE id = ?`,
      [newStock, item.product_id]
    );

    await db.query(`
      INSERT INTO products_stock_logs
      (product_id, action, qty, prev_stock, new_stock, reason)
      VALUES (?, 'sale', ?, ?, ?, 'POS Confirmed Sale')
    `, [
      item.product_id,
      item.qty,
      product.stock,
      newStock
    ]);
  }

  await db.query(`
    UPDATE orders
    SET status='confirmed',
        payment_status='paid',
        confirmed_at=NOW()
    WHERE id=?
  `, [order_id]);

  res.json({ ok: true });
};

/**
 * ======================================================
 * UNDO TEMP POS SALE (WITHIN 10s)
 * DELETE ORDER + ITEMS
 * NO STOCK
 * NO LOGS
 * ======================================================
 */
exports.undoTemp = async (req, res) => {
  const { order_id } = req.body;
  if (!order_id) {
    return res.json({ ok: false, error: 'Missing order id' });
  }

  const [[order]] = await db.query(`
    SELECT * FROM orders
    WHERE id = ?
      AND status = 'pending'
      AND source = 'POS'
  `, [order_id]);

  if (!order) {
    return res.json({ ok: false, error: 'Order cannot be undone' });
  }

  await db.query(`DELETE FROM order_items WHERE order_id = ?`, [order_id]);
  await db.query(`DELETE FROM orders WHERE id = ?`, [order_id]);

  res.json({ ok: true });
};

/**
 * ======================================================
 * RECEIPT
 * ======================================================
 */
exports.receipt = async (req, res) => {
  const id = req.params.id;

  const [[order]] = await db.query(
    `SELECT * FROM orders WHERE id = ?`,
    [id]
  );

  const [items] = await db.query(`
    SELECT oi.qty, oi.price, p.name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
  `, [id]);

  res.render('admin/pos/receipt', { order, items });
};

/**
 * ======================================================
 * ADMIN VOID (PIN REQUIRED)
 * RESTORE STOCK
 * LOG REVERSAL
 * ======================================================
 */
exports.voidSale = async (req, res) => {
  const { order_id, pin, reason } = req.body;

  if (!order_id || !pin || !reason) {
    return res.json({ ok: false, error: 'Missing data' });
  }

  const [[admin]] = await db.query(`SELECT pin_hash FROM admins LIMIT 1`);
  const validPin = admin && await bcrypt.compare(pin, admin.pin_hash);
  if (!validPin) {
    return res.json({ ok: false, error: 'Invalid PIN' });
  }

  const [[order]] = await db.query(`
    SELECT * FROM orders
    WHERE id = ?
      AND status = 'confirmed'
      AND source = 'POS'
  `, [order_id]);

  if (!order) {
    return res.json({ ok: false, error: 'Order not found' });
  }

  const [items] = await db.query(
    `SELECT * FROM order_items WHERE order_id = ?`,
    [order_id]
  );

  for (const item of items) {
    const [[product]] = await db.query(
      `SELECT stock FROM products WHERE id = ?`,
      [item.product_id]
    );

    const restored = product.stock + item.qty;

    await db.query(
      `UPDATE products SET stock = ? WHERE id = ?`,
      [restored, item.product_id]
    );

    await db.query(`
      INSERT INTO products_stock_logs
      (product_id, action, qty, prev_stock, new_stock, reason)
      VALUES (?, 'voided', ?, ?, ?, 'POS Admin Void')
    `, [
      item.product_id,
      item.qty,
      product.stock,
      restored
    ]);
  }

  await db.query(`
    UPDATE orders
    SET status='voided',
        payment_status='voided',
        voided_at=NOW(),
        void_reason=?
    WHERE id=?
  `, [reason, order_id]);

  res.json({ ok: true });
};
