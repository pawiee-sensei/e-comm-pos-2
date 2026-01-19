const db = require('../db');

exports.home = (req,res) => {
  res.render('user/home');
};

exports.products = async (req,res) => {
  const q = req.query.q || '';
  const [rows] = await db.query(
    `SELECT * FROM products
     WHERE name LIKE ?`,
    [`%${q}%`]
  );
  res.render('user/products', { products: rows });
};
