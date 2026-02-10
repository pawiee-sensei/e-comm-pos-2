const db = require('../db');

/**
 * ======================================================
 * STRATEGY DASHBOARD
 * ======================================================
 */
exports.index = async (req, res) => {
  const period = req.query.period || '7'; // days
  const days = Number(period);

  /* =========================
     DASHBOARD METRICS
  ========================== */
  const [[metrics]] = await db.query(`
    SELECT
      IFNULL(SUM(o.total),0) AS revenue,
      COUNT(DISTINCT o.id) AS transactions
    FROM orders o
    WHERE o.status='confirmed'
      AND o.source IN ('POS','ONLINE')
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
  `, [days]);

  /* =========================
     TABLE 1 — SALES & PROFIT IMPACT
  ========================== */
  const [salesImpact] = await db.query(`
    SELECT
      p.id,
      p.name,
      SUM(oi.qty) AS units_sold,
      SUM(oi.qty * oi.price) AS revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status='confirmed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY p.id
    ORDER BY revenue DESC
  `, [days]);

  /* =========================
     TABLE 2 — INVENTORY & OPPORTUNITY RISK
  ========================== */
  const [inventoryRisk] = await db.query(`
    SELECT
      p.id,
      p.name,
      p.stock,
      IFNULL(SUM(oi.qty)/?,0) AS avg_daily_sales
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
      AND o.status='confirmed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY p.id
  `, [days, days]);

  /* =========================
     TABLE 3 — MISSED OPPORTUNITIES
  ========================== */
  const [missed] = await db.query(`
    SELECT
      p.id,
      p.name,
      p.stock,
      IFNULL(SUM(oi.qty),0) AS recent_sales
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    LEFT JOIN orders o ON o.id = oi.order_id
      AND o.status='confirmed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY p.id
    HAVING p.stock <= 2 AND recent_sales > 0
  `, [days]);

  res.render('admin/strategy/index', {
    period: days,
    metrics,
    salesImpact,
    inventoryRisk,
    missed
  });
};
