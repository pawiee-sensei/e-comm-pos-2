  /* ======================================================
    POS SEARCH (PRODUCT LIST)
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
    GLOBAL CART
  ====================================================== */

  window.posCart = {};

  /* ADD PRODUCT TO CART */
  document.querySelectorAll('.pos-card').forEach(card => {
  card.addEventListener('click', () => {

    const stock = Number(card.dataset.stock);

    // 🚫 HARD BLOCK — OUT OF STOCK
    if (stock <= 0) {
      return;
    }

    const id = card.dataset.id;

    if (!window.posCart[id]) {
      window.posCart[id] = {
        product_id: id,
        name: card.dataset.name,
        price: Number(card.dataset.price),
        qty: 1
      };
    } else {

      // 🚫 PREVENT EXCEEDING STOCK
      if (window.posCart[id].qty >= stock) {
        alert('Not enough stock');
        return;
      }

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
      delete window.posCart[e.target.dataset.id];
      renderCart();
    }
  });

  /* ======================================================
    COMPLETE SALE → CONFIRM MODAL
  ====================================================== */

  const completeBtn = document.getElementById('btn-complete-sale');
  const confirmModal = document.getElementById('confirmSaleModal');
  const confirmBtn = document.getElementById('btnConfirmSale');
  const cancelConfirmBtn = document.getElementById('btnCancelConfirm');

  let lastOrderId = null;
  let undoTimer = null;

  completeBtn?.addEventListener('click', () => {
    if (!Object.keys(window.posCart).length) {
      alert('Cart is empty');
      return;
    }

    confirmModal.classList.remove('hidden');
  });

  /* CANCEL CONFIRM */
  cancelConfirmBtn?.addEventListener('click', () => {
    confirmModal.classList.add('hidden');
  });

  /* ======================================================
    CONFIRM SALE (ACTUAL SAVE)
  ====================================================== */

  confirmBtn?.addEventListener('click', async () => {
    const items = Object.values(window.posCart);
    const payment_mode = document.getElementById('payment-mode')?.value;

    if (!items.length) return;

    const res = await fetch('/admin/pos/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, payment_mode })
    });

    const data = await res.json();

    if (!data.ok) {
      alert(data.error || 'Failed to complete sale');
      return;
    }

    confirmModal.classList.add('hidden');

    lastOrderId = data.orderId;
    window.posCart = {};
    renderCart();

    showUndoBar(lastOrderId);
  });

  /* ======================================================
    UNDO BAR (10 SECONDS — NO PIN)
  ====================================================== */
  function showUndoBar(orderId) {
  const bar = document.getElementById('undoBar');
  const btn = document.getElementById('btnUndoSale');
  const cd  = document.getElementById('undoCountdown');

  let seconds = 10;
  bar.classList.remove('hidden');
  cd.textContent = seconds;

  const timer = setInterval(async () => {
    seconds--;
    cd.textContent = seconds;

    if (seconds <= 0) {
      clearInterval(timer);
      bar.classList.add('hidden');

      await fetch('/admin/pos/confirm',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ order_id: orderId })
      });

      window.location.href = `/admin/pos/receipt/${orderId}`;
    }
  },1000);

  btn.onclick = async () => {
    clearInterval(timer);
    bar.classList.add('hidden');

    await fetch('/admin/pos/undo-temp',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ order_id: orderId })
    });

    window.location.href = '/admin/pos';
  };
}


  /**
   * FINALIZE SALE (CONFIRM DRAFT)
   */
  async function finalizeSale(orderId) {
    await fetch('/admin/pos/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: orderId })
    });

    window.location.href = `/admin/pos/receipt/${orderId}`;
  }


  /* ======================================================
    ADMIN VOID — RECEIPT PAGE ONLY (PIN REQUIRED)
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

  if (receiptRoot && voidModal) {
    const ORDER_ID = receiptRoot.dataset.orderId;

    voidBtn?.addEventListener('click', () => {
      voidModal.classList.remove('hidden');
    });

    cancelVoidBtn?.addEventListener('click', closeVoidModal);

    function closeVoidModal() {
      voidModal.classList.add('hidden');
      pinStage.classList.remove('hidden');
      voidStage.classList.add('hidden');
      pinInputs.forEach(i => (i.value = ''));
      reasonInput.value = '';
      verifiedPin = null;
    }

    pinInputs.forEach((input, i) => {
      input.addEventListener('input', () => {
        if (input.value && pinInputs[i + 1]) {
          pinInputs[i + 1].focus();
        }
      });
    });

    verifyPinBtn?.addEventListener('click', () => {
      const pin = [...pinInputs].map(i => i.value).join('');
      if (pin.length !== 4) return alert('Enter 4-digit PIN');

      verifiedPin = pin;
      pinStage.classList.add('hidden');
      voidStage.classList.remove('hidden');
    });

    confirmVoidBtn?.addEventListener('click', async () => {
      if (!verifiedPin || !reasonInput.value.trim()) {
        return alert('PIN and reason required');
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
        alert('Sale voided');
        window.location.href = '/admin/pos';
      } else {
        alert(data.error || 'Void failed');
      }
    });
  }

  /* ======================================================
   POS PRODUCT CAROUSEL
====================================================== */

const carousel = document.getElementById('posCarousel');
const btnPrev = document.getElementById('carouselPrev');
const btnNext = document.getElementById('carouselNext');

if (carousel && btnPrev && btnNext) {
  const scrollAmount = 320; // ~2 cards

  btnNext.addEventListener('click', () => {
    carousel.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  btnPrev.addEventListener('click', () => {
    carousel.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });
}
