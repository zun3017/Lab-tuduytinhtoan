/**
 * meals.js - Đề xuất món ăn và giá nấu ăn cho 1 người với định lượng nguyên liệu cụ thể
 */

function normalizeMealIngredient(value) {
  const normalized = value.toLocaleLowerCase('vi').normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').trim().replace(/\s+/g, ' ');
  const aliases = {
    'dau phu': 'dau hu',
    'thit ga': 'ga',
    'thit lon': 'thit heo',
    'lon': 'thit heo',
    'heo': 'thit heo',
    'bo': 'thit bo'
  };
  return aliases[normalized] || normalized;
}

function mealIngredientMatches(ingredient, query) {
  const groups = {
    hanh: ['hanh la', 'hanh tay', 'hanh tim'],
    ca: ['ca basa', 'ca thu', 'ca ro phi', 'ca nuc', 'ca hoi', 'ca ngu hop']
  };
  const normalized = normalizeMealIngredient(ingredient);
  return normalized === query || (groups[query] || []).includes(normalized);
}

// Bảng định lượng nguyên liệu cụ thể cho 1 người ăn (ví dụ: 1 củ cà rốt, 1 quả trứng...)
const INGREDIENT_PORTIONS_FOR_ONE = {
  'bánh mì': '1 ổ bánh mì',
  'bánh mì chay': '1 ổ bánh mì chay',
  'bí ngòi': '1/2 quả bí ngòi',
  'bí xanh': '1 khúc bí xanh (150g)',
  'bí đỏ': '1 miếng bí đỏ (150g)',
  'bông cải': '100g bông cải xanh',
  'bún': '1 đĩa bún (150g)',
  'bắp cải': '100g bắp cải',
  'chanh': '1/2 quả chanh',
  'cà chua': '2 quả cà chua',
  'cà rốt': '1 củ cà rốt',
  'cà tím': '1 quả cà tím',
  'cá basa': '150g cá basa',
  'cá hồi': '1 miếng cá hồi (150g)',
  'cá ngừ hộp': '1 hộp cá ngừ',
  'cá nục': '2 con cá nục',
  'cá rô phi': '1 con cá rô phi (150g)',
  'cá thu': '1 lát cá thu (150g)',
  'cần tây': '50g cần tây',
  'củ cải': '1 củ cải trắng',
  'dưa leo': '1 quả dưa leo',
  'dứa': '1/4 quả dứa',
  'giá đỗ': '80g giá đỗ',
  'gà': '150g thịt gà',
  'gạo': '1 bát gạo (150g)',
  'gừng': '1 nhánh gừng nhỏ',
  'hành lá': '2 nhánh hành lá',
  'hành tây': '1/2 củ hành tây',
  'hành tím': '2 củ hành tím',
  'me': '1 vắt me chua',
  'miến': '1 cuộn miến (60g)',
  'mì': '1 vắt mì (80g)',
  'mì chay': '1 vắt mì chay (80g)',
  'mì Ý': '100g mì Ý',
  'mì Ý chay': '100g mì Ý chay',
  'mực': '120g mực ống',
  'nui': '80g nui',
  'nui chay': '80g nui chay',
  'nước mắm': '1 thìa nước mắm',
  'nước tương': '1 thìa nước tương',
  'nấm': '80g nấm tươi',
  'rau cải': '1 bó rau cải (150g)',
  'rau xà lách': '50g rau xà lách',
  'sườn heo': '180g sườn heo',
  'sả': '2 cây sả',
  'thịt bò': '120g thịt bò',
  'thịt heo': '120g thịt heo',
  'trứng': '1 quả trứng',
  'tôm': '100g tôm tươi',
  'tỏi': '2 tép tỏi',
  'đậu bắp': '4 quả đậu bắp',
  'đậu gà hộp': '1 hộp đậu gà (150g)',
  'đậu hũ': '1 bìa đậu hũ',
  'đậu que': '100g đậu que',
  'đậu xanh': '50g đậu xanh',
  'ớt chuông': '1/2 quả ớt chuông'
};

