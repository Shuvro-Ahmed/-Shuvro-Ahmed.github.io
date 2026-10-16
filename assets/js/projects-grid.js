/* Projects-only pagination. Every project remains in the static HTML.
   Search and category filters always run before pagination, over the entire collection. */
'use strict';
(() => {
  const browser = document.querySelector('[data-project-browser]');
  if (!browser) return;
  const grid = browser.querySelector('#projects-grid');
  const items = Array.from(browser.querySelectorAll('[data-collection-item]'));
  const filters = Array.from(browser.querySelectorAll('[data-collection-filter]'));
  const search = browser.querySelector('[data-collection-search]');
  const count = browser.querySelector('[data-collection-count]');
  const empty = browser.querySelector('[data-collection-empty]');
  const resetButton = browser.querySelector('[data-collection-reset]');
  const pageSizeControl = browser.querySelector('[data-page-size-control]');
  const pagination = browser.querySelector('[data-project-pagination]');
  const pagePosition = browser.querySelector('[data-page-position]');
  const numbers = browser.querySelector('[data-page-numbers]');
  const previous = browser.querySelector('[data-page-previous]');
  const next = browser.querySelector('[data-page-next]');
  if (!grid || !search || !pageSizeControl || !pagination || !numbers || !previous || !next) return;

  const categories = new Set(filters.map(button => button.dataset.collectionFilter));
  const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase().trim();
  let active = 'All';
  let currentPage = 1;
  let pageSize = browser.dataset.pageSize || '8';
  let pageCount = 1;
  let lastWidth = 0;
  let resizeFrame = 0;

  function restoreState() {
    const params = new URLSearchParams(window.location.search);
    active = categories.has(params.get('category')) ? params.get('category') : 'All';
    search.value = params.get('q') || '';
    pageSize = ['8', '16', 'all'].includes(params.get('show')) ? params.get('show') : '8';
    pageSizeControl.value = pageSize;
    const candidate = Number(params.get('page') || 1);
    currentPage = Number.isSafeInteger(candidate) && candidate > 0 ? candidate : 1;
  }

  function saveState(replace) {
    try {
      const address = new URL(window.location.href);
      const values = {
        q: search.value.trim(),
        category: active === 'All' ? '' : active,
        show: pageSize === '8' ? '' : pageSize,
        page: currentPage === 1 ? '' : String(currentPage)
      };
      Object.entries(values).forEach(([key, value]) => {
        if (value) address.searchParams.set(key, value);
        else address.searchParams.delete(key);
      });
      if (address.href !== window.location.href) {
        window.history[replace ? 'replaceState' : 'pushState'](null, '', address.href);
      }
    } catch (_) { /* Local file previews may restrict the History API; browsing still works. */ }
  }

  function measureCards() {
    /* Measure all cards at this width, not just the current page. This keeps every
       card the same height across page changes without truncating any text. */
    if (!items.length || grid.getBoundingClientRect().width === 0) return;
    const visibility = items.map(item => item.hidden);
    const oldGridHidden = grid.hidden;
    grid.hidden = false;
    grid.style.removeProperty('--project-card-height');
    browser.style.removeProperty('--project-result-height');
    items.forEach(item => { item.hidden = false; });
    const resultRows = Array.from(grid.querySelectorAll('.project-result'));
    if (resultRows.length) {
      const resultHeight = Math.ceil(Math.max(...resultRows.map(row => row.getBoundingClientRect().height)));
      browser.style.setProperty('--project-result-height', `${resultHeight}px`);
    }
    const height = Math.ceil(Math.max(...items.map(item => item.getBoundingClientRect().height)));
    if (height > 0) grid.style.setProperty('--project-card-height', `${height}px`);
    items.forEach((item, index) => { item.hidden = visibility[index]; });
    grid.hidden = oldGridHidden;
  }

  function pageNumbers() {
    const visible = new Set([1, pageCount, currentPage - 1, currentPage, currentPage + 1]);
    if (pageCount <= 7) for (let i = 1; i <= pageCount; i += 1) visible.add(i);
    numbers.replaceChildren();
    let last = 0;
    [...visible].filter(i => i >= 1 && i <= pageCount).sort((a, b) => a - b).forEach(i => {
      if (last && i - last > 1) {
        const dots = document.createElement('span');
        dots.className = 'pagination-ellipsis';
        dots.textContent = '…';
        dots.setAttribute('aria-hidden', 'true');
        numbers.appendChild(dots);
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pagination-button';
      button.dataset.pageNumber = String(i);
      button.textContent = String(i);
      button.setAttribute('aria-label', `Page ${i}`);
      button.setAttribute('aria-controls', 'projects-grid');
      if (i === currentPage) button.setAttribute('aria-current', 'page');
      numbers.appendChild(button);
      last = i;
    });
  }

  function render() {
    const query = normalize(search.value);
    const terms = query.split(/\s+/).filter(Boolean);
    const matched = items.filter(item =>
      (active === 'All' || item.dataset.category === active) &&
      terms.every(term => normalize(item.dataset.search || '').includes(term))
    );
    const size = pageSize === 'all' ? Math.max(matched.length, 1) : Number(pageSize);
    pageCount = Math.max(1, Math.ceil(matched.length / size));
    currentPage = Math.min(Math.max(currentPage, 1), pageCount);
    const start = (currentPage - 1) * size;
    const visible = new Set(matched.slice(start, start + size));
    items.forEach(item => { item.hidden = !visible.has(item); });
    filters.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.collectionFilter === active)));
    if (empty) empty.hidden = matched.length !== 0;
    const filtered = active !== 'All' || query !== '';
    if (count) {
      count.textContent = matched.length === 0 ? '0 projects found' :
        `${start + 1}–${Math.min(start + size, matched.length)} of ${matched.length}${filtered ? ' matching' : ''} project${matched.length === 1 ? '' : 's'}`;
    }
    pagination.hidden = pageCount <= 1;
    if (pagePosition) pagePosition.textContent = `Page ${currentPage} of ${pageCount}`;
    previous.disabled = currentPage === 1;
    next.disabled = currentPage === pageCount;
    pageNumbers();
  }

  function changePage(page) {
    if (page === currentPage || page < 1 || page > pageCount) return;
    currentPage = page;
    render();
    saveState(false);
    /* Move the keyboard and viewport to the new results, including on short final pages. */
    grid.focus({ preventScroll: true });
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    grid.scrollIntoView({ block: 'start', behavior: reduced ? 'instant' : 'smooth' });
  }

  filters.forEach(button => button.addEventListener('click', () => {
    active = button.dataset.collectionFilter || 'All';
    currentPage = 1;
    render();
    saveState(false);
  }));
  search.addEventListener('input', () => {
    currentPage = 1;
    render();
    saveState(true);
  });
  pageSizeControl.addEventListener('change', () => {
    pageSize = pageSizeControl.value;
    currentPage = 1;
    render();
    saveState(false);
  });
  resetButton?.addEventListener('click', () => {
    active = 'All';
    search.value = '';
    currentPage = 1;
    render();
    saveState(false);
    search.focus({ preventScroll: true });
  });
  previous.addEventListener('click', () => changePage(currentPage - 1));
  next.addEventListener('click', () => changePage(currentPage + 1));
  numbers.addEventListener('click', event => {
    const button = event.target.closest('[data-page-number]');
    if (button) changePage(Number(button.dataset.pageNumber));
  });
  window.addEventListener('popstate', () => { restoreState(); render(); });

  restoreState();
  measureCards();
  render();
  saveState(true);
  lastWidth = grid.getBoundingClientRect().width;
  const queueMeasure = () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      const width = grid.getBoundingClientRect().width;
      if (Math.abs(width - lastWidth) > .5) {
        lastWidth = width;
        measureCards();
      }
    });
  };
  if ('ResizeObserver' in window) new ResizeObserver(queueMeasure).observe(grid);
  else window.addEventListener('resize', queueMeasure);
  document.fonts?.ready.then(measureCards);
})();
