const modalAdd = document.getElementById('modal-add');
const modalAdjust = document.getElementById('modal-adjust');
const backdrop = document.getElementById('modal-backdrop');

let adjustProductId = null;

// ========== OPEN ADD PRODUCT MODAL ==========
document.getElementById('btnAddProduct').addEventListener('click', () => {
  backdrop.classList.remove('hidden');
  modalAdd.classList.remove('hidden');
});

// ========== OPEN ADJUST STOCK MODAL ==========
document.querySelectorAll('.btn-adjust').forEach(btn => {
  btn.addEventListener('click', () => {
    adjustProductId = btn.dataset.id;
    backdrop.classList.remove('hidden');
    modalAdjust.classList.remove('hidden');
  });
});

// ========== SUBMIT ADJUST STOCK ==========
document.getElementById('adjust-submit').onclick = async (e) => {
  e.preventDefault();

  const qty = document.getElementById('adjust-qty').value;
  const type = document.getElementById('adjust-type').value;
  const reason = document.getElementById('adjust-reason').value;

  const r = await fetch('/admin/ajax/stock-adjust', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      product_id: adjustProductId,
      qty,
      type,
      reason
    })
  });

  const j = await r.json();
  if (j.ok) location.reload();
};

// ========== SUBMIT ADD PRODUCT ==========
document.getElementById('add-submit').onclick = async (e) => {
  e.preventDefault();

  const fd = new FormData();
  fd.append('name', document.getElementById('p-name').value);
  fd.append('price', document.getElementById('p-price').value);
  fd.append('stock', document.getElementById('p-stock').value);
  fd.append('category_id', document.getElementById('p-category').value);
  fd.append('image', document.getElementById('p-image').files[0] || null);

  const r = await fetch('/admin/ajax/product-create', {
    method: 'POST',
    body: fd
  });

  const j = await r.json();
  if (j.ok) location.reload();
};

// ========== UNIVERSAL CLOSE HANDLER ==========
function closeModals() {
  modalAdd.classList.add('hidden');
  modalAdjust.classList.add('hidden');
  backdrop.classList.add('hidden');
}

// ========== CLOSE ON CLICKING CANCEL OR X ==========
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', closeModals);
});

// ========== CLOSE ON BACKDROP CLICK ==========
backdrop.addEventListener('click', closeModals);

// ========== CLOSE ON ESC ==========
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModals();
  }
});
