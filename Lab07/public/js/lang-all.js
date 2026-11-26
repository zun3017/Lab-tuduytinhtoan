(() => {
  'use strict';
  const supported = ['vi', 'en', 'ja', 'ko'];
  const originals = new WeakMap();
  const attributeOriginals = new WeakMap();
  const chartOriginals = new WeakMap();
  const translations = new Map();
  let language = 'vi';
  let running = false;
  let pending = false;
  let initialized = false;
  let timer;
  let observer;
  let widget;

  function remember(node, value) {
    const previous = originals.get(node);
    if (!previous || (value !== previous.source && value !== previous.output)) {
      originals.set(node, { source: value, output: value });
    }
    return originals.get(node);
  }

  window.translatePortalText = text => language === 'vi' ? text : translations.get(language + ':' + text) || text;

  function collect() {
    const entries = ['bài', 'bài đã nộp', 'điểm', 'buổi', 'Buổi ngày', 'Chưa có dữ liệu BTVN'].map(source => ({ source, apply() {} }));
    const root = document.querySelector('#resultBox, #homeworkDashboard');
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement.closest('script,style,textarea,#languageList,#languageToggle,#translationStatus,iframe')) continue;
      if (!root.contains(node) && !node.parentElement.closest('dialog[open],.lab-notice,.modal-overlay')) continue;
      if (!node.nodeValue.trim()) continue;
      const currentNode = node;
      const record = remember(currentNode, currentNode.nodeValue);
      entries.push({ source: record.source.trim(), apply(value) {
        const output = record.source.replace(record.source.trim(), value);
        record.output = output;
        if (currentNode.nodeValue !== output) currentNode.nodeValue = output;
      } });
    }
    for (const element of root.querySelectorAll('[placeholder],[title],[aria-label],[alt],input[type=submit],input[type=button]')) {
      if (element.closest('.lab-lang-widget')) continue;
      let records = attributeOriginals.get(element);
      if (!records) { records = {}; attributeOriginals.set(element, records); }
      for (const attr of ['placeholder', 'title', 'aria-label', 'alt', 'value']) {
        if (attr === 'value' && !element.matches('input[type=submit],input[type=button]')) continue;
        const value = element.getAttribute(attr);
        if (!value?.trim()) continue;
        if (!records[attr] || ![records[attr].source, records[attr].output].includes(value)) {
          records[attr] = { source: value, output: value };
        }
        const record = records[attr];
        entries.push({ source: record.source, apply(next) {
          record.output = next;
          if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
        } });
      }
    }
    for (const canvas of document.querySelectorAll('canvas')) {
      const chart = window.Chart?.getChart(canvas);
      if (!chart) continue;
      const previous = chartOriginals.get(chart) || new Map();
      chartOriginals.set(chart, previous);
      function chartEntry(object, key) {
        if (typeof object[key] !== 'string' || !object[key].trim()) return;
        let fields = previous.get(object);
        if (!fields) { fields = {}; previous.set(object, fields); }
        if (!fields[key] || ![fields[key].source, fields[key].output].includes(object[key])) {
          fields[key] = { source: object[key], output: object[key] };
        }
        const record = fields[key];
        entries.push({ source: record.source, apply(value) { object[key] = value; record.output = value; } });
      }
      for (let i = 0; i < (chart.data.labels || []).length; i++) chartEntry(chart.data.labels, i);
      for (const dataset of chart.data.datasets) chartEntry(dataset, 'label');
      for (const scale of Object.values(chart.options.scales || {})) {
        if (scale.title) chartEntry(scale.title, 'text');
      }
    }
    return entries;
  }

  async function refresh() {
    if (running) { pending = true; return; }
    running = true;
    pending = false;
    const target = language;
    const status = document.getElementById('translationStatus');
    try {
      const entries = collect();
      const needed = [...new Set(entries.map(entry => entry.source))]
        .filter(text => /[\p{L}]/u.test(text) && !translations.has(target + ':' + text));
      if (target !== 'vi' && needed.length) {
        status.textContent = 'Translating…';
        for (let start = 0; start < needed.length; start += 500) {
          const response = await Lab.request('translate/ui', 'POST', {
            page: document.body.dataset.page, target, texts: needed.slice(start, start + 500)
          });
          for (const [key, original] of Object.entries(response.originals)) {
            translations.set(target + ':' + original, response.translations[key]);
          }
        }
      }
      if (target !== language) { pending = true; return; }
      const currentEntries = collect();
      const incomplete = target !== 'vi' && currentEntries.some(entry =>
        /[\p{L}]/u.test(entry.source) && !translations.has(target + ':' + entry.source));
      if (incomplete) {
        pending = true;
        return;
      }
      observer.disconnect();
      for (const entry of currentEntries) entry.apply(target === 'vi' ? entry.source : translations.get(target + ':' + entry.source) || entry.source);
      for (const canvas of document.querySelectorAll('canvas')) window.Chart?.getChart(canvas)?.update('none');
      document.documentElement.lang = target;
      document.getElementById('languageCode').textContent = target.toUpperCase();
      status.textContent = '';
    } catch (error) {
      pending = false;
      observer.disconnect();
      for (const entry of collect()) entry.apply(entry.source);
      document.documentElement.lang = 'vi';
      document.getElementById('languageCode').textContent = 'VI';
      for (const canvas of document.querySelectorAll('canvas')) window.Chart?.getChart(canvas)?.update('none');
      status.textContent = error.message === 'quota'
        ? 'Google Translation quota exceeded. Check your Google Cloud quota. The original page is shown.'
        : 'Translation failed. Please try again. (' + error.message + ')';
    } finally {
      observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ['placeholder','title','aria-label','alt'] });
      running = false;
      if (pending) { pending = false; schedule(); }
    }
  }

  function schedule() {
    clearTimeout(timer);
    timer = setTimeout(refresh, 350);
  }

  function init() {
    if (initialized) { schedule(); return; }
    initialized = true;
    const toolbar = document.querySelector('.result-top-bar') || document.querySelector('#homeworkDashboard');
    widget = document.createElement('div');
    widget.className = 'lab-lang-widget';
    widget.innerHTML = '<button type="button" id="languageToggle" class="lab-lang-btn" aria-expanded="false" aria-controls="languageList">🌐 Language <span id="languageCode">VI</span> ▾</button><div id="languageList" hidden></div>';
    const list = widget.querySelector('#languageList');
    for (const [code, label] of [['vi','Tiếng Việt'],['en','English'],['ja','日本語'],['ko','한국어']]) {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.dataset.lang = code;
      button.addEventListener('click', () => {
        for (const choice of list.querySelectorAll('button')) choice.setAttribute('aria-pressed', String(choice === button));
        language = code;
        localStorage.setItem('lab07.lang', code);
        list.hidden = true;
        widget.querySelector('button').setAttribute('aria-expanded','false');
        schedule();
      });
      list.append(button);
    }
    if (toolbar.classList.contains('result-top-bar')) toolbar.append(widget);
    else toolbar.prepend(widget);
    widget.querySelector('button').addEventListener('click', () => {
      list.hidden = !list.hidden;
      widget.querySelector('button').setAttribute('aria-expanded', String(!list.hidden));
    });
    document.addEventListener('click', event => {
      if (!widget.contains(event.target)) {
        list.hidden = true;
        widget.querySelector('button').setAttribute('aria-expanded','false');
      }
    });
    const status = document.createElement('div');
    status.id = 'translationStatus';
    status.setAttribute('role','status');
    document.body.append(status);
    observer = new MutationObserver(changes => {
      if (changes.some(change => !(change.target.nodeType === Node.ELEMENT_NODE ? change.target : change.target.parentElement)?.closest('.lab-lang-widget,#translationStatus'))) schedule();
    });
    const saved = localStorage.getItem('lab07.lang');
    if (supported.includes(saved)) language = saved;
    observer.observe(document.body, { subtree: true, childList: true, characterData: true });
    if (language !== 'vi') schedule();
  }
  document.addEventListener('lab:portal-ready', init);
})();
