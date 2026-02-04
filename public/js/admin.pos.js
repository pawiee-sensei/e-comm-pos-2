/* ======================================================
   POS SEARCH (PRODUCT LIST) — POS PAGE ONLY
====================================================== */

const searchInput = document.getElementById('pos-search');

if (searchInput) {
  searchInput.addEventListener('input', () => {
    const q = searchInput.value.toLowerCase();

    document.querySelectorAll('.pos-card').forEach(card => {
      const name = card.dataset.name.toLowerCase();
      card.style.display = name.includes(q) ? 'block' : 'none';
    });
  });
}

/* ======================================================
   GLOBAL CART (POS PAGE ONLY)
====================================================== */

window.posCart = {};

/* ADD PRODUCT TO CART */
document.querySelectorAll('.pos-card').forEach(card => {
  card.addEventListener('click', () => {
    const id = card.dataset.id;

    if (!window.posCart[id]) {
      window.posCart[id] = {
        product_id: id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        qty: 1
      };
    } else {
      window.posCart[id].qty++;
    }

    renderCart();
  });
});

/* RENDER CART */
function renderCart() {
  const cartItems = document.getElementById('cart-items');
  const totalEl = document.getElementById('cart-total');

  if (!cartItems || !totalEl) return;

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

/* REMOVE ITEM FROM CART */
document.addEventListener('click', e => {
  if (e.target.classList.contains('cart-remove')) {
    const id = e.target.dataset.id;
    delete window.posCart[id];
    renderCart();
  }
});

/* ======================================================
   COMPLETE SALE (POS PAGE ONLY)
====================================================== */

const completeBtn = document.getElementById('btn-complete-sale');

if (completeBtn) {
  completeBtn.addEventListener('click', async () => {
    const items = Object.values(window.posCart);
    const payment_mode = document.getElementById('payment-mode')?.value;

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
}
/* ======================================================
   VOID / RETURN — RECEIPT PAGE ONLY (FIXED)
====================================================== */

const receiptRoot = document.getElementById('receiptRoot');
const voidBtn = document.getElementById('btnVoidSale');
const voidModal = document.getElementById('voidModal');
const cancelVoidBtn = document.getElementById('btnCancelVoid');
const verifyPinBtn = document.getElementById('verifyPin');
const confirmVoidBtn = document.getElementById('confirmVoid');

const pinStage = document.getElementById('pinStage');
const voidStage = document.getElementById('voidStage');
const pinInputs = document.querySelectorAll('.pin-boxes input');
const reasonInput = document.getElementById('voidReason');

let verifiedPin = null;

/* RUN ONLY ON RECEIPT PAGE */
if (receiptRoot && voidModal) {
  const ORDER_ID = receiptRoot.dataset.orderId;

  /* OPEN MODAL */
  if (voidBtn) {
    voidBtn.addEventListener('click', () => {
      voidModal.classList.remove('hidden');
    });
  }

  /* CLOSE / CANCEL MODAL */
  if (cancelVoidBtn) {
    cancelVoidBtn.addEventListener('click', closeVoidModal);
  }

  function closeVoidModal() {
    voidModal.classList.add('hidden');

    pinStage.classList.remove('hidden');
    voidStage.classList.add('hidden');

    pinInputs.forEach(i => (i.value = ''));
    if (reasonInput) reasonInput.value = '';

    verifiedPin = null;
  }

  /* PIN AUTO-ADVANCE */
  pinInputs.forEach((input, i) => {
    input.addEventListener('input', () => {
      if (input.value && pinInputs[i + 1]) {
        pinInputs[i + 1].focus();
      }
    });
  });

  /* VERIFY PIN */
  if (verifyPinBtn) {
    verifyPinBtn.addEventListener('click', () => {
      const pin = [...pinInputs].map(i => i.value).join('');

      if (pin.length !== 4) {
        alert('Enter 4-digit PIN');
        return;
      }

      verifiedPin = pin;
      pinStage.classList.add('hidden');
      voidStage.classList.remove('hidden');
    });
  }

  /* CONFIRM VOID */
  if (confirmVoidBtn) {
    confirmVoidBtn.addEventListener('click', async () => {
      if (!verifiedPin) {
        alert('Please verify PIN first');
        return;
      }

      if (!reasonInput || !reasonInput.value.trim()) {
        alert('Reason required');
        return;
      }

      const res = await fetch('/admin/pos/void', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: ORDER_ID,
          pin: verifiedPin,
          reason: reasonInput.value.trim()
        })
      });

      const data = await res.json();

      if (data.ok) {
        alert('Sale voided successfully');
        window.location.href = '/admin/pos';
      } else {
        alert(data.error || 'Void failed');
      }
    });
  }
}
