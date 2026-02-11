/* =======================================================
   MODAL ELEMENTS
======================================================= */
const modalAdd     = document.getElementById('modal-add');
const modalAdjust  = document.getElementById('modal-adjust');
const modalEdit    = document.getElementById('modal-edit');
const backdrop     = document.getElementById('modal-backdrop');

/* =======================================================
   STATE
======================================================= */
let adjustProductId = null;
let editProductId   = null;

/* =======================================================
   OPEN: ADD PRODUCT MODAL
======================================================= */
document.getElementById('btnAddProduct')?.addEventListener('click', () => {
  backdrop.classList.remove('hidden');
  modalAdd.classList.remove('hidden');
});

/* =======================================================
   OPEN: ADJUST STOCK MODAL
======================================================= */
document.querySelectorAll('.btn-adjust').forEach(btn => {
  btn.addEventListener('click', () => {
    adjustProductId = btn.dataset.id;
    backdrop.classList.remove('hidden');
    modalAdjust.classList.remove('hidden');
  });
});

/* =======================================================
   OPEN: EDIT PRODUCT MODAL
======================================================= */
document.querySelectorAll('.btn-edit').forEach(btn => {
  btn.addEventListener('click', () => {

    editProductId = btn.dataset.id;

    document.getElementById('e-name').value = btn.dataset.name || '';
    document.getElementById('e-price').value = btn.dataset.price || '';
    document.getElementById('e-category').value = String(btn.dataset.category || '');

    backdrop.classList.remove('hidden');
    modalEdit.classList.remove('hidden');
  });
});

/* =======================================================
   SUBMIT: ADJUST STOCK
======================================================= */
document.getElementById('adjust-submit').onclick = async (e) => {
  e.preventDefault();

  const qty    = document.getElementById('adjust-qty').value;
  const type   = document.getElementById('adjust-type').value;
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
    alert(j.msg || 'Server error');
    return;
  }

  // reload to refresh BOTH logs
  location.reload();
};





/* =======================================================
   SUBMIT: EDIT PRODUCT (SERVER FORM SUBMIT)
======================================================= */
/* =======================================================
   SUBMIT: EDIT PRODUCT (AJAX + LIVE UPDATE)
======================================================= */
document.getElementById('edit-submit').onclick = async (e) => {
  e.preventDefault();

  const fd = new FormData();
  fd.append('id', editProductId);
  fd.append('name', document.getElementById('e-name').value);
  fd.append('price', document.getElementById('e-price').value);
  fd.append('category_id', document.getElementById('e-category').value);
  const img = document.getElementById('e-image').files[0];
  if (img) fd.append('image', img);

  const r = await fetch('/admin/ajax/product-update', { method:'POST', body: fd });
  const j = await r.json();
  if (!j.ok) return alert(j.msg || 'Server error');

  // LIVE UPDATE TABLE
  const row = document.querySelector(`tr[data-id="${editProductId}"]`);
  if (row) {
    row.querySelector('.p-name').textContent = j.updated.name;
    row.querySelector('.td-stock').textContent = j.updated.stock;
    row.querySelector('td:nth-child(5)').textContent = '₱' + j.updated.price;
  }

  // reload logs but not table
  location.reload();
};


/* =======================================================
   SUBMIT: ADD PRODUCT (AJAX, THEN RELOAD)
======================================================= */
document.getElementById('add-submit').onclick = async (e) => {
  e.preventDefault();

  const fd = new FormData();

  fd.append('name', document.getElementById('p-name').value);
  fd.append('price', document.getElementById('p-price').value);
  fd.append('cost', document.getElementById('p-cost').value);   // ✅ ADD THIS
  fd.append('stock', document.getElementById('p-stock').value);
  fd.append('category_id', document.getElementById('p-category').value);

  const img = document.getElementById('p-image').files[0];
  if (img) fd.append('image', img);

  const r = await fetch('/admin/ajax/product-create', {
    method: 'POST',
    body: fd
  });

  const j = await r.json();
  if (!j.ok) {
    alert(j.msg || 'Server error');
    return;
  }

  location.reload();
};




/* =======================================================
   UNIVERSAL CLOSE HANDLERS
======================================================= */
function closeModals() {
  modalAdd?.classList.add('hidden');
  modalAdjust?.classList.add('hidden');
  modalEdit?.classList.add('hidden');
  backdrop?.classList.add('hidden');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', closeModals);
});

backdrop?.addEventListener('click', closeModals);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModals();
});
