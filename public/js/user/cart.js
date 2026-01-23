const wrap = document.getElementById('cart-wrap');
const totalEl = document.getElementById('cart-total');

let cart = JSON.parse(localStorage.getItem('cart') || '[]');

function save() {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function money(n) {
  return '₱' + Number(n).toFixed(2);
}

function render() {
  if (cart.length === 0) {
    wrap.innerHTML = `
      <div class="cart-empty">
        Your cart is empty.
      </div>
    `;
    totalEl.textContent = money(0);
    return;
  }

  let html = `
    <table class="cart-table">
      <thead>
        <tr>
          <th>Product</th>
          <th>Price</th>
          <th>Qty</th>
          <th>Subtotal</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
  `;

  let total = 0;

  cart.forEach((item, idx) => {
    const sub = item.price * item.qty;
    total += sub;

    html += `
      <tr>
        <td>${item.name}</td>
        <td>${money(item.price)}</td>
        <td>
          <div class="qty-ctrl">
            <button data-i="${idx}" data-a="dec">−</button>
            <span>${item.qty}</span>
            <button data-i="${idx}" data-a="inc">+</button>
          </div>
        </td>
        <td>${money(sub)}</td>
        <td>
          <button class="cart-remove" data-i="${idx}">Remove</button>
        </td>
      </tr>
    `;
  });

  html += `</tbody></table>`;
  wrap.innerHTML = html;
  totalEl.textContent = money(total);

  bind();
}

function bind() {
  wrap.querySelectorAll('.qty-ctrl button').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.i);
      const a = b.dataset.a;
      if (a === 'inc') cart[i].qty++;
      if (a === 'dec') cart[i].qty = Math.max(1, cart[i].qty - 1);
      save();
      render();
    };
  });

  wrap.querySelectorAll('.cart-remove').forEach(b => {
    b.onclick = () => {
      const i = Number(b.dataset.i);
      cart.splice(i, 1);
      save();
      render();
    };
  });
}

render();
