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

  const cards = [...document.querySelectorAll('[data-project]')];
  const filters = [...document.querySelectorAll('[data-filter]')];
  const search = document.querySelector('[data-project-search]');
  const count = document.querySelector('[data-project-count]');
  const empty = document.querySelector('[data-no-projects]');
  let active = 'All';
  function updateProjects() {
    const query = (search?.value || '').trim().toLowerCase();
    let shown = 0;
    for (const card of cards) {
      const matches = (active === 'All' || card.dataset.category === active) && card.dataset.search.includes(query);
      card.hidden = !matches;
      if (matches) shown++;
    }
    if (count) count.textContent = `${shown} of ${cards.length} projects`;
    if (empty) empty.hidden = shown !== 0;
  }
  for (const button of filters) button.addEventListener('click', () => {
    active = button.dataset.filter;
    for (const item of filters) item.setAttribute('aria-pressed', String(item === button));
    updateProjects();
  });
  search?.addEventListener('input', updateProjects);
  if (cards.length) updateProjects();

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