function formatIngredientWithQuantity(ingredient) {
  const clean = ingredient.trim();
  return INGREDIENT_PORTIONS_FOR_ONE[clean] || clean;
}

function recommendMeals(database, { budget, people, maxMinutes = 0, ingredients = '', category = 'all', excludedIngredients = '' }) {
  if (!Number.isFinite(budget) || budget <= 0 || !Number.isInteger(people) || people < 1 ||
      !Number.isFinite(maxMinutes) || maxMinutes < 0) {
    throw new RangeError('Ngân sách, số người hoặc thời gian không hợp lệ.');
  }

  const available = new Set(ingredients.split(/[,;\n]/).map(normalizeMealIngredient).filter(Boolean));
  const excluded = [...new Set(excludedIngredients.split(/[,;\n]/).map(normalizeMealIngredient).filter(Boolean))];
  const isExcluded = ingredient => excluded.some(query => mealIngredientMatches(ingredient, query));

  return database
    .filter(meal => meal.cost * people <= budget && (!maxMinutes || meal.minutes <= maxMinutes) &&
      (category === 'all' || meal.category === category))
    .filter(meal => !meal.ingredients.some(ingredient => isExcluded(ingredient) &&
      !(meal.optionalIngredients || []).includes(ingredient)))
    .map(meal => {
      const omittedIngredients = meal.ingredients.filter(isExcluded);
      const remainingIngredients = meal.ingredients.filter(ingredient => !isExcluded(ingredient));
      const matchedIngredients = remainingIngredients.filter(ingredient => available.has(normalizeMealIngredient(ingredient)));
      const steps = (meal.steps || []).map(originalStep => {
        let step = originalStep;
        omittedIngredients.forEach(ingredient => {
          (meal.optionalStepEdits?.[ingredient] || []).forEach(([from, to]) => {
            step = step.replaceAll(from, to);
          });
        });
        return step;
      });

      return {
        ...meal,
        ingredients: remainingIngredients,
        steps,
        people,
        totalCost: meal.cost * people,
        omittedIngredients,
        matchedIngredients,
        shoppingIngredients: remainingIngredients.filter(ingredient => !available.has(normalizeMealIngredient(ingredient)))
      };
    })
    .sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length || a.totalCost - b.totalCost || a.minutes - b.minutes);
}

