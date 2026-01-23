const db = require('../db');

exports.view = (req, res) => {
  res.render('user/checkout');
};

exports.submit = async (req, res) => {
  try {
    const {
      name,
      phone,
      address,
      payment_mode,
      reference_no,
      cart_json
    } = req.body;

    const cart = JSON.parse(cart_json || '[]');
    if (!cart.length) {
      return res.status(400).send('Cart is empty');
    }

    let total = 0;
    cart.forEach(i => total += i.price * i.qty);

    // create order
    const [r] = await db.query(
      `INSERT INTO orders
       (customer_name, phone, address, payment_mode, payment_status, status, total)
       VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [
        name,
        phone,
        address,
        payment_mode,
        payment_mode === 'GCASH' ? 'pending_verification' : 'unpaid',
        total
      ]
    );

    const orderId = r.insertId;

    // insert order items
    for (const item of cart) {
      await db.query(
        `INSERT INTO order_items
         (order_id, product_id, qty, price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [orderId, item.id, item.qty, item.price, item.qty * item.price]
      );
    }

    // payment record (GCash)
    if (payment_mode === 'GCASH') {
      await db.query(
        `INSERT INTO payments
         (order_id, method, reference_no, receipt_image)
         VALUES (?, 'GCASH', ?, ?)`,
        [
          orderId,
          reference_no,
          req.file ? req.file.filename : null
        ]
      );
    }

    res.render('user/checkout_success');

  } catch (err) {
    console.error('CHECKOUT ERROR:', err);
    res.status(500).send('Server error');
  }
};
