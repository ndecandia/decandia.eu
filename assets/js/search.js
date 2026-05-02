(function () {
  const input = document.getElementById('search-input');
  const results = document.getElementById('search-results');
  const overlay = document.getElementById('search-overlay');
  const trigger = document.getElementById('search-trigger');
  const close = document.getElementById('search-close');
  if (!input || !results) return;

  let trips = [];
  let loaded = false;

  function loadIndex() {
    if (loaded) return Promise.resolve();
    return fetch('/trips.json')
      .then(r => r.json())
      .then(data => { trips = data; loaded = true; });
  }

  function score(trip, q) {
    const hay = [
      trip.title, trip.tagline, trip.continent, trip.region, trip.country,
      ...(trip.keywords || [])
    ].join(' ').toLowerCase();
    const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
    let s = 0;
    for (const t of terms) {
      if (!hay.includes(t)) return 0;
      if (trip.title.toLowerCase().includes(t)) s += 5;
      if (trip.country.toLowerCase().includes(t)) s += 3;
      if (trip.region.toLowerCase().includes(t)) s += 2;
      s += 1;
    }
    return s;
  }

  function render(query) {
    if (!query || query.trim().length < 1) {
      results.innerHTML = '<p class="search-hint">Start typing to search by country, region or keyword&hellip;</p>';
      return;
    }
    const ranked = trips
      .map(t => ({ t, s: score(t, query) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);

    if (ranked.length === 0) {
      results.innerHTML = '<p class="search-hint">Nothing matches yet. The journal is still growing.</p>';
      return;
    }

    results.innerHTML = ranked.map(({ t }) => `
      <a class="search-result" href="${t.url}">
        <div class="search-result-img" style="background-image: url('${t.image}');"></div>
        <div class="search-result-body">
          <span class="search-result-region">${t.region} &middot; ${t.country}</span>
          <h4>${t.title}</h4>
          <p>${t.tagline}</p>
        </div>
      </a>
    `).join('');
  }

  function open() {
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
    loadIndex().then(() => {
      setTimeout(() => input.focus(), 50);
      render(input.value);
    });
  }

  function shut() {
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  trigger?.addEventListener('click', open);
  close?.addEventListener('click', shut);
  overlay?.addEventListener('click', e => { if (e.target === overlay) shut(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') shut();
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); open(); }
  });
  input.addEventListener('input', e => render(e.target.value));
})();
