(() => {
  'use strict';

  const STORAGE_KEY = 'lab07.lang';
  const SUPPORTED = ['vi', 'en', 'ja', 'ko'];
  let displayed = 'vi';
  let requestId = 0;
  let controller = null;
  let originalsByText = null;
  let trackedNodes = [];
  let trackedAttrs = [];
  let cachedMessages = null;

  const FALLBACK_MSGS = {
    'ui.status.loading': 'Đang dịch giao diện…',
    'ui.status.missing_key': 'Chưa cấu hình khóa Google Dịch. Hãy điền khóa vào tệp .env của Lab07 và khởi động lại máy chủ.',
    'ui.status.quota': 'Đã hết hạn mức dịch. Hãy thử lại sau hoặc kiểm tra hạn mức Google Cloud.',
    'ui.status.google_denied': 'Google chưa cấp quyền dịch. Hãy kiểm tra khóa và cấu hình Cloud Translation.',
    'ui.status.network': 'Không kết nối được dịch vụ dịch. Hãy kiểm tra mạng rồi thử lại.',
    'ui.status.google_error': 'Dịch vụ dịch chưa trả về kết quả. Hãy thử chọn lại ngôn ngữ.',
  };

  function createLanguageWidget(compact = false) {
    const wrap = document.createElement('div');
    wrap.className = 'language lab-lang-widget' + (compact ? ' is-compact' : '');
    wrap.innerHTML = `
      <button aria-controls="languageList" aria-expanded="false" aria-label="Chọn ngôn ngữ" class="nav-btn lab-lang-btn" id="languageToggle" type="button">
        <span aria-hidden="true">🌐</span> <span id="languageLabel">${compact ? '' : 'Ngôn ngữ'}</span><span id="languageCode" translate="no">VI</span>
      </button>
      <div aria-labelledby="languageToggle" hidden="" id="languageList">
        <button aria-pressed="true" data-lang="vi" lang="vi" translate="no" type="button">Tiếng Việt</button>
        <button aria-pressed="false" data-lang="en" lang="en" translate="no" type="button">English</button>
        <button aria-pressed="false" data-lang="ja" lang="ja" translate="no" type="button">日本語</button>
        <button aria-pressed="false" data-lang="ko" lang="ko" translate="no" type="button">한국어</button>
      </div>
    `;
    return wrap;
  }

  function mountWidget() {
    if (document.getElementById('languageToggle')) return;

    let widget = null;
    const navContainer = document.querySelector('.header .nav-container');
    const hamburger = document.getElementById('hamburgerBtn');
    const calHeaderRight = document.querySelector('.cal-header-right');
    const demoHeader = document.querySelector('.calendar-header');
    const invoiceBar = document.querySelector('.controls-bar');
    const tutorMobileActions = document.querySelector('.tutor-mobile-header .mobile-header-actions');
    const tutorSidebarFooter = document.querySelector('.tutor-sidebar-footer');

    if (navContainer) {
      widget = createLanguageWidget(false);
      if (hamburger) navContainer.insertBefore(widget, hamburger);
      else navContainer.appendChild(widget);
    } else if (calHeaderRight) {
      widget = createLanguageWidget(false);
      calHeaderRight.appendChild(widget);
    } else if (demoHeader) {
      widget = createLanguageWidget(false);
      widget.classList.add('is-dark-surface');
      const rightBox = demoHeader.lastElementChild;
      if (rightBox) {
        rightBox.style.display = 'flex';
        rightBox.style.alignItems = 'center';
        rightBox.style.gap = '10px';
        rightBox.style.flexWrap = 'wrap';
        rightBox.prepend(widget);
      } else {
        demoHeader.appendChild(widget);
      }
    } else if (invoiceBar) {
      widget = createLanguageWidget(false);
      invoiceBar.appendChild(widget);
    } else if (tutorSidebarFooter) {
      // Mount in sidebar footer (desktop) and mobile header actions (mobile)
      widget = createLanguageWidget(false);
      widget.classList.add('in-sidebar');
      tutorSidebarFooter.prepend(widget);
      if (tutorMobileActions) {
        const mobBtn = document.createElement('button');
        mobBtn.type = 'button';
        mobBtn.className = 'mobile-action-btn';
        mobBtn.title = 'Chọn ngôn ngữ';
        mobBtn.setAttribute('aria-label', 'Chọn ngôn ngữ');
        mobBtn.innerHTML = '<span>🌐</span>';
        mobBtn.addEventListener('click', ev => {
          ev.stopPropagation();
          const list = document.getElementById('languageList');
          if (list) list.hidden = !list.hidden;
        });
        tutorMobileActions.prepend(mobBtn);
      }
    }

    if (!document.getElementById('translationStatus')) {
      const status = document.createElement('div');
      status.id = 'translationStatus';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      status.setAttribute('aria-atomic', 'true');
      document.body.appendChild(status);
    }
  }

  function indexStaticUiNodes(originals) {
    if (originalsByText) return;
    originalsByText = new Map();
    for (const [key, viText] of Object.entries(originals)) {
      const norm = viText.trim();
      if (norm && !originalsByText.has(norm)) originalsByText.set(norm, key);
    }
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.parentElement) return NodeFilter.FILTER_REJECT;
        if (node.parentElement.closest('#languageList, script, style, textarea, [contenteditable], #translationStatus')) {
          return NodeFilter.FILTER_REJECT;
        }
        const trimmed = node.nodeValue.trim();
        if (!trimmed || !originalsByText.has(trimmed)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let cur;
    while ((cur = walker.nextNode())) {
      const raw = cur.nodeValue;
      const trimmed = raw.trim();
      const lead = raw.slice(0, raw.indexOf(trimmed));
      const trail = raw.slice(raw.indexOf(trimmed) + trimmed.length);
      trackedNodes.push({ node: cur, key: originalsByText.get(trimmed), lead, trail });
    }
    for (const el of document.querySelectorAll('[placeholder], [title], [aria-label]')) {
      for (const attr of ['placeholder', 'title', 'aria-label']) {
        const val = (el.getAttribute(attr) || '').trim();
        if (val && originalsByText.has(val)) {
          trackedAttrs.push({ el, attr, key: originalsByText.get(val) });
        }
      }
    }
  }

  function applyTranslations(lang, translations, originals) {
    indexStaticUiNodes(originals);
    for (const item of trackedNodes) {
      const next = translations[item.key];
      if (typeof next === 'string' && next.trim()) {
        item.node.nodeValue = item.lead + next + item.trail;
      }
    }
    for (const item of trackedAttrs) {
      const next = translations[item.key];
      if (typeof next === 'string' && next.trim()) {
        item.el.setAttribute(item.attr, next);
      }
    }
    displayed = lang;
    cachedMessages = translations;
    document.documentElement.lang = lang;
    const codeEl = document.getElementById('languageCode');
    if (codeEl) codeEl.textContent = lang.toUpperCase();
    for (const btn of document.querySelectorAll('#languageList [data-lang]')) {
      btn.setAttribute('aria-pressed', String(btn.dataset.lang === lang));
    }
    try { localStorage.setItem(STORAGE_KEY, lang); } catch {}
    const url = new URL(location.href);
    url.searchParams.set('lang', lang);
    history.replaceState(history.state, '', url);
  }

  async function selectLanguage(lang) {
    if (!SUPPORTED.includes(lang)) return;
    const id = ++requestId;
    if (controller) controller.abort();
    controller = new AbortController();
    const status = document.getElementById('translationStatus');
    const toggle = document.getElementById('languageToggle');
    if (status) status.textContent = '';

    if (lang === 'vi' && originalsByText) {
      // Restore Vietnamese offline immediately once originals have been indexed.
      const viMap = {};
      for (const [text, key] of originalsByText.entries()) viMap[key] = text;
      applyTranslations('vi', viMap, viMap);
      return;
    }
    if (lang === displayed && lang !== 'vi') return;
    if (status) status.textContent = (cachedMessages && cachedMessages['ui.status.loading']) || FALLBACK_MSGS['ui.status.loading'];
    toggle?.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/translate/ui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target: lang }),
        signal: controller.signal,
        cache: 'no-store',
      });
      const result = await response.json();
      if (id !== requestId) return;
      if (!response.ok) throw Error(result.error || 'google_error');
      applyTranslations(lang, result.translations, result.originals);
      if (status) status.textContent = '';
    } catch (error) {
      if (id !== requestId) return;
      const msgKey = 'ui.status.' + error.message;
      const text = (cachedMessages && cachedMessages[msgKey]) || FALLBACK_MSGS[msgKey] || FALLBACK_MSGS['ui.status.network'];
      if (status) status.textContent = text;
      setTimeout(() => { if (status && status.textContent === text) status.textContent = ''; }, 6000);
    } finally {
      if (id === requestId) toggle?.removeAttribute('aria-busy');
    }
  }

  function init() {
    mountWidget();
    const toggle = document.getElementById('languageToggle');
    const dropdown = document.getElementById('languageList');
    if (!toggle || !dropdown) return;
    const choices = [...dropdown.querySelectorAll('[data-lang]')];
    const menuWrap = toggle.parentElement;

    function showChoices(show, focus = false) {
      dropdown.hidden = !show;
      toggle.setAttribute('aria-expanded', String(show));
      if (focus) {
        if (show) choices.find(c => c.dataset.lang === displayed)?.focus();
        else toggle.focus();
      }
    }

    toggle.addEventListener('click', () => showChoices(dropdown.hidden, true));
    toggle.addEventListener('keydown', ev => {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        ev.preventDefault();
        showChoices(true, true);
      }
    });
    dropdown.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        showChoices(false, true);
        return;
      }
      const idx = choices.indexOf(document.activeElement);
      const jumps = {
        ArrowDown: (idx + 1) % choices.length,
        ArrowUp: (idx + choices.length - 1) % choices.length,
        Home: 0,
        End: choices.length - 1,
      };
      if (Object.hasOwnProperty.call(jumps, ev.key)) {
        ev.preventDefault();
        choices[jumps[ev.key]].focus();
      }
    });
    for (const choice of choices) {
      choice.addEventListener('click', () => {
        showChoices(false, true);
        selectLanguage(choice.dataset.lang);
      });
    }
    document.addEventListener('click', ev => {
      if (!menuWrap.contains(ev.target) && !ev.target.closest('.tutor-mobile-header')) showChoices(false);
    });
    menuWrap.addEventListener('focusout', ev => {
      if (!menuWrap.contains(ev.relatedTarget)) showChoices(false);
    });

    const requested = new URL(location.href).searchParams.get('lang') || (() => {
      try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
    })();
    if (SUPPORTED.includes(requested) && requested !== 'vi') {
      selectLanguage(requested);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
