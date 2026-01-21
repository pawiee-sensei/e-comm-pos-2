// =============================
// CART BADGE
// =============================
function updateBadge() {
  const badge = document.getElementById('u-cart-badge');
  if (!badge) return;

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((a, b) => a + b.qty, 0);

  if (total > 0) {
    badge.textContent = total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}
updateBadge();


// =============================
// MODAL
// =============================
const modal = document.getElementById('u-modal');
const backdrop = document.getElementById('u-backdrop');

const mImg = document.getElementById('m-image');
const mTitle = document.getElementById('m-title');
const mPrice = document.getElementById('m-price');
const mAdd = document.getElementById('m-add');
const mClose = document.getElementById('m-close');

let currentProduct = null;

document.querySelectorAll('.u-card').forEach(card => {
  card.addEventListener('click', () => {
    currentProduct = {
      id: card.dataset.id,
      name: card.dataset.name,
      price: Number(card.dataset.price),
      image: card.dataset.image
    };

    if (currentProduct.image) {
      mImg.src = '/public/uploads/products/' + currentProduct.image;
    }

    mTitle.textContent = currentProduct.name;
    mPrice.textContent = '₱' + currentProduct.price.toLocaleString();

    modal.classList.remove('hidden');
    backdrop.classList.remove('hidden');
  });
});

mClose.onclick = () => {
  modal.classList.add('hidden');
  backdrop.classList.add('hidden');
};

if (backdrop) {
  backdrop.onclick = () => {
    modal.classList.add('hidden');
    backdrop.classList.add('hidden');
  };
}


// =============================
// ADD TO CART
// =============================
mAdd.onclick = () => {
  if (!currentProduct) return;

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const exists = cart.find(x => x.id == currentProduct.id);

  if (exists) {
    exists.qty++;
  } else {
    cart.push({
      id: currentProduct.id,
      name: currentProduct.name,
      price: currentProduct.price,
      qty: 1
    });
  }

  localStorage.setItem('cart', JSON.stringify(cart));
  updateBadge();
  modal.classList.add('hidden');
  backdrop.classList.add('hidden');
};


// =============================
// SEARCH + CATEGORY FILTER
// =============================
const searchInput = document.getElementById('u-search');
const catSelect = document.getElementById('u-cat');

function filterProducts() {
  const q = searchInput ? searchInput.value.toLowerCase() : '';
  const cat = catSelect ? catSelect.value : 'all';

  document.querySelectorAll('.u-card').forEach(card => {
    const name = card.dataset.name.toLowerCase();
    const cid = card.dataset.category;
    let visible = true;

    if (q && !name.includes(q)) visible = false;
    if (cat !== 'all' && cid !== cat) visible = false;

    card.style.display = visible ? '' : 'none';
  });
}

if (searchInput) searchInput.addEventListener('input', filterProducts);
if (catSelect) catSelect.addEventListener('change', filterProducts);