// Bảng ánh xạ hình ảnh chính xác từng món ăn trong kho 60 món
const DISH_IMAGES = {
  // 20 món thịt
  'meal-1': 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
  'meal-2': 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
  'meal-3': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600&auto=format&fit=crop&q=80',
  'meal-4': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'meal-5': 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop&q=80',
  'meal-6': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'meal-7': 'https://images.unsplash.com/photo-1604908177453-7462950a6a3b?w=600&auto=format&fit=crop&q=80',
  'meal-8': 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=600&auto=format&fit=crop&q=80',
  'meal-9': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
  'meal-10': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  'meal-11': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  'meal-12': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&auto=format&fit=crop&q=80',
  'meal-13': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
  'meal-14': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&auto=format&fit=crop&q=80',
  'meal-15': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
  'meal-16': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&auto=format&fit=crop&q=80',
  'meal-17': 'https://images.unsplash.com/photo-1628191010210-a59de33e5941?w=600&auto=format&fit=crop&q=80',
  'meal-18': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&auto=format&fit=crop&q=80',
  'meal-19': 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=600&auto=format&fit=crop&q=80',
  'meal-20': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',

  // 20 món cá & hải sản
  'meal-21': 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=600&auto=format&fit=crop&q=80',
  'meal-22': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
  'meal-23': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&auto=format&fit=crop&q=80',
  'meal-24': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
  'meal-25': 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
  'meal-26': 'https://images.unsplash.com/photo-1559737558-2f5a35f4523b?w=600&auto=format&fit=crop&q=80',
  'meal-27': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
  'meal-28': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
  'meal-29': 'https://images.unsplash.com/photo-1548943487-a2e4e43b4853?w=600&auto=format&fit=crop&q=80',
  'meal-30': 'https://images.unsplash.com/photo-1606850780554-b55ea4dd0b70?w=600&auto=format&fit=crop&q=80',
  'meal-31': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  'meal-32': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  'meal-33': 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80',
  'meal-34': 'https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&auto=format&fit=crop&q=80',
  'meal-35': 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80',
  'meal-36': 'https://images.unsplash.com/photo-1534939561126-855b8675edd7?w=600&auto=format&fit=crop&q=80',
  'meal-37': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&auto=format&fit=crop&q=80',
  'meal-38': 'https://images.unsplash.com/photo-1534604973900-c43ab4c2e0ab?w=600&auto=format&fit=crop&q=80',
  'meal-39': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'meal-40': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',

  // 20 món chay
  'meal-41': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'meal-42': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'meal-43': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'meal-44': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
  'meal-45': 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80',
  'meal-46': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&auto=format&fit=crop&q=80',
  'meal-47': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'meal-48': 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=600&auto=format&fit=crop&q=80',
  'meal-49': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'meal-50': 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=600&auto=format&fit=crop&q=80',
  'meal-51': 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'meal-52': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
  'meal-53': 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?w=600&auto=format&fit=crop&q=80',
  'meal-54': 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=600&auto=format&fit=crop&q=80',
  'meal-55': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80',
  'meal-56': 'https://images.unsplash.com/photo-1551892374-ecf8754cf8b0?w=600&auto=format&fit=crop&q=80',
  'meal-57': 'https://images.unsplash.com/photo-1541832676-9b763b0239ab?w=600&auto=format&fit=crop&q=80',
  'meal-58': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&auto=format&fit=crop&q=80',
  'meal-59': 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
  'meal-60': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80'
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    normalizeMealIngredient,
    mealIngredientMatches,
    recommendMeals,
    DISH_IMAGES,
    INGREDIENT_PORTIONS_FOR_ONE,
    formatIngredientWithQuantity
  };
}

