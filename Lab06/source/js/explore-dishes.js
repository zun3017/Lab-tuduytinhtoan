(function() {
  'use strict';

  const pageSize = 6;
  const amount = new Intl.NumberFormat('vi-VN', {maximumFractionDigits: 3});

  function normalize(text) {
    return text.toLocaleLowerCase('vi').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
  }

  function makeElement(tag, text, className) {
    const element = document.createElement(tag);
    if (text !== undefined) element.textContent = text;
    if (className) element.className = className;
    return element;
  }

  function renderDish(dish) {
    const card = makeElement('article', undefined, 'explore-dish');
    if (dish.image && !/[\\/]/.test(dish.image)) {
      const photo = makeElement('img', undefined, 'explore-dish-photo');
      photo.alt = '';
      photo.loading = 'lazy';
      photo.decoding = 'async';
      photo.addEventListener('error', () => photo.remove(), {once: true});
      photo.src = 'assets/images/' + encodeURIComponent(dish.image);
      card.append(photo);
    }

    const content = makeElement('div', undefined, 'explore-dish-copy');
    const details = makeElement('details');
    const summary = makeElement('summary', 'Nguyên liệu và cách nấu');
    summary.setAttribute('aria-label', 'Nguyên liệu và cách nấu món ' + dish.name);
    details.append(summary);
    const ingredients = dish.recipeIngredients;
    const recipeBody = makeElement('div', undefined, 'explore-recipe-body');
    if (ingredients.length) {
      const list = makeElement('dl', undefined, 'explore-ingredients');
      for (const item of ingredients) {
        const row = makeElement('div');
        row.append(makeElement('dt', item.name), makeElement('dd', `${amount.format(item.quantity)} ${item.unit}`));
        list.append(row);
      }
      recipeBody.append(makeElement('h4', 'Nguyên liệu'), list);
    } else {
      recipeBody.append(makeElement('p', 'Chưa có thông tin nguyên liệu.'));
    }
    recipeBody.append(makeElement('h4', 'Cách nấu'),
      makeElement('p', dish.recipe?.trim() || 'Chưa có hướng dẫn nấu.', 'explore-recipe'));
    details.append(recipeBody);
    content.append(
      makeElement('h3', dish.name),
      makeElement('p', dish.description || 'Món này chưa có mô tả.', 'explore-description'),
      details
    );
    card.append(content);
    return card;
  }

  function mount(root, {dishes: initialDishes} = {}) {
    const inDashboard = initialDishes !== undefined;
    const heading = inDashboard
      ? '<h1 id="catalog-title">Khám phá món ăn</h1>'
      : '<h2 id="catalog-title">Danh mục món ăn</h2>';
    const content = `
      <div class="explore-catalog-heading">
        <div>
          ${heading}
          <p id="dish-status" role="status">Đang tải danh mục món ăn…</p>
        </div>
        <label class="explore-search">
          <span>Tìm món hoặc nguyên liệu</span>
          <input id="dish-search" type="search" placeholder="Ví dụ: trứng, đậu hũ…" disabled>
        </label>
      </div>
      <p id="dish-description-warning" class="explore-warning" role="status" hidden></p>
      <button id="dish-retry" class="btn" type="button" hidden>Thử lại</button>
      <div id="dish-grid" class="explore-grid"></div>
      <div class="explore-actions">
        <button id="dish-more" class="btn" type="button" aria-controls="dish-grid" hidden>Xem thêm món</button>
      </div>`;
    root.innerHTML = inDashboard
      ? `<section class="explore-catalog explore-dashboard" aria-labelledby="catalog-title">${content}</section>`
      : content;
    const search = root.querySelector('#dish-search');
    const dishStatus = root.querySelector('#dish-status');
    const grid = root.querySelector('#dish-grid');
    const retry = root.querySelector('#dish-retry');
    const more = root.querySelector('#dish-more');
    const descriptionWarning = root.querySelector('#dish-description-warning');
    let dishes = [];
    let matches = [];

    function showNextPage(moveFocus = false) {
      const offset = grid.childElementCount;
      const cards = matches.slice(offset, offset + pageSize).map(renderDish);
      grid.append(...cards);
      more.hidden = grid.childElementCount >= matches.length;
      if (!matches.length) {
        dishStatus.textContent = dishes.length ? 'Không tìm thấy món phù hợp.' : 'Danh mục chưa có món ăn.';
        return;
      }
      const countLabel = matches.length === dishes.length ? 'món trong danh mục' : 'món tìm thấy';
      dishStatus.textContent = `Đang hiện ${grid.childElementCount}/${matches.length} ${countLabel}`;
      if (moveFocus) cards[0]?.querySelector('summary').focus();
    }

    function renderCatalog() {
      const terms = normalize(search.value).trim().split(/\s+/).filter(Boolean);
      matches = dishes.filter(dish => terms.every(term => dish.searchText.includes(term)));
      grid.replaceChildren();
      showNextPage();
    }

    function setDishes(data) {
      dishes = data.map(dish => ({
        ...dish,
        description: dish.desc?.trim() || dish.description?.trim() || '',
        searchText: normalize([dish.name, ...dish.recipeIngredients.map(item => item.name)].join(' '))
      }));
      if (data.length && data.every(dish => !Object.hasOwn(dish, 'desc') && !Object.hasOwn(dish, 'description'))) {
        descriptionWarning.textContent = 'Máy chủ đang chạy bản cũ chưa trả mô tả món. Hãy khởi động lại run_local.py rồi tải lại trang.';
        descriptionWarning.hidden = false;
      }
      search.disabled = false;
      renderCatalog();
    }

    async function loadCatalog() {
      retry.hidden = true;
      descriptionWarning.hidden = true;
      search.disabled = true;
      dishStatus.textContent = 'Đang tải danh mục món ăn…';
      try {
        const response = await fetch('/api/public/dishes');
        if (!response.ok) throw new Error('Không tải được danh mục');
        const {data} = await response.json();
        setDishes(data);
      } catch {
        dishStatus.textContent = location.protocol === 'file:'
          ? 'Mở trang qua máy chủ Bếp Sinh Viên để xem danh mục.'
          : 'Chưa tải được danh mục. Hãy thử lại.';
        retry.hidden = false;
      }
    }

    search.addEventListener('input', renderCatalog);
    retry.addEventListener('click', loadCatalog);
    more.addEventListener('click', () => showNextPage(true));
    if (inDashboard) setDishes(initialDishes);
    else loadCatalog();
  }

  window.DishExplorer = {mount, renderDish};
  const publicCatalog = document.querySelector('#kham-pha-mon-an');
  if (publicCatalog) mount(publicCatalog);
})();
