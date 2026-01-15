/* =======================================================
   MODAL ELEMENTS
======================================================= */
const modalAdd   = document.getElementById('modal-add');
const modalAdjust = document.getElementById('modal-adjust');
const modalEdit   = document.getElementById('modal-edit');
const backdrop    = document.getElementById('modal-backdrop');

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

    const categorySelect = document.getElementById('e-category');

    // REAL FIX RIGHT HERE
    const cat = btn.dataset.category;
document.getElementById('e-category').value = String(cat);



    backdrop.classList.remove('hidden');
    modalEdit.classList.remove('hidden');
  });
});


/* =======================================================
   SUBMIT: ADJUST STOCK (LIVE UPDATE, NO RELOAD)
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
      qty, type, reason
    })
  });

  const j = await r.json();
  if (!j || j.ok === false) {
    alert(j?.msg || 'Server error');
    return;
  }

  // LIVE UPDATE ROW
  const row = document.querySelector(`tr[data-id="${adjustProductId}"]`);
  if (row) {
    const tdStock = row.querySelector('.td-stock');
    if (tdStock) tdStock.textContent = j.new_stock;

    const tdStatus = row.querySelector('.td-status span');
    if (tdStatus) {
      tdStatus.className  = 'status ' + j.status.toLowerCase();
      tdStatus.textContent = j.status;
    }
  }

  closeModals();
};

/* =======================================================
   SUBMIT: EDIT PRODUCT (RELOAD FOR NOW)
======================================================= */
document.getElementById('edit-submit').onclick = async (e) => {
  e.preventDefault();

  const fd = new FormData();
  fd.append('id', editProductId);
  fd.append('name', document.getElementById('e-name').value);
  fd.append('price', document.getElementById('e-price').value);
  fd.append('category_id', document.getElementById('e-category').value);

  // optional image replace
  const img = document.getElementById('e-image').files[0];
if (img) fd.append('image', img);


  const r = await fetch('/admin/ajax/product-update', {
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
   SUBMIT: ADD PRODUCT
======================================================= */
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

/* =======================================================
   UNIVERSAL CLOSE HANDLERS
======================================================= */
function closeModals() {
  modalAdd.classList.add('hidden');
  modalAdjust.classList.add('hidden');
  modalEdit.classList.add('hidden');
  backdrop.classList.add('hidden');
}

document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', closeModals);
});

backdrop.addEventListener('click', closeModals);

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeModals();
});
