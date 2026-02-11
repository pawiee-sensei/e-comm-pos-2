const db = require('../db');

/**
 * ======================================================
 * STRATEGY DASHBOARD (SMART VERSION — FULLY FIXED)
 * ======================================================
 */
exports.index = async (req, res) => {

  const period = req.query.period || '7';
  const days = Number(period);

  /* ======================================================
     DATE FILTER LOGIC
  ====================================================== */

  let dateCondition;
  let params = [];

  if (days === 1) {
    dateCondition = `DATE(o.created_at) = CURDATE()`;
  } else {
    dateCondition = `o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`;
    params.push(days);
  }

  /* ======================================================
     DASHBOARD METRICS
  ====================================================== */

  const [[metrics]] = await db.query(`
    SELECT
      IFNULL(SUM(o.total),0) AS revenue,
      COUNT(DISTINCT o.id) AS transactions,
      IFNULL(SUM((oi.price - p.cost) * oi.qty),0) AS gross_profit
    FROM orders o
    JOIN order_items oi ON oi.order_id = o.id
    JOIN products p ON p.id = oi.product_id
    WHERE o.status='confirmed'
      AND p.is_active = 1
      AND ${dateCondition}
  `, params);

  const avgMargin = metrics.revenue > 0
    ? ((metrics.gross_profit / metrics.revenue) * 100).toFixed(1)
    : 0;

  /* ======================================================
     PRODUCT PERFORMANCE (PERIOD-CORRECT AGGREGATION)
  ====================================================== */

  let productQuery;
  let productParams = [...params];

  if (days === 1) {
    productQuery = `
      SELECT
        p.id,
        p.name,
        p.stock,
        p.price,
        p.cost,
        IFNULL(SUM(oi.qty),0) AS units_sold,
        IFNULL(SUM(oi.qty * oi.price),0) AS revenue,
        IFNULL(SUM((oi.price - p.cost) * oi.qty),0) AS profit
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE p.is_active = 1
        AND o.status = 'confirmed'
        AND DATE(o.created_at) = CURDATE()
      GROUP BY p.id
    `;
  } else {
    productQuery = `
      SELECT
        p.id,
        p.name,
        p.stock,
        p.price,
        p.cost,
        IFNULL(SUM(oi.qty),0) AS units_sold,
        IFNULL(SUM(oi.qty * oi.price),0) AS revenue,
        IFNULL(SUM((oi.price - p.cost) * oi.qty),0) AS profit
      FROM products p
      LEFT JOIN order_items oi ON oi.product_id = p.id
      LEFT JOIN orders o ON o.id = oi.order_id
      WHERE p.is_active = 1
        AND o.status = 'confirmed'
        AND o.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY p.id
    `;
  }

  const [products] = await db.query(productQuery, productParams);

  /* ======================================================
     TABLE 1 — PROFIT PERFORMANCE
  ====================================================== */

  const salesImpact = products.map(p => {

    const margin = p.revenue > 0
      ? ((p.profit / p.revenue) * 100)
      : 0;

    let classification = 'Stable';

    if (p.profit > 5000 && p.units_sold > 20)
      classification = 'Core Product';

    else if (p.units_sold > 20 && margin < 20)
      classification = 'Low Margin Fast';

    else if (p.units_sold < 5 && margin > 40 && p.stock > 10)
      classification = 'Bundle Candidate';

    else if (p.units_sold < 5 && p.stock > 30)
      classification = 'Dead Stock Risk';

    return {
      ...p,
      margin: margin.toFixed(1),
      classification
    };
  });

  /* ======================================================
     TABLE 2 — INVENTORY RISK
  ====================================================== */

  const inventoryRisk = salesImpact.map(p => {

    const avgDaily = days > 0 ? p.units_sold / days : 0;
    const daysLeft = avgDaily > 0 ? (p.stock / avgDaily) : 999;

    let status = 'Healthy';

    if (p.stock === 0 && p.units_sold > 0)
      status = 'URGENT Restock';

    else if (daysLeft < 3)
      status = 'Restock Soon';

    else if (daysLeft > 60 && p.units_sold < 5)
      status = 'Overstock Risk';

    return {
      ...p,
      avg_daily_sales: avgDaily.toFixed(2),
      days_left: daysLeft === 999 ? '-' : Math.floor(daysLeft),
      status
    };
  });

  /* ======================================================
     TABLE 3 — MISSED OPPORTUNITY
  ====================================================== */

  const missed = salesImpact.filter(p =>
    p.stock === 0 && p.units_sold > 0
  );

  /* ======================================================
     DECISION CONFIDENCE
  ====================================================== */

  let confidence = 'Low';

  if (metrics.transactions > 50)
    confidence = 'High';
  else if (metrics.transactions > 20)
    confidence = 'Medium';

  /* ======================================================
     RENDER
  ====================================================== */

  res.render('admin/strategy/index', {
    period: days,
    metrics,
    avgMargin,
    confidence,
    salesImpact,
    inventoryRisk,
    missed
  });
};
