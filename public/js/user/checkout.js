const mode = document.getElementById('payment_mode');
const gcashBox = document.getElementById('gcash-box');
const cartField = document.getElementById('cart_json');

mode.onchange = () => {
  if (mode.value === 'GCASH') {
    gcashBox.classList.remove('hidden');
  } else {
    gcashBox.classList.add('hidden');
  }
};

// attach cart
const cart = JSON.parse(localStorage.getItem('cart') || '[]');
cartField.value = JSON.stringify(cart);
