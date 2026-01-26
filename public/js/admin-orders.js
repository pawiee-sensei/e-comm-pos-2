const search = document.getElementById('orderSearch');

let t;
search.addEventListener('input', () => {
  clearTimeout(t);
  t = setTimeout(() => {
    const q = search.value.trim();
    const url = new URL(window.location);
    if (q) url.searchParams.set('q', q);
    else url.searchParams.delete('q');
    window.location = url.toString();
  }, 400);
});
