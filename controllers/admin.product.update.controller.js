const Product = require('../models/product.model');

exports.updateAjax = async (req, res) => {
  try {
    let { id, name, price, category_id } = req.body;
category_id = category_id === '' ? null : category_id;

    let image = req.file ? req.file.filename : null;

// if no new image, keep old
if (!req.file) {
  const old = await Product.findById(id);
  image = old.image; // preserve existing filename
}


    await Product.updateProduct({
      id,
      name,
      price,
      category_id,
      image
    });

    return res.json({ ok: true });

  } catch (err) {
    console.log('UPDATE ERROR:', err);
    return res.json({ ok: false, msg: 'Server error' });
  }
};
    