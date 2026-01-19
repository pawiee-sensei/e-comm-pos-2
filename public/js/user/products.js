const cart = JSON.parse(localStorage.getItem('cart') || '[]');

document.querySelectorAll('.u-btn-add').forEach(btn => {
  btn.onclick = () => {
    const id = btn.dataset.id;
    const name = btn.dataset.name;
    const price = Number(btn.dataset.price);

    const existing = cart.find(x => x.id == id);
    if (existing) existing.qty++;
    else cart.push({ id, name, price, qty:1 });

    localStorage.setItem('cart', JSON.stringify(cart));
    alert('Added to cart');
  };
});
