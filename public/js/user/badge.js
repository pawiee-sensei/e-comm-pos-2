function updateBadge() {
  const badge = document.getElementById('u-cart-badge');
  if (!badge) return;

  let cart = JSON.parse(localStorage.getItem('cart') || '[]');
  const total = cart.reduce((a,b)=>a + (b.qty || 0), 0);

  if(total > 0) {
    badge.textContent = total;
    badge.classList.remove('hidden');
  } else {
    badge.classList.add('hidden');
  }
}

updateBadge();
