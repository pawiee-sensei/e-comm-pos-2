const Product = require('../models/product.model');
const Stock = require('../models/product.stock.model');

exports.adjustAjax = async (req, res) => {
  try {
    const { product_id, qty, type, reason } = req.body;

    // current stock
    const product = await Product.findById(product_id);
    if (!product) return res.json({ ok:false, msg:'Product not found' });

    const current = product.stock * 1;
    const delta = qty * 1;

    let newStock = current;

    if (type === 'add') newStock = current + delta;
    if (type === 'deduct') newStock = current - delta;

    // rule: block negative inventory
    if (newStock < 0) {
      return res.json({ ok:false, msg:'Cannot deduct beyond available stock' });
    }

    // update DB
    await Product.updateStock(product_id, newStock);

    // log movement
    await Stock.log({
      product_id,
      qty_change: (type === 'add' ? delta : -delta),
      previous_stock: current,
      new_stock: newStock,
      reason: reason || null
    });

    // compute status for UI
    let status = 'GOOD';
    if (newStock === 0) status = 'OUT';
    else if (newStock <= 5) status = 'LOW';
    else if (newStock <= 20) status = 'MED';

    return res.json({
      ok: true,
      new_stock: newStock,
      status
    });

  } catch (err) {
    console.error(err);
    return res.json({ ok:false, msg:'Server error' });
  }
};
