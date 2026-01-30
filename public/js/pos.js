// GLOBAL CART (frontend only)
window.posCart = {};

// ADD PRODUCT TO CART
document.querySelectorAll('.pos-product').forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.id;

    if (!window.posCart[id]) {
      window.posCart[id] = {
        product_id: id,
        name: btn.dataset.name,
        price: Number(btn.dataset.price),
        qty: 1
      };
    } else {
      window.posCart[id].qty++;
    }

    renderCart();
  });
});

// RENDER CART
function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');

  cartItems.innerHTML = '';
  let total = 0;

  Object.values(window.posCart).forEach(item => {
    total += item.price * item.qty;

    cartItems.innerHTML += `
      <div class="cart-row">
        <span>${item.name} × ${item.qty}</span>
        <button class="cart-remove" data-id="${item.product_id}">✕</button>
      </div>
    `;
  });

  totalEl.textContent = total.toFixed(2);
}

// REMOVE ITEM FROM CART
document.addEventListener('click', e => {
  if (e.target.classList.contains('cart-remove')) {
    const id = e.target.dataset.id;
    delete window.posCart[id];
    renderCart();
  }
});

// COMPLETE SALE
document.getElementById('btn-complete-sale').addEventListener('click', async () => {
  const items = Object.values(window.posCart);
  const payment_mode = document.getElementById('payment-mode').value;

  if (!items.length) {
    alert('Cart is empty');
    return;
  }

  const res = await fetch('/admin/pos/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items, payment_mode })
  });

  const data = await res.json();

  if (data.ok) {
    window.posCart = {};
    window.location.href = `/admin/pos/receipt/${data.orderId}`;
  } else {
    alert('Failed to complete sale');
  }
});
