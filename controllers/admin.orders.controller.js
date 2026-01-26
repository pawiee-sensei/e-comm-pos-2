const db = require('../db');

/**
 * ORDERS LIST PAGE
 * - Pending orders (paginated)
 * - Order history (confirmed + cancelled, paginated)
 * - Search by customer name / phone
 */
exports.index = async (req, res) => {
  const q = req.query.q || '';

  // pagination
  const pendingPage = Number(req.query.pending_page || 1);
  const historyPage = Number(req.query.page || 1);

  const pendingLimit = 5;
  const historyLimit = 10;

  const pendingOffset = (pendingPage - 1) * pendingLimit;
  const historyOffset = (historyPage - 1) * historyLimit;

  const searchWhere = q
    ? `AND (customer_name LIKE ? OR phone LIKE ?)`
    : '';

  const searchParams = q ? [`%${q}%`, `%${q}%`] : [];

  /**
   * =========================
   * PENDING ORDERS
   * =========================
   */
  const [pending] = await db.query(
    `
    SELECT *
    FROM orders
    WHERE status = 'pending'
    ${searchWhere}
    ORDER BY created_at DESC
    LIMIT ? OFFSET ?
    `,
    [...searchParams, pendingLimit, pendingOffset]
  );

  const [[pendingCount]] = await db.query(
    `
    SELECT COUNT(*) total
    FROM orders
    WHERE status = 'pending'
    ${searchWhere}
    `,
    searchParams
  );

  /**
   * =========================
   * ORDER HISTORY
   * (CONFIRMED + CANCELLED)
   * =========================
   */
  const [history] = await db.query(
    `
    SELECT *
    FROM orders
    WHERE status IN ('confirmed','cancelled')
    ${searchWhere}
    ORDER BY COALESCE(confirmed_at, cancelled_at, created_at) DESC
    LIMIT ? OFFSET ?
    `,
    [...searchParams, historyLimit, historyOffset]
  );

  const [[historyCount]] = await db.query(
    `
    SELECT COUNT(*) total
    FROM orders
    WHERE status IN ('confirmed','cancelled')
    ${searchWhere}
    `,
    searchParams
  );

  res.render('admin/orders/index', {
    pending,
    history,
    q,

    pendingPage,
    pendingPages: Math.ceil(pendingCount.total / pendingLimit),

    page: historyPage,
    pages: Math.ceil(historyCount.total / historyLimit)
  });
};

/**
 * ORDER DETAIL VIEW
 */
exports.view = async (req, res) => {
  const id = req.params.id;

  const [[order]] = await db.query(
    `SELECT * FROM orders WHERE id = ?`,
    [id]
  );

  const [items] = await db.query(
    `
    SELECT oi.*, p.name
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    WHERE oi.order_id = ?
    `,
    [id]
  );

  const [[payment]] = await db.query(
    `SELECT * FROM payments WHERE order_id = ?`,
    [id]
  );

  res.render('admin/orders/view', {
    order,
    items,
    payment
  });
};

/**
 * CONFIRM ORDER
 * - Deduct stock
 * - Log stock as SALE
 * - Move order to history
 */
exports.confirm = async (req, res) => {
  const id = req.params.id;

  const [items] = await db.query(
    `SELECT product_id, qty FROM order_items WHERE order_id = ?`,
    [id]
  );

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

    await db.query(
      `
      INSERT INTO products_stock_logs
      (product_id, action, qty, prev_stock, new_stock, reason)
      VALUES (?, 'sale', ?, ?, ?, 'Order confirmed')
      `,
      [item.product_id, item.qty, product.stock, newStock]
    );
  }

  await db.query(
    `
    UPDATE orders
    SET status = 'confirmed',
        confirmed_at = NOW()
    WHERE id = ?
    `,
    [id]
  );

  res.redirect('/admin/orders');
};

/**
 * CANCEL ORDER
 * - No stock change
 * - Moves order to history as CANCELLED
 */
exports.cancel = async (req, res) => {
  const id = req.params.id;

  await db.query(
    `
    UPDATE orders
    SET status = 'cancelled',
        cancelled_at = NOW()
    WHERE id = ?
    `,
    [id]
  );

  res.redirect('/admin/orders');
};
