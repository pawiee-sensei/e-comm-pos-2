const sidebar = document.querySelector('.sidebar');
const toggle = document.getElementById('sb-toggle');

toggle.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
});
