const db = require('../db');

exports.panel = async (req, res) => {
  const page = parseInt(req.query.page || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const [rows] = await db.query(
    `SELECT l.*, p.name as product_name
     FROM products_stock_logs l
     JOIN products p ON p.id = l.product_id
     ORDER BY l.id DESC
     LIMIT ? OFFSET ?`,
    [limit, offset]
  );

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) as total FROM products_stock_logs`
  );

  const pages = Math.ceil(total / limit);

  res.render('admin/products/logs', {
    logs: rows,
    page,
    pages
  });
};
