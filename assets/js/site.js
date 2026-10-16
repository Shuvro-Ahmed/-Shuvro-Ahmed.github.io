/* Progressive enhancement. All navigation and academic content are static HTML. */
'use strict';
(() => {
  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll('[data-theme-toggle]')];
  function setTheme(theme) {
    root.dataset.theme = theme;
    for (const button of themeButtons) {
      button.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark';
      button.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`);
    }
    try { localStorage.setItem('shuvro-theme', theme); } catch (_) { /* Storage can be unavailable. */ }
  }
  let saved = 'light';
  try { saved = localStorage.getItem('shuvro-theme') || 'light'; } catch (_) {}
  setTheme(saved === 'dark' ? 'dark' : 'light');
  themeButtons.forEach(button => button.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark')));

  const menu = document.querySelector('[data-menu-toggle]');
  const nav = document.querySelector('#site-navigation');
  if (menu && nav) {
    const closeMenu = () => { nav.classList.remove('is-open'); menu.setAttribute('aria-expanded', 'false'); menu.textContent = 'Menu'; };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      menu.setAttribute('aria-expanded', String(open));
      menu.textContent = open ? 'Close' : 'Menu';
      nav.classList.toggle('is-open', open);
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeMenu(); menu.focus(); }
    });
    document.addEventListener('click', event => { if (!event.target.closest('.sidebar')) closeMenu(); });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
    window.matchMedia('(min-width: 961px)').addEventListener('change', event => { if (event.matches) closeMenu(); });
  }

  for (const collection of document.querySelectorAll('[data-collection]')) {
    const items = [...collection.querySelectorAll('[data-collection-item]')];
    const filters = [...collection.querySelectorAll('[data-collection-filter]')];
    const search = collection.querySelector('[data-collection-search]');
    const count = collection.querySelector('[data-collection-count]');
    const empty = collection.querySelector('[data-collection-empty]');
    const resetButton = collection.querySelector('[data-collection-reset]');
    let active = 'All';

    const updateCollection = () => {
      const query = (search?.value || '').trim().toLowerCase();
      let shown = 0;
      for (const item of items) {
        const category = item.dataset.category || '';
        const haystack = item.dataset.search || '';
        const matchesFilter = active === 'All' || category === active;
        const matchesSearch = !query || haystack.includes(query);
        item.hidden = !(matchesFilter && matchesSearch);
        if (!item.hidden) shown += 1;
      }
      if (count) count.textContent = shown === items.length ? `${shown} projects` : `${shown} of ${items.length} projects`;
      for (const group of collection.querySelectorAll('[data-project-group]')) {
        group.hidden = ![...group.querySelectorAll('[data-collection-item]')].some(item => !item.hidden);
      }
      if (empty) empty.hidden = shown !== 0;
    };

    const resetCollection = () => {
      active = 'All';
      if (search) search.value = '';
      for (const button of filters) {
        button.setAttribute('aria-pressed', String(button.dataset.collectionFilter === 'All'));
      }
      updateCollection();
    };

    for (const button of filters) {
      button.addEventListener('click', () => {
        active = button.dataset.collectionFilter || 'All';
        for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
        updateCollection();
      });
    }
    search?.addEventListener('input', updateCollection);
    resetButton?.addEventListener('click', resetCollection);
    if (items.length) updateCollection();
  }

  for (const button of document.querySelectorAll('[data-copy-email]')) button.addEventListener('click', async () => {
    const email = button.dataset.copyEmail;
    const status = document.querySelector('#copy-status');
    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(email); copied = true; }
      else {
        const input = document.createElement('textarea');
        input.value = email;
        input.setAttribute('aria-label', 'Email address to copy');
        input.style.cssText = 'position:fixed;left:-9999px;top:0';
        document.body.appendChild(input); input.select(); copied = document.execCommand('copy'); input.remove(); button.focus();
      }
    } catch (_) { copied = false; }
    if (status) status.textContent = copied ? 'Email address copied.' : 'Copy unavailable. Select the email address above, or use “Email me”.';
  });
})();
