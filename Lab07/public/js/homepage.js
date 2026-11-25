(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const dropdown = byId('languageList');
  const toggle = byId('languageToggle');
  const choices = [...dropdown.querySelectorAll('[data-lang]')];
  const languages = choices.map(choice => choice.dataset.lang);
  const status = byId('translationStatus');
  const original = Object.create(null);
  const bindings = [];

  // Keep the DOM structure and handlers intact, including icons inside translated links.
  for (const attr of [null, 'title', 'alt', 'aria-label', 'content']) {
    const marker = attr ? 'data-i18n-' + attr : 'data-i18n';
    for (const node of document.querySelectorAll('[' + marker + ']')) {
      const key = node.getAttribute(marker);
      const prefix = attr ? '' : node.dataset.prefix || '';
      const value = (attr ? node.getAttribute(attr) : node.textContent).trim();
      original[key] = prefix && value.startsWith(prefix) ? value.slice(prefix.length) : value;
      bindings.push({node, attr, key, prefix});
    }
  }

  let messages = original;
  let displayed = 'vi';
  let requestId = 0;
  let controller;
  const numbers = document.querySelectorAll('[data-number]');
  const faqItems = document.querySelectorAll('.faq-item');

  function apply(lang, entries) {
    for (const key of Object.keys(original)) {
      if (typeof entries[key] !== 'string' || !entries[key].trim()) throw Error('google_error');
    }
    for (const {node, attr, key, prefix} of bindings) {
      if (attr) node.setAttribute(attr, entries[key]);
      else node.textContent = prefix + entries[key];
    }
    for (const number of numbers) {
      number.textContent = new Intl.NumberFormat(lang).format(Number(number.dataset.number));
    }
    displayed = lang;
    messages = entries;
    document.documentElement.lang = lang;
    byId('languageCode').textContent = lang.toUpperCase();
    for (const choice of choices) choice.setAttribute('aria-pressed', String(choice.dataset.lang === lang));
    resizeOpenAnswer();
    try { localStorage.setItem('lab07.lang', lang); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(history.state, '', url);
    for (const anchor of document.querySelectorAll('a[href^="index.html"]')) {
      const home = new URL(anchor.href);
      home.searchParams.set('lang', lang);
      anchor.href = home.pathname + home.search + home.hash;
    }
  }

  async function selectLanguage(lang) {
    const id = ++requestId;
    if (controller) controller.abort();
    controller = new AbortController();
    status.textContent = '';
    if (lang === 'vi') {
      apply('vi', original);
      return;
    }
    if (lang === displayed) return;
    status.textContent = messages['status.loading'];
    toggle.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/translate/homepage', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({target: lang}),
        signal: controller.signal,
        cache: 'no-store'
      });
      const result = await response.json();
      if (id !== requestId) return;
      if (!response.ok) throw Error(result.error || 'google_error');
      if (result.target !== lang) throw Error('google_error');
      apply(lang, result.translations);
      status.textContent = '';
    } catch (error) {
      if (id !== requestId) return;
      const known = messages['status.' + error.message];
      status.textContent = known || messages['status.network'];
      // A direct link to an unavailable language must describe the page actually shown.
      const url = new URL(location.href);
      if (url.searchParams.has('lang')) {
        url.searchParams.set('lang', displayed);
        history.replaceState(history.state, '', url);
      }
    } finally {
      if (id === requestId) toggle.removeAttribute('aria-busy');
    }
  }

  function showChoices(show, focus = false) {
    dropdown.hidden = !show;
    toggle.setAttribute('aria-expanded', String(show));
    if (focus) {
      if (show) choices.find(choice => choice.dataset.lang === displayed).focus();
      else toggle.focus();
    }
  }

  toggle.addEventListener('click', () => showChoices(dropdown.hidden, true));
  toggle.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      showChoices(true, true);
    }
  });
  dropdown.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      showChoices(false, true);
      return;
    }
    const index = choices.indexOf(document.activeElement);
    const jumps = {ArrowDown: (index + 1) % choices.length,
                   ArrowUp: (index + choices.length - 1) % choices.length, Home: 0, End: choices.length - 1};
    if (Object.hasOwnProperty.call(jumps, event.key)) {
      event.preventDefault();
      choices[jumps[event.key]].focus();
    }
  });
  for (const choice of choices) {
    choice.addEventListener('click', () => {
      showChoices(false, true);
      toggle.removeAttribute('aria-busy');
      selectLanguage(choice.dataset.lang);
    });
  }
  const languageMenu = toggle.parentElement;
  document.addEventListener('click', event => {
    if (!languageMenu.contains(event.target)) showChoices(false);
  });
  languageMenu.addEventListener('focusout', event => {
    if (!languageMenu.contains(event.relatedTarget)) showChoices(false);
  });

  function resizeOpenAnswer() {
    for (const item of faqItems) {
      const answer = item.querySelector('.faq-answer');
      answer.style.maxHeight = item.classList.contains('active') ? answer.scrollHeight + 'px' : '';
    }
  }
  for (const item of faqItems) {
    item.querySelector('.faq-question').addEventListener('click', () => {
      const open = !item.classList.contains('active');
      for (const other of faqItems) {
        const selected = other === item && open;
        other.classList.toggle('active', selected);
        other.querySelector('.faq-question').setAttribute('aria-expanded', String(selected));
      }
      resizeOpenAnswer();
    });
  }
  window.addEventListener('resize', resizeOpenAnswer);

  const hamburger = byId('hamburgerBtn');
  const mobileNav = byId('mobileNavDropdown');
  function setMobileMenu(open) {
    mobileNav.classList.toggle('open', open);
    byId('hamburgerIcon').className = open ? 'fa-solid fa-xmark' : 'fa-solid fa-bars';
    hamburger.setAttribute('aria-expanded', String(open));
  }
  hamburger.addEventListener('click', () => setMobileMenu(!mobileNav.classList.contains('open')));
  document.addEventListener('click', event => {
    if (!hamburger.contains(event.target) && !mobileNav.contains(event.target)) setMobileMenu(false);
  });

  function showMetrics() {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.querySelectorAll('.metric-donut-num').forEach((number, index) => {
      const value = Number(number.dataset.target);
      const canvas = byId('metricChart' + index);
      // Four decorative rings need no third-party runtime or network connection.
      const context = canvas.getContext('2d');
      const start = performance.now();
      function draw(time) {
        const progress = reduceMotion ? 1 : Math.min(1, (time - start) / 1200);
        const fraction = 1 - (1 - progress) ** 3;
        const radius = canvas.width * 0.43;
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.lineWidth = canvas.width * 0.13;
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
        context.strokeStyle = '#F1F5F9';
        context.stroke();
        context.beginPath();
        context.arc(canvas.width / 2, canvas.height / 2, radius,
                    -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * value * fraction / 100);
        context.strokeStyle = colors[index];
        context.stroke();
        number.textContent = Math.round(value * fraction).toLocaleString(displayed);
        if (progress < 1) requestAnimationFrame(draw);
      }
      requestAnimationFrame(draw);
    });
  }
  const metrics = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting)) {
      metrics.disconnect();
      showMetrics();
    }
  }, {threshold: 0.1});
  metrics.observe(document.querySelector('.metrics-section'));

  const install = byId('btnHeaderInstallApp');
  const guide = byId('installGuide');
  let deferredInstall;
  if (matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    document.documentElement.classList.add('is-pwa-standalone');
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredInstall = event;
  });
  window.addEventListener('appinstalled', () => {
    deferredInstall = null;
    document.documentElement.classList.add('is-pwa-standalone');
  });
  install.addEventListener('click', async () => {
    if (deferredInstall) {
      const prompt = deferredInstall;
      deferredInstall = null;
      await prompt.prompt();
      return;
    }
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const platform = ios ? 'ios' : /Android/.test(ua) ? 'android' : 'desktop';
    for (const text of guide.querySelectorAll('[data-platform]')) text.hidden = text.dataset.platform !== platform;
    guide.showModal();
  });
  guide.addEventListener('click', e => { if (e.target === guide) guide.close(); });
  if ('serviceWorker' in navigator) {
    const controlled = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (controlled) byId('homeUpdate').hidden = false; });
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  byId('reloadHome').addEventListener('click', () => location.reload());
  byId('hideUpdate').addEventListener('click', () => { byId('homeUpdate').hidden = true; });

  const requested = new URL(location.href).searchParams.get('lang') || (() => {
    try { return localStorage.getItem('lab07.lang'); } catch { return null; }
  })();
  if (languages.includes(requested) && requested !== 'vi') selectLanguage(requested);
})();
