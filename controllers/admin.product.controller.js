const Product = require('../models/product.model');
const Category = require('../models/category.model');

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

  res.render('admin/products/index', {
    products,
    categories,
    search,
    category_id,
    page,
    total,
    pages: Math.ceil(total / limit),
    metrics
  });
};

exports.showEdit = async (req, res) => {
  const id = req.params.id;
  const product = await Product.findById(id);
  const categories = await Category.findAll();

  if (!product) return res.status(404).send('Product not found');

  res.render('admin/products/edit', {
    product,
    categories
  });
};

exports.update = async (req, res) => {
  const id = req.params.id;

  await Product.update(id, {
    name: req.body.name,
    category_id: req.body.category_id,
    price: req.body.price,
    stock: req.body.stock,
    image: req.file ? req.file.filename : req.body.existing_image || null
  });

  res.redirect('/admin/products');
};

exports.delete = async (req, res) => {
  const id = req.params.id;
  await Product.delete(id);
  res.redirect('/admin/products');
};
