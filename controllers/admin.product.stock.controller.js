const Product = require('../models/product.model');
const Stock = require('../models/product.stock.model');

exports.adjustAjax = async (req, res) => {
  try {
    const { product_id, qty, type, reason } = req.body;

    const product = await Product.findById(product_id);
    if (!product) return res.json({ ok:false, msg:'Product not found' });

    const current = Number(product.stock);
    const delta = Number(qty);

    let newStock = current;
    if (type === 'add') newStock = current + delta;
    if (type === 'deduct') newStock = current - delta;

    if (newStock < 0) {
      return res.json({ ok:false, msg:'Cannot deduct beyond available stock' });
    }

    await Product.updateStock(product_id, newStock);

    // STOCK LOG ONLY
    await Stock.log({
  product_id,
  action: type,
  qty: delta,
  prev_stock: current,
  new_stock: newStock,
  reason: reason || null
});


    // SAFE JSON RETURN
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
    console.error('ADJUST ERROR:', err);
    return res.json({ ok:false, msg:'Server error' });
  }
};
