const db = require('../db');

/**
 * ======================================================
 * ADMIN DASHBOARD (BUSINESS VERSION — FINAL FIX)
 * ======================================================
 */
exports.index = async (req, res) => {

  /* ======================================================
     KPI METRICS (30 DAYS)
  ====================================================== */
  /* ======================================================
   💰 REAL KPI METRICS
====================================================== */

// TODAY REVENUE
const [[todayRev]] = await db.query(`
  SELECT IFNULL(SUM(total),0) revenue
  FROM orders
  WHERE status='confirmed'
  AND DATE(created_at)=CURDATE()
`);

// 7 DAY REVENUE
const [[weekRev]] = await db.query(`
  SELECT IFNULL(SUM(total),0) revenue
  FROM orders
  WHERE status='confirmed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
`);

// 30 DAY REVENUE
const [[monthRev]] = await db.query(`
  SELECT IFNULL(SUM(total),0) revenue
  FROM orders
  WHERE status='confirmed'
  AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
`);

// TOTAL PRODUCTS
const [[prodCount]] = await db.query(`
  SELECT COUNT(*) total FROM products WHERE is_active = 1
`);

const kpiCards = {
  todayRevenue: Number(todayRev.revenue || 0),
  weekRevenue: Number(weekRev.revenue || 0),
  monthRevenue: Number(monthRev.revenue || 0),
  totalProducts: Number(prodCount.total || 0)
};



  /* ======================================================
     📈 REVENUE TREND (SMART FALLBACK)
  ====================================================== */
  let [revRows] = await db.query(`
    SELECT DATE(created_at) day, IFNULL(SUM(total),0) revenue
    FROM orders
    WHERE status='confirmed'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY day
    ORDER BY day ASC
  `);

  if (revRows.length === 0) {
    [revRows] = await db.query(`
      SELECT DATE(created_at) day, IFNULL(SUM(total),0) revenue
      FROM orders
      WHERE status='confirmed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY day
      ORDER BY day ASC
    `);
  }

  const revenueLabels = revRows.map(r => r.day);
  const revenueData   = revRows.map(r => r.revenue);

  /* ======================================================
     📦 ORDERS TREND (SMART FALLBACK)
  ====================================================== */
  let [orderRows] = await db.query(`
    SELECT DATE(created_at) day, COUNT(*) count
    FROM orders
    WHERE status='confirmed'
      AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    GROUP BY day
    ORDER BY day ASC
  `);

  if (orderRows.length === 0) {
    [orderRows] = await db.query(`
      SELECT DATE(created_at) day, COUNT(*) count
      FROM orders
      WHERE status='confirmed'
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY day
      ORDER BY day ASC
    `);
  }

  const orderLabels = orderRows.map(r => r.day);
  const orderData   = orderRows.map(r => r.count);

  /* ======================================================
   🚨 SMART BUSINESS ALERTS
====================================================== */

// STOCK COUNTS
const [[stockStats]] = await db.query(`
  SELECT
    SUM(CASE WHEN stock = 0 THEN 1 ELSE 0 END) AS out_stock,
    SUM(CASE WHEN stock BETWEEN 1 AND 5 THEN 1 ELSE 0 END) AS low_stock
  FROM products
  WHERE is_active = 1
`);

// DEAD STOCK (no sales in 30 days)
const [deadStock] = await db.query(`
  SELECT p.id
  FROM products p
  LEFT JOIN order_items oi ON oi.product_id = p.id
  LEFT JOIN orders o ON o.id = oi.order_id
    AND o.status='confirmed'
    AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
  WHERE p.is_active = 1
  GROUP BY p.id
  HAVING IFNULL(SUM(oi.qty),0) = 0
`);

// TODAY SALES
const [[today]] = await db.query(`
  SELECT COUNT(*) AS orders
  FROM orders
  WHERE status='confirmed'
    AND DATE(created_at)=CURDATE()
`);

const alerts = [];

if (stockStats.out_stock > 0) {
  alerts.push({
    type: 'danger',
    title: 'Out of Stock Products',
    message: `${stockStats.out_stock} products are out of stock and losing sales.`
  });
}

if (stockStats.low_stock > 3) {
  alerts.push({
    type: 'warning',
    title: 'Low Stock Warning',
    message: `${stockStats.low_stock} products may run out soon.`
  });
}

if (deadStock.length > 0) {
  alerts.push({
    type: 'info',
    title: 'Dead Stock Detected',
    message: `${deadStock.length} products have no sales in 30 days.`
  });
}

if (today.orders > 20) {
  alerts.push({
    type: 'success',
    title: 'Great Sales Today',
    message: `You already have ${today.orders} orders today 🎉`
  });
}


  /* ======================================================
     🏆 TOP PRODUCTS (LAST 30 DAYS)
  ====================================================== */
  const [topProducts] = await db.query(`
    SELECT 
      p.name,
      SUM(oi.qty) sold
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status='confirmed'
      AND o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY p.id
    ORDER BY sold DESC
    LIMIT 5
  `);

  /* ======================================================
     🚀 RENDER (ALWAYS LAST)
  ====================================================== */
 res.render('admin/dashboard/index', {
  kpiCards,
  alerts,
  topProducts,
  charts: {
    days: revenueLabels,
    revenue: revenueData,
    orders: orderData
  }
});



};
