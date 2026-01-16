const Product = require('../models/product.model');
const Activity = require('../models/product.activity.model');

exports.updateAjax = async (req, res) => {
  try {
    const { id, name, price, category_id } = req.body;

    const existing = await Product.findById(id);
    if (!existing) return res.json({ ok:false, msg:'Product not found' });

    const payload = {
      name,
      price,
      category_id,
      stock: existing.stock,
      image: req.file ? req.file.filename : existing.image
    };

    await Product.update(id, payload);

    await Activity.log({
      product_id: id,
      action: 'edit',
      snapshot_name: payload.name,
      details: `Edited product (${name}, ₱${price})`
    });

    return res.json({
      ok: true,
      updated: {
        name,
        price,
        category_id,
        stock: existing.stock
      }
    });

  } catch (err) {
    console.error("UPDATE AJAX ERROR:", err);
    return res.json({ ok:false, msg:'Server error' });
  }
};
