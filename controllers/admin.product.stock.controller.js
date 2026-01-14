const Stock = require('../models/product.stock.model');

exports.adjust = async (req, res) => {
  const { product_id, qty, type, reason } = req.body;
  const qty_change = type === 'add' ? +qty : -qty;

  const newStock = await Stock.adjustStock({
    product_id,
    qty_change,
    reason: reason || null
  });

  return res.json({ ok: true, newStock });
};
