const Product = require('../models/product.model');
const Stock = require('../models/product.stock.model');
const Activity = require('../models/product.activity.model');

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

    // STOCK LOG (no snapshot_name, no activity here)
    await Stock.log({
  product_id: insertId,
  action: 'add',
  qty: Number(stock),
  prev_stock: 0,
  new_stock: Number(stock),
  reason: 'Initial stock'
});

await Activity.log({
  product_id: insertId,
  action: 'create',
  snapshot_name: name,
  details: `Created product (₱${price}, stock: ${stock})`
});


    return res.json({ ok: true, id: insertId });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    return res.json({ ok: false, msg: 'Server error' });
  }
};
