(function(){

  const search = document.getElementById('u-search');
  const cat = document.getElementById('u-cat');
  const grid = document.getElementById('u-grid');
  if(!grid) return;

  const cards = Array.from(grid.querySelectorAll('.u-card'));

  function applyFilter(){
    const q = search.value.trim().toLowerCase();
    const c = cat.value;

    cards.forEach(card => {
      const name = card.dataset.name.toLowerCase();
      const category = card.dataset.cat;

      let visible = true;

      // name filter
      if(q && !name.includes(q)) visible = false;

      // category filter
      if(c !== 'all' && c !== category) visible = false;

      card.style.display = visible ? '' : 'none';
    });
  }

  // live search + live category
  search.addEventListener('input', applyFilter);
  cat.addEventListener('change', applyFilter);

})();
