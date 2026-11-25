(function () {
  'use strict';

  const view = document.querySelector('#overview-view');
  const dialog = document.querySelector('#overview-dialog');
  const body = document.querySelector('#dialog-body');
  const notice = document.querySelector('#notice');
  const dishes = new Map();
  const amount = new Intl.NumberFormat('vi-VN');
  let noticeTimer;
  let calendarTimer;

  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const money = value => amount.format(value) + 'đ';

  window.AppApi = {
    async request(path, method = 'GET', payload) {
      const options = method === 'GET' ? {} : {
        method, headers: {'Content-Type': 'application/json', 'X-Bep-Request': '1'},
        body: JSON.stringify(payload)
      };
      const response = await fetch(path, options);
      const result = await response.json();
      if (!response.ok) {
        const error = new Error(result.error);
        error.status = response.status;
        throw error;
      }
      return result.data;
    }
  };
  window.Demo = {
    getDayMealDishes(state, day, slot) {
      return (state.dailyMenus[String(day)]?.[slot] ?? []).map(id => dishes.get(id)).filter(Boolean);
    }
  };
  const UI = window.UI = {
    state: {}, tab: 'overview', esc, money,
    icon(name) {
      const drawings = {bowl: 'M3 11h18c-1 6-4 9-9 9s-8-3-9-9ZM6 7h12M9 3v2m6-2v2', grid: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z', fridge: 'M5 2h14v20H5zM5 10h14M8 5v2m0 6v4', leaf: 'M20 3c-9-2-16 1-16 8 0 5 5 8 9 5 4-2 6-6 7-13ZM4 21l11-12', menu: 'M4 6h16M4 12h16M4 18h16', calendar: 'M4 5h16v16H4zM8 2v6m8-6v6M4 11h16m-11 4h.01m4 0h.01m-4 3h.01', wallet: 'M20 7H4V4h15v3M4 7v14h17V7Zm12 5h5v5h-5z', close: 'm6 6 12 12M6 18 18 6', check: 'm5 12 4 4L19 6'};
      return drawings[name] ? `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${drawings[name]}"/></svg>` : '';
    },
    openDrawer(title, markup) {
      document.querySelector('#dialog-title').textContent = title;
      body.innerHTML = markup;
      if (!dialog.open) dialog.showModal();
    },
    closeDrawer() { dialog.close(); },
    toast(message) {
      notice.textContent = message;
      notice.hidden = false;
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => { notice.hidden = true; }, 5000);
    },
    async command(action, payload) {
      if (this.busy) throw new Error('Đang lưu. Hãy đợi một chút.');
      this.busy = true;
      try {
        this.state = await AppApi.request('/api/commands', 'POST', {version: this.state.version, action, payload});
        this.render();
      } catch (error) {
        if (error.status === 409) {
          this.state = await AppApi.request('/api/state');
          this.render();
        }
        throw error;
      } finally { this.busy = false; }
    },
    render() {
      const s = this.state;
      view.innerHTML = overview();
      clearTimeout(calendarTimer);
      calendarTimer = setTimeout(load, s.overview.calendarRefreshInMs + 500);
    }
  };


  const A = UI;
  const {icon} = A;
  const title = (heading, subtitle, action) => `<div class="view-title"><div><h1>${heading}</h1><p>${subtitle}</p></div>${action}</div>`;
  const photo = dish => `<img src="assets/images/${encodeURIComponent(dish.image)}" alt="" loading="lazy">`;
  A.getMealLabels = count => count === 2 ? ['Bữa trưa', 'Bữa tối'] : count === 4
    ? ['Bữa sáng', 'Bữa trưa', 'Bữa xế', 'Bữa tối'] : ['Bữa sáng', 'Bữa trưa', 'Bữa tối'];

  function spending(s) {
    const {start, end, actual, planned} = s.spending;
    const scope = start === end ? `Ngày ${start}` : `Đợt ngày ${start}–${end}`;
    const difference = actual === null || planned === null ? null : planned - actual;
    const comparison = difference === 0 ? 'Đúng dự chi'
      : difference > 0 ? `Thấp hơn dự chi ${money(difference)}`
      : difference < 0 ? `Cao hơn dự chi ${money(-difference)}` : '';
    return `<div class="overview-spending">
      <p>${scope} · <strong>${actual === null ? 'Chưa ghi thực chi' : `Thực chi ${money(actual)}`}</strong>
        ${planned === null ? '' : ` · Dự chi ${money(planned)}`}</p>
      ${s.setupProfile === 'vi' ? `<p>Còn lại trong đợt <strong>${money(s.summary.cycleRemaining)}</strong></p>` : ''}
      ${comparison ? `<p>${comparison}</p>` : ''}
    </div>`;
  }

  function overview(){
    const s=A.state;
    const heading=title('Chào bạn, hôm nay ăn gì?','Một bữa ăn vừa ý, một khoản chi vừa vặn.',
      s.hasPlan?`<span class="date-label">${icon('calendar')} Ngày ${s.day} trong kế hoạch ${s.days} ngày</span>`:'');
    const activity=A.overview.activity(s);
    const b=s.summary, used=s.completed?s.days:s.day-1;
    const labels=A.getMealLabels(s.dailyMenus[String(s.day)]?.length||s.meals);
    const suggested=A.overview.suggestedMeal(s,labels);
    const alertItems=s.fridge.filter(i=>i.expiry<=s.day+1).sort((a,b)=>a.expiry-b.expiry).slice(0,3);
    const segments=Math.min(s.days,30);
    return `<div class="overview-dashboard">
      ${heading}
      ${activity}
      ${A.overview.mealActions(s,suggested)}
      ${s.setupProfile==='vi'?'':`<p class="hint section-space">Chu kỳ ngày ${b.cycleStart}–${Math.min(s.days,b.cycleStart+2)}: hạn mức ${money(b.cycleBudget)}, còn ${money(b.cycleRemaining)} theo thực chi.</p>`}
      <div class="overview-grid">
        <section class="panel budget-panel">
          <div class="budget-top"><h2>Ngân sách của bạn</h2>${icon('wallet')}</div>
          <div class="budget-main number">${new Intl.NumberFormat('vi-VN').format(b.remaining)}<span>đ</span></div>
          <p>Số tiền còn lại ${b.daysLeft?'cho '+b.daysLeft+' ngày chưa cập nhật':'khi hoàn thành kế hoạch'}</p>
          <div class="budget-details">
            <div><small>Ngân sách ban đầu</small><strong class="number">${money(s.budget)}</strong></div>
            <div><small>Đã chi tiêu</small><strong class="number">${money(b.spent)}</strong></div>
            <div><small>${s.checkedOut?'Định mức ngày tiếp theo':'Định mức hôm nay'}</small><strong class="budget-daily number">${b.daysLeft?money(b.allowance):'Đã hoàn tất'}</strong></div>
          </div>
          ${spending(s)}
        </section>
        <section class="panel cycle-panel">
          <div>
            <div class="row between"><h2>Hành trình của bạn</h2>${icon('calendar')}</div>
            <div class="cycle-day number">Ngày ${s.day} <span>/ ${s.days} ngày</span></div>
            <div class="cycle-days" aria-label="Đã hoàn tất ${used} trên ${s.days} ngày">
              ${Array.from({length:segments},(_,i)=>`<span class="${(i+1)/segments<=used/s.days?'done':(i+1)/segments<=s.day/s.days?'current':''}"></span>`).join('')}
            </div>
            <p class="cycle-note">${used} ngày đã qua · ${s.days-used} ngày còn lại</p>
          </div>
          ${s.completed?'<p class="cycle-note">Kế hoạch đã kết thúc.</p>':''}
        </section>
        <section class="panel overview-meals">
          <div class="panel-head"><div><h2>Thực đơn hôm nay</h2>
            <p>${s.completed?'Kế hoạch đã hoàn tất':s.confirmed?'Bạn đã chốt thực đơn':'Các bữa trong ngày đang mở'}</p></div>
          </div>
          <div class="meal-mini-grid">${labels.map((label,slot)=>{
            const dishes=Demo.getDayMealDishes(s,s.day,slot), main=dishes[0];
            const total=dishes.reduce((sum,d)=>sum+d.cost,0);
            return `<article class="meal-mini">
              ${main?photo(main):''}
              <small>${esc(label)}</small>
              <h3>${main?dishes.map(d=>esc(d.name)).join(', '):'Chưa chọn món'}</h3>
              ${main?`<span class="price number">${money(total)}</span>`:''}
            </article>`;
          }).join('')}</div>
        </section>
        <section class="panel">
          <div class="panel-head"><div><h2>Đừng quên trong tủ lạnh</h2><p>Dùng đúng lúc, bớt lãng phí</p></div>${icon('fridge')}</div>
          ${alertItems.length?alertItems.map(i=>{
            const label=i.expiry===s.day?'Dùng trong hôm nay':'Còn 1 ngày';
            return `<div class="fridge-alert"><span class="ingredient-symbol warn">${icon('leaf')}</span>
              <div><strong>${esc(i.name)}</strong><p>Còn ${amount.format(i.quantity)} ${esc(i.unit)}</p><span class="badge warn">${label}</span></div></div>`;
          }).join(''):'<p class="hint">Không có nguyên liệu cần dùng gấp.</p>'}
          <div class="leftover-note">${icon('leaf')}<span>Nguyên liệu hết hạn không được trừ vào danh sách cần mua.</span></div>
        </section>
      </div>
    </div>`;
  }



  const sidebar = document.querySelector('#sidebar');
  const toggle = document.querySelector('#menu-toggle');
  const overlay = document.querySelector('#sidebar-overlay');
  const close = document.querySelector('#sidebar-close');
  function setMenu(open) {
    sidebar.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    overlay.hidden = !open;
    (open ? close : toggle).focus();
  }
  document.querySelectorAll('[data-icon]').forEach(element => { element.outerHTML = icon(element.dataset.icon); });
  toggle.addEventListener('click', () => setMenu(!sidebar.classList.contains('open')));
  close.addEventListener('click', () => setMenu(false));
  overlay.addEventListener('click', () => setMenu(false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && sidebar.classList.contains('open')) setMenu(false);
  });

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-recipe]');
    if (!button) return;
    const card = DishExplorer.renderDish(dishes.get(Number(button.dataset.recipe)));
    card.querySelector('details').open = true;
    UI.openDrawer('Nguyên liệu và cách nấu', '');
    body.append(card);
  });

  async function load() {
    if (UI.busy) {
      calendarTimer = setTimeout(load, 1000);
      return;
    }
    try {
      const [catalog, state] = await Promise.all([AppApi.request('/api/public/dishes'), AppApi.request('/api/state')]);
      catalog.forEach(dish => dishes.set(dish.id, {...dish, description: dish.desc}));
      UI.state = state;
      UI.render();
      UI.recordDashboardVisit();
    } catch {
      view.innerHTML = '<p role="alert">Chưa tải được dữ liệu. Mở trang qua máy chủ run_local.py rồi tải lại.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', load);
})();
