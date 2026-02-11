const Product = require('../models/product.model');
const Stock = require('../models/product.stock.model');
const Activity = require('../models/product.activity.model');

exports.createAjax = async (req, res) => {
  try {

    const { name, category_id, price, cost, stock } = req.body;

    // Basic validation (important)
    if (!name || !category_id || !price || !cost || !stock) {
      return res.json({ ok: false, msg: 'Missing required fields' });
    }

    const insertId = await Product.create({
      name,
      category_id,
      price: Number(price),
      cost: Number(cost),   // ✅ THIS WAS MISSING
      stock: Number(stock),
      image: req.file ? req.file.filename : null
    });

    // STOCK LOG
    await Stock.log({
      product_id: insertId,
      action: 'add',
      qty: Number(stock),
      prev_stock: 0,
      new_stock: Number(stock),
      reason: 'Initial stock'
    });

    // ACTIVITY LOG
    await Activity.log({
      product_id: insertId,
      action: 'create',
      snapshot_name: name,
      details: `Created product (₱${price}, cost ₱${cost}, stock: ${stock})`
    });

    return res.json({ ok: true, id: insertId });

  } catch (err) {
    console.error("CREATE ERROR:", err);
    return res.json({ ok: false, msg: 'Server error' });
  }
};
