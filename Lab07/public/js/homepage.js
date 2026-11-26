(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const faqItems = document.querySelectorAll('.faq-item');
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
      new Chart(canvas, {
        type: 'doughnut',
        data: {datasets: [{
          data: [value, 100 - value],
          backgroundColor: [colors[index], '#F1F5F9'],
          borderWidth: 0,
          hoverOffset: 0
        }]},
        options: {
          cutout: '74%', responsive: false,
          animation: reduceMotion ? false : {duration: 1200, easing: 'easeInOutQuart'},
          plugins: {legend: {display: false}, tooltip: {enabled: false}}
        }
      });
      const start = performance.now();
      function draw(time) {
        const progress = reduceMotion ? 1 : Math.min(1, (time - start) / 1400);
        const fraction = 1 - (1 - progress) ** 3;
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

  const contact = byId('contactGuide');
  for (const link of document.querySelectorAll('a[href="#labSupport"]')) {
    link.addEventListener('click', event => {
      event.preventDefault();
      contact.showModal();
    });
  }
  contact.addEventListener('click', e => { if (e.target === contact) contact.close(); });
  if ('serviceWorker' in navigator) {
    const controlled = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (controlled) byId('homeUpdate').hidden = false; });
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
  byId('reloadHome').addEventListener('click', () => location.reload());
  byId('hideUpdate').addEventListener('click', () => { byId('homeUpdate').hidden = true; });

})();