// Logic hiển thị trên giao diện người dùng
if (typeof document !== 'undefined' && document.querySelector('#meal-results')) {
  (() => {
    const results = document.querySelector('#meal-results');
    const status = document.querySelector('#meal-status');
    const emptyState = document.querySelector('#meal-empty');
    const moreBtn = document.querySelector('#meal-more');
    const searchInput = document.querySelector('#dish-search');
    const categoryTabs = document.querySelector('#category-tabs');
    const toggleImagesBtn = document.querySelector('#toggle-images-btn');

    const categories = {
      meat: '🍖 Món thịt',
      fish: '🐟 Cá & hải sản',
      vegetarian: '🥬 Món chay'
    };

    const money = value => `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

    const state = {
      category: 'all',
      query: '',
      visible: 8,
      hideImages: false
    };

    function renderCatalog() {
      const db = typeof MEAL_DATABASE !== 'undefined' ? MEAL_DATABASE : [];
      let pool = [...db];

      // 1. Lọc theo danh mục
      if (state.category !== 'all') {
        pool = pool.filter(meal => meal.category === state.category);
      }

      // 2. Lọc theo từ khóa tìm kiếm (tên món hoặc tên nguyên liệu)
      const q = normalizeMealIngredient(state.query);
      if (q) {
        pool = pool.filter(meal =>
          normalizeMealIngredient(meal.name).includes(q) ||
          meal.ingredients.some(i => normalizeMealIngredient(i).includes(q))
        );
      }

      // 3. Cập nhật trạng thái
      if (emptyState) emptyState.hidden = pool.length > 0;
      if (moreBtn) moreBtn.hidden = state.visible >= pool.length;
      if (status) {
        status.textContent = `Đang hiển thị ${pool.length} món ăn với giá nấu ước tính cho 1 người.`;
      }

      // 4. Render danh sách card món ăn
      results.replaceChildren();

      const itemsToRender = pool.slice(0, state.visible);
      itemsToRender.forEach(meal => {
        const card = document.createElement('article');
        card.className = 'meal-result';

        // Khối hình ảnh chính xác từng món
        const visual = document.createElement('div');
        visual.className = 'guide-dish-visual';

        const img = document.createElement('img');
        const accurateImg = DISH_IMAGES[meal.id] || 'assets/meal-hero.png';
        img.src = accurateImg;
        img.alt = `Ảnh món ${meal.name}`;
        img.loading = 'lazy';
        img.onerror = () => {
          img.src = 'assets/meal-hero.png';
        };

        const priceBadge = document.createElement('span');
        priceBadge.className = 'guide-photo-price';
        priceBadge.textContent = `${money(meal.cost)} / người`;

        const photoNote = document.createElement('small');
        photoNote.className = 'guide-photo-note';
        photoNote.textContent = 'Ảnh minh hoạ';

        visual.append(img, priceBadge, photoNote);
        card.append(visual);

        // Thẻ loại món
        const catBadge = document.createElement('p');
        catBadge.className = 'meal-category';
        catBadge.textContent = categories[meal.category] || meal.category;
        card.append(catBadge);

        // Tên món
        const title = document.createElement('h3');
        title.className = 'meal-title';
        title.textContent = meal.name;
        card.append(title);

        // Giá nấu ăn cho 1 người & thời gian
        const meta = document.createElement('p');
        meta.className = 'meal-meta';
        meta.innerHTML = `<strong>${money(meal.cost)}</strong> / 1 người · ⏱ ${meal.minutes} phút`;
        card.append(meta);

        // Khối nguyên liệu cần mua với định lượng cụ thể (ví dụ: 1 củ cà rốt, 1 quả trứng...)
        const ingredientsBox = document.createElement('div');
        ingredientsBox.className = 'meal-ingredients-box';

        const boxTitle = document.createElement('strong');
        boxTitle.className = 'ingredients-box-title';
        boxTitle.textContent = '🛒 Cần mua (cho 1 người):';
        ingredientsBox.append(boxTitle);

        const chipsList = document.createElement('ul');
        chipsList.className = 'meal-ingredients-chips';
        meal.ingredients.forEach(ingredient => {
          const chipItem = document.createElement('li');
          chipItem.textContent = formatIngredientWithQuantity(ingredient);
          chipsList.append(chipItem);
        });
        ingredientsBox.append(chipsList);
        card.append(ingredientsBox);

        // Hướng dẫn cách làm
        const details = document.createElement('details');
        details.className = 'meal-details';
        const summary = document.createElement('summary');
        summary.textContent = `Xem cách làm (${(meal.steps || []).length} bước)`;
        details.append(summary);

        const stepsList = document.createElement('ol');
        (meal.steps || []).forEach(step => {
          const stepItem = document.createElement('li');
          stepItem.textContent = step;
          stepsList.append(stepItem);
        });
        details.append(stepsList);
        card.append(details);

        results.append(card);
      });
    }

    // Tìm kiếm
    if (searchInput) {
      searchInput.addEventListener('input', event => {
        state.query = event.target.value;
        state.visible = 8;
        renderCatalog();
      });
    }

    // Tab phân loại
    if (categoryTabs) {
      categoryTabs.querySelectorAll('.cat-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          state.category = tab.dataset.cat;
          state.visible = 8;
          categoryTabs.querySelectorAll('.cat-tab').forEach(t => {
            t.classList.toggle('is-active', t === tab);
          });
          renderCatalog();
        });
      });
    }

    // Nút xem thêm món
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        state.visible += 8;
        renderCatalog();
      });
    }

    // Nút bật / tắt hình ảnh
    if (toggleImagesBtn) {
      toggleImagesBtn.addEventListener('click', () => {
        state.hideImages = !state.hideImages;
        results.classList.toggle('hide-dish-images', state.hideImages);
        toggleImagesBtn.innerHTML = state.hideImages
          ? '<span>📷 Hiện ảnh món ăn</span>'
          : '<span>📷 Ẩn ảnh món ăn</span>';
      });
    }

    // Khởi chạy hiển thị ngay khi vào trang
    renderCatalog();
  })();
}
