const Product = require('../models/product.model');
const Category = require('../models/category.model');
const path = require('path');

exports.index = async (req, res) => {
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
    pages: Math.ceil(total / limit)
  });
};

exports.showAdd = async (req, res) => {
  const categories = await Category.findAll();
  res.render('admin/products/add', { categories });
};

exports.create = async (req, res) => {
  await Product.create({
    name: req.body.name,
    category_id: req.body.category_id,
    price: req.body.price,
    stock: req.body.stock,
    image: req.file ? req.file.filename : null
  });

  res.redirect('/admin/products');
};

exports.showEdit = async (req, res) => {
  const product = await Product.findById(req.params.id);
  const categories = await Category.findAll();
  res.render('admin/products/edit', { product, categories });
};

exports.update = async (req, res) => {
  await Product.update(req.params.id, {
    name: req.body.name,
    category_id: req.body.category_id,
    price: req.body.price,
    stock: req.body.stock,
    image: req.file ? req.file.filename : req.body.existing_image
  });

  res.redirect('/admin/products');
};

exports.delete = async (req, res) => {
  await Product.delete(req.params.id);
  res.redirect('/admin/products');
};
