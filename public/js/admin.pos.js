const cart = {};
const cartBox = document.getElementById('cart-items');
const totalEl = document.getElementById('cart-total');

document.querySelectorAll('.pos-card').forEach(card => {
  card.onclick = () => {
    const id = card.dataset.id;
    if (!cart[id]) {
      cart[id] = {
        product_id: id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        qty: 0
      };
    }
    cart[id].qty++;
    render();
  };
});

function render() {
  cartBox.innerHTML = '';
  let total = 0;

  Object.values(cart).forEach(i => {
    total += i.qty * i.price;
    cartBox.innerHTML += `
      <div class="cart-row">
        ${i.name} x ${i.qty}
        <button onclick="dec(${i.product_id})">-</button>
      </div>
    `;
  });

  totalEl.textContent = total;
}

window.dec = id => {
  cart[id].qty--;
  if (cart[id].qty <= 0) delete cart[id];
  render();
};

document.getElementById('btn-complete').onclick = async () => {
  const r = await fetch('/admin/pos/complete', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      payment_mode: document.getElementById('payment').value,
      items: Object.values(cart)
    })
  });

  const j = await r.json();
  if (j.ok) location.reload();
};
