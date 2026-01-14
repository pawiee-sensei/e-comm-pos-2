const modalAdd = document.getElementById('modal-add');
const modalAdjust = document.getElementById('modal-adjust');
const backdrop = document.getElementById('modal-backdrop');

let adjustProductId = null;

/* ========== OPEN ADD PRODUCT MODAL ========== */
document.getElementById('btnAddProduct').addEventListener('click', () => {
  backdrop.classList.remove('hidden');
  modalAdd.classList.remove('hidden');
});

/* ========== OPEN ADJUST MODAL ========== */
document.querySelectorAll('.btn-adjust').forEach(btn => {
  btn.addEventListener('click', () => {
    adjustProductId = btn.dataset.id;
    backdrop.classList.remove('hidden');
    modalAdjust.classList.remove('hidden');
  });
});

/* ===============================================
   SUBMIT ADJUST STOCK — LIVE (NO PAGE RELOAD)
================================================ */
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

  if (!j.ok) {
    alert(j.msg || 'Error');
    return;
  }

  /* ====== LIVE UPDATE TABLE ROW ====== */
  const row = document.querySelector(`tr[data-id="${adjustProductId}"]`);
  if (row) {
    // update stock cell
    const tdStock = row.querySelector('.td-stock');
    if (tdStock) tdStock.textContent = j.new_stock;

    // update status badge
    const tdStatus = row.querySelector('.td-status span');
    if (tdStatus) {
      tdStatus.className = 'status ' + j.status.toLowerCase();
      tdStatus.textContent = j.status;
    }
  }

  closeModals();
};


/* ===============================================
   SUBMIT ADD PRODUCT — CURRENTLY RELOAD
   (Later can be made live-updating)
================================================ */
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
  if (j.ok) {
    location.reload();
  }
};

/* ========== UNIVERSAL MODAL CLOSE ========== */
function closeModals() {
  modalAdd.classList.add('hidden');
  modalAdjust.classList.add('hidden');
  backdrop.classList.add('hidden');
}

/* ========== CLOSE ON CANCEL ========== */
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', closeModals);
});

/* ========== CLOSE ON BACKDROP CLICK ========== */
backdrop.addEventListener('click', closeModals);

/* ========== CLOSE ON ESCAPE KEY ========== */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModals();
});
