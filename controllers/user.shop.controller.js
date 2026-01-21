const db = require('../db');

exports.home = async (req, res) => {
  const [popular] = await db.query(`
    SELECT * FROM products ORDER BY id DESC LIMIT 6
  `);
  res.render('user/home', { popular });
};

exports.products = async (req, res) => {

  const [products] = await db.query(`
    SELECT p.*, c.name AS category_name, p.category_id
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.id DESC
  `);

  const [categories] = await db.query(`
    SELECT id, name FROM categories ORDER BY name ASC
  `);

  res.render('user/products', {
    products,
    categories
  });
};
