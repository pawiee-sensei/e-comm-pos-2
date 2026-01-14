const Product = require('../models/product.model');

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

    return res.json({ ok: true, id: insertId });

  } catch (err) {
    console.error("Create product error:", err);
    return res.json({ ok: false, error: err.message });
  }
};
