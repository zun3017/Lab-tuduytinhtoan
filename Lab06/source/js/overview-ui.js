(function () {
  'use strict';

  const A = window.UI;
  const {esc, icon, money} = A;

  A.recordDashboardVisit = async () => {
    try {
      const stats = await AppApi.request('/api/dashboard-visit', 'POST', {});
      const {accessStreak} = stats;
      if (!A.state.overview && stats.progress) {
        A.state.overview = stats;
        if (A.tab === 'overview') A.render();
      }
      if (A.state.overview) A.state.overview.accessStreak = accessStreak;
      const value = document.querySelector('[data-access-streak]');
      if (value) value.textContent = `${accessStreak} ngày`;
    } catch {
      // The overview stays usable if the visit cannot be recorded.
    }
  };

  function activity(s) {
    const stats = s.overview;
    const goal = stats?.goal;
    const progress = stats?.progress.cooked ?? 0;
    return `
      <section class="panel overview-activity" aria-labelledby="overview-activity-title">
        <div class="overview-activity-title">
          <h2 id="overview-activity-title">${icon('calendar')} Chuỗi ngày và mục tiêu</h2>
          ${stats ? `<button class="text-btn" type="button" data-overview-goal>${goal ? 'Chỉnh mục tiêu' : 'Đặt mục tiêu'}</button>` : ''}
        </div>
        ${stats ? `<dl class="overview-activity-metrics">
          <div><dt>Chuỗi truy cập</dt><dd data-access-streak aria-live="polite">${stats.accessStreak} ngày</dd></div>
          <div><dt>Chuỗi tự nấu</dt><dd>${stats.cookingStreak} ngày</dd></div>
          <div class="overview-week-goal"><dt>Mục tiêu tuần</dt><dd>${goal
            ? `<span>${progress}/${goal.target} bữa tự nấu${progress >= goal.target ? ' · Đã đạt' : ''}</span>
               <progress max="${goal.target}" value="${Math.min(progress, goal.target)}" aria-label="Tiến độ mục tiêu tuần"></progress>`
            : 'Chưa đặt'}</dd></div>
        </dl>` : '<p class="overview-activity-notice" role="status">Chưa tải được chuỗi ngày và mục tiêu.</p><button class="text-btn" type="button" data-retry-overview>Thử lại</button>'}
      </section>`;
  }

  function openGoal() {
    const goal = A.state.overview?.goal;
    A.openDrawer(goal ? 'Chỉnh mục tiêu tuần' : 'Đặt mục tiêu tuần', `
      <form id="overview-goal-form">
        <label class="field">Số bữa tự nấu mỗi tuần
          <input name="target" type="number" min="1" max="28" step="1" required value="${goal?.target ?? ''}" placeholder="Ví dụ: 3">
        </label>
        <button class="btn primary" type="submit">Lưu mục tiêu</button>
        <p role="status" id="overview-goal-status"></p>
      </form>`);
    document.querySelector('#overview-goal-form').onsubmit = async event => {
      event.preventDefault();
      const form = event.currentTarget;
      const fields = new FormData(form);
      const button = form.querySelector('button[type="submit"]');
      button.disabled = true;
      try {
        await A.command('save_overview_goal', {target: Number(fields.get('target'))});
        A.closeDrawer();
        A.toast('Đã lưu mục tiêu tuần.');
      } catch (error) {
        form.querySelector('#overview-goal-status').textContent = error.message;
      } finally {
        button.disabled = false;
      }
    };
  }

  function suggestedMeal(s, labels) {
    if (s.completed) return null;
    const hour = new Date(Date.now() + 7 * 3600000).getUTCHours();
    let first = labels.length - 1;
    if (labels.length === 2) first = hour < 15 ? 0 : 1;
    else if (hour < 10) first = 0;
    else if (hour < 15) first = 1;
    else if (labels.length === 4 && hour < 17) first = 2;
    const recorded = recordedSlots(s);
    const slots = labels.map((_, index) => index);
    for (const slot of [...slots.slice(first), ...slots.slice(0, first)]) {
      if (recorded.has(slot)) continue;
      const dishes = Demo.getDayMealDishes(s, s.day, slot).filter(dish => dish.available !== false);
      if (dishes.length) return {slot, label: labels[slot], dishes};
    }
    return null;
  }

  function recordedSlots(s) {
    return new Set([...(s.overview?.cookedSlots ?? []), ...(s.overview?.skippedSlots ?? [])]);
  }

  function mealActions(s, meal) {
    if (!meal) {
      const slots = s.dailyMenus[String(s.day)]?.length;
      const allRecorded = slots > 0 && recordedSlots(s).size === slots;
      const message = s.completed ? 'Kế hoạch đã hoàn tất.'
        : allRecorded
          ? 'Các bữa hôm nay đã được ghi nhận.' : 'Chưa có món phù hợp cho bữa tiếp theo.';
      return `<section class="panel overview-meal-focus" aria-labelledby="overview-next-title">
        <h2 id="overview-next-title">Bữa tiếp theo ăn gì?</h2>
        <p>${message}</p>
      </section>`;
    }
    const dish = meal.dishes[0];
    const cost = meal.dishes.reduce((total, item) => total + item.cost, 0);
    return `<section class="panel overview-meal-focus" aria-labelledby="overview-next-title">
      <div>
        <p class="overview-next-label">${esc(meal.label)} · Ngày ${s.day}</p>
        <h2 id="overview-next-title">Bữa tiếp theo ăn gì?</h2>
        <p class="overview-next-name">${meal.dishes.map(item => esc(item.name)).join(', ')}</p>
        <p>Giá món ước tính <strong class="number">${money(cost)}</strong></p>
      </div>
      <div class="overview-meal-actions">
        <button class="btn small" type="button" data-recipe="${dish.id}">Xem cách nấu</button>
        <button class="btn small" type="button" data-overview-cooked="${meal.slot}">${icon('check')} Đã nấu bữa này</button>
        <button class="btn small" type="button" data-overview-skip="${meal.slot}">Chưa nấu</button>
      </div>
    </section>`;
  }

  A.overview = {activity, suggestedMeal, mealActions};
  document.addEventListener('click', async event => {
    const mealStatus = event.target.closest('[data-overview-cooked], [data-overview-skip]');
    if (mealStatus) {
      const {planId, day} = A.state;
      const {overviewCooked, overviewSkip} = mealStatus.dataset;
      const cooked = overviewCooked !== undefined;
      const buttons = mealStatus.parentElement.querySelectorAll('[data-overview-cooked], [data-overview-skip]');
      buttons.forEach(button => { button.disabled = true; });
      try {
        await A.command(cooked ? 'record_cooked_meal' : 'skip_cooked_meal',
          {planId, day, slot: Number(overviewCooked ?? overviewSkip)});
        A.toast(cooked ? 'Đã ghi nhận bữa tự nấu.' : 'Đã bỏ qua bữa này.');
      } catch (error) {
        A.toast(error.message);
      } finally {
        buttons.forEach(button => { button.disabled = false; });
      }
      return;
    }
    if (event.target.closest('[data-retry-overview]')) {
      location.reload();
      return;
    }
    if (event.target.closest('[data-overview-goal]')) {
      openGoal();
      return;
    }
  });
})();
