const db = require('../db');
const Product = require('../models/product.model');
const Category = require('../models/category.model');
const Stock = require('../models/product.stock.model');
const Activity = require('../models/product.activity.model');

// ======================================================
// PRODUCT PANEL (PANEL + STOCK LOG + ACTIVITY LOG)
// ======================================================
exports.index = async (req, res) => {

  const metrics = {
    total: await Product.countAll({}),
    low: await Product.countStockRange({ max: 5 }),
    out: await Product.countStockEqual(0),
    healthy: await Product.countStockRange({ min: 21 })
  };

  const page = parseInt(req.query.page || 1);
  const limit = 10;
  const offset = (page - 1) * limit;

  const search = req.query.search || '';
  const category_id = req.query.category_id || null;

  const [products, total, categories] = await Promise.all([
    Product.findAll({ search, category_id, offset, limit }),
    Product.countAll({ search, category_id }),
    Category.findAll()
  ]);

  // STOCK LOG PAGINATION
  const logPage = parseInt(req.query.logpage || 1);
  const logLimit = 10;
  const logOffset = (logPage - 1) * logLimit;

  const [stockRows] = await db.query(`
    SELECT l.*, p.name AS product_name, p.image AS product_image
    FROM products_stock_logs l
    LEFT JOIN products p ON p.id = l.product_id
    ORDER BY l.id DESC
    LIMIT ? OFFSET ?
  `, [logLimit, logOffset]);

  const [[{ totalLogs }]] = await db.query(`
    SELECT COUNT(*) AS totalLogs FROM products_stock_logs
  `);

  const logPages = Math.ceil(totalLogs / logLimit);

  // ACTIVITY LOG PAGINATION
const activityPage = parseInt(req.query.activitypage || 1);
const activityLimit = 10;
const activityOffset = (activityPage - 1) * activityLimit;

const [activityRows] = await db.query(`
  SELECT a.*, p.name AS product_name
  FROM products_activity_logs a
  LEFT JOIN products p ON p.id = a.product_id
  ORDER BY a.id DESC
  LIMIT ? OFFSET ?
`, [activityLimit, activityOffset]);

const [[{ totalActivity }]] = await db.query(`
  SELECT COUNT(*) AS totalActivity FROM products_activity_logs
`);

const activityPages = Math.ceil(totalActivity / activityLimit);

res.render('admin/products/index', {
  products,
  categories,
  search,
  category_id,

  // PRODUCT PAGINATION
  page,
  pages: Math.ceil(total / limit),

  // METRICS
  metrics,

  // STOCK LOG PAGINATION
  logs: stockRows || [],
  logPage,
  logPages,

  // ACTIVITY LOG PAGINATION  ← ADD THESE
  activityLogs: activityRows || [],
  activityPage,
  activityPages
});
};


// ======================================================
// SHOW EDIT FORM
// ======================================================
exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  const categories = await Category.findAll();
  if (!product) return res.status(404).send('Product not found');
  res.render('admin/products/edit', { product, categories });
};


// ======================================================
// UPDATE (ACTIVITY ONLY)
// ======================================================
exports.update = async (req, res) => {
  const id = req.params.id;
  const existing = await Product.findById(id);
  if (!existing) return res.status(404).send('Product not found');

  const payload = {
    name: req.body.name,
    category_id: req.body.category_id,
    price: req.body.price,
    stock: existing.stock,
    image: req.file ? req.file.filename : req.body.existing_image || existing.image
  };

  await Product.update(id, payload);

  await Activity.log({
    product_id: id,
    action: 'edit',
    snapshot_name: payload.name,
    details: `Edited product (${payload.name}, ₱${payload.price})`
  });

  res.redirect('/admin/products');
};


// ======================================================
// DELETE (ACTIVITY ONLY)
// ======================================================
exports.delete = async (req, res) => {
  const id = req.params.id;
  const existing = await Product.findById(id);

  if (existing) {
    await Activity.log({
      product_id: id,
      action: 'delete',
      snapshot_name: existing.name,
      details: `Deleted product`
    });
  }

  await Product.delete(id);
  res.redirect('/admin/products');
};


// ======================================================
// CREATE (STOCK + ACTIVITY)
// ======================================================
exports.createAjax = async (req, res) => {
  try {
    const { name, category_id, price, stock } = req.body;

    const insertId = await Product.create({
      name,
      category_id,
      price: Number(price),
      stock: Number(stock),
      image: req.file ? req.file.filename : null
    });

    // STOCK LOG — initial stock
    await Stock.log({
      product_id: insertId,
      action: 'add',
      qty: Number(stock),
      prev_stock: 0,
      new_stock: Number(stock),
      reason: 'Initial stock'
    });

    // ACTIVITY LOG — create
    await Activity.log({
      product_id: insertId,
      action: 'create',
      snapshot_name: name,
      details: `Created product (${name}, ₱${price}, stock: ${stock})`
    });

    return res.json({ ok: true, id: insertId });

  } catch (err) {
    console.error(err);
    return res.json({ ok:false, error: err.message });
  }
};
