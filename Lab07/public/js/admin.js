'use strict';
(async () => {
  const { id, text, escape: e, live, money, iso, month, date, empty, request, notice } = Lab;
  let data = await Lab.dashboard(['admin']);
  if (!data) return;

  id('adminDashboardBox').style.display = 'block';
  text('adminNameDisplay', 'Xin chào, ' + data.user.name);

  const activeTutors = () => live(data.tutors);
  const activeCenters = () => live(data.centers);
  const activePayments = () => live(data.payments);
  const centerMap = () => new Map(data.centers.map(c => [c.id, c]));
  const tutorMap = () => new Map(data.tutors.map(t => [t.id, t]));
  const initialOf = name => String(name || '?').trim().split(/\s+/).pop().slice(0, 2).toUpperCase();

  function openAdminModal(titleHtml, fields, submit, submitLabel = 'Lưu', extraHtml = '') {
    document.querySelectorAll('.lab-admin-modal').forEach(el => el.remove());
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay lab-admin-modal';
    overlay.style.display = 'flex';
    const fieldsHtml = fields.map(f => {
      const n = e(f.name);
      const req = f.required ? 'required' : '';
      const min = f.min !== undefined ? `min="${e(f.min)}"` : '';
      let control;
      if (f.options) {
        control = `<select name="${n}" class="adm-filter-select" style="width:100%;" ${req}>${f.options.map(([v, t]) => `<option value="${e(v)}" ${String(v) === String(f.value) ? 'selected' : ''}>${e(t)}</option>`).join('')}</select>`;
      } else if (f.type === 'textarea') {
        control = `<textarea name="${n}" class="adm-search-input" style="padding-left:14px;min-height:80px;" ${req}>${e(f.value ?? '')}</textarea>`;
      } else {
        control = `<input type="${e(f.type || 'text')}" name="${n}" value="${e(f.value ?? '')}" class="adm-search-input" style="padding-left:14px;" ${req} ${min}>`;
      }
      return `<div style="margin-bottom:14px;text-align:left;"><label style="display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px;">${e(f.label)}</label>${control}</div>`;
    }).join('');

    overlay.innerHTML = `
      <div class="adm-card" style="width:min(520px,94vw);max-height:88vh;overflow-y:auto;margin:0;position:relative;">
        <div class="adm-card-header" style="margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid #E2E8F0;">
          <h2 class="adm-card-title">${titleHtml}</h2>
          <button type="button" class="adm-action-btn" id="admModalCloseBtn" style="padding:4px 10px;">&times;</button>
        </div>
        ${extraHtml}
        <form>
          ${fieldsHtml}
          <p class="lab-error" role="alert" hidden style="margin-bottom:12px;"></p>
          <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px;">
            <button type="button" class="btn-secondary-ghost" id="admModalCancelBtn">Đóng</button>
            ${submit ? `<button type="submit" class="btn-primary-gradient">${e(submitLabel)}</button>` : ''}
          </div>
        </form>
      </div>
    `;
    const close = () => overlay.remove();
    overlay.addEventListener('click', ev => { if (ev.target === overlay) close(); });
    overlay.querySelector('#admModalCloseBtn').onclick = close;
    overlay.querySelector('#admModalCancelBtn').onclick = close;
    overlay.querySelector('form').onsubmit = async ev => {
      ev.preventDefault();
      if (!submit) return close();
      const form = ev.currentTarget;
      const btn = form.querySelector('.btn-primary-gradient');
      const errEl = form.querySelector('.lab-error');
      errEl.hidden = true;
      btn.disabled = true;
      try {
        await submit(Object.fromEntries(new FormData(form)));
        close();
      } catch (err) {
        errEl.textContent = err.message;
        errEl.hidden = false;
      } finally {
        btn.disabled = false;
      }
    };
    document.body.append(overlay);
    return overlay;
  }

  function tutorStatusInfo(t) {
    if (t.status === 'locked') return { code: 'deactivated', label: 'Bị khóa', cls: 'status-locked' };
    const todayIso = iso();
    const dueLimit = new Date();
    dueLimit.setDate(dueLimit.getDate() + 3);
    const dueIso = iso(dueLimit);
    if (t.next_billing_date && t.next_billing_date < todayIso) {
      return { code: t.account_type === 'trial' ? 'trial_expired' : 'sub_expired', label: 'Hết hạn', cls: 'status-due' };
    }
    if (t.next_billing_date && t.next_billing_date <= dueIso) {
      return { code: 'due', label: 'Sắp hết hạn', cls: 'status-locked' };
    }
    if (t.account_type === 'trial') return { code: 'trial', label: 'Dùng thử', cls: 'status-active' };
    return { code: 'active', label: 'Hoạt động', cls: 'status-active' };
  }

  function renderOverview() {
    const tutors = activeTutors();
    const payments = activePayments().slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const curMonth = month();
    const monthRev = payments.filter(p => p.date.startsWith(curMonth)).reduce((s, p) => s + Number(p.amount || 0), 0);
    const statuses = tutors.map(t => ({ tutor: t, st: tutorStatusInfo(t) }));

    text('admKpiRevenue', money(monthRev));
    text('admKpiActive', statuses.filter(x => x.tutor.account_type !== 'trial' && x.tutor.status === 'active' && !['sub_expired', 'trial_expired'].includes(x.st.code)).length);
    text('admKpiTrial', statuses.filter(x => x.tutor.account_type === 'trial' && x.st.code !== 'trial_expired').length);
    text('admKpiExpired', statuses.filter(x => ['trial_expired', 'sub_expired', 'due'].includes(x.st.code)).length);

    const alertBox = id('adminBillingAlerts');
    const dueList = statuses.filter(x => ['trial_expired', 'sub_expired', 'due'].includes(x.st.code));
    if (alertBox) {
      alertBox.style.display = dueList.length ? 'flex' : 'none';
      alertBox.innerHTML = dueList.map(({ tutor, st }) => `
        <div class="adm-alert-card">
          <div><i class="fa-solid fa-triangle-exclamation" style="color:#DC2626;margin-right:6px;"></i><strong>${e(tutor.name)}</strong> (${e(tutor.login)}) · ${e(st.label)} (${e(date(tutor.next_billing_date))})</div>
          <button type="button" class="adm-btn-action btn-pay" data-command="renewTutor" data-key="${tutor.id}"><i class="fa-solid fa-bolt"></i> Gia hạn ngay</button>
        </div>
      `).join('');
    }

    const monthlyTotals = new Map();
    for (const p of payments) {
      const m = p.date.slice(0, 7);
      monthlyTotals.set(m, (monthlyTotals.get(m) || 0) + Number(p.amount || 0));
    }
    const labels = [...monthlyTotals.keys()].sort();
    Lab.chart('adminRevenueChartCanvas', 'bar', labels.length ? labels : [curMonth], [{
      label: 'Doanh thu phí web (VNĐ)',
      data: labels.length ? labels.map(l => monthlyTotals.get(l)) : [0],
      backgroundColor: '#2563EB',
      borderRadius: 8,
    }]);

    const tMap = tutorMap();
    const pTable = id('adminPaymentsTable');
    if (pTable) {
      pTable.querySelector('thead').innerHTML = '<tr><th>Ngày thu</th><th>Gia sư</th><th>Số tiền</th><th>Hạn mới</th><th>Ghi chú</th><th>Thao tác</th></tr>';
      pTable.querySelector('tbody').innerHTML = payments.map(p => {
        const t = tMap.get(p.tutor_id);
        return `<tr>
          <td>${e(date(p.date))}</td>
          <td><div class="adm-user-cell"><span class="adm-avatar-circle">${e(initialOf(t?.name || 'GS'))}</span><strong>${e(t ? t.name : 'Gia sư')}</strong></div></td>
          <td style="font-weight:700;color:#059669;">${money(p.amount)}</td>
          <td>${e(date(p.next_date))}</td>
          <td>${e(p.note || '—')}</td>
          <td><button type="button" class="adm-btn-action btn-cancel-renew" data-command="cancelPayment" data-key="${p.id}"><i class="fa-solid fa-rotate-left"></i> Hủy gia hạn</button></td>
        </tr>`;
      }).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748B;">Chưa có giao dịch gia hạn.</td></tr>';
    }
    const pMobile = id('adminPaymentsMobile');
    if (pMobile) {
      pMobile.innerHTML = payments.map(p => {
        const t = tMap.get(p.tutor_id);
        return `<div class="accordion-item" style="padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;"><strong>${e(t ? t.name : 'Gia sư')}</strong><strong style="color:#059669;">${money(p.amount)}</strong></div>
          <div style="font-size:12.5px;color:#64748B;margin-bottom:8px;">Ngày: ${e(date(p.date))} · Hạn mới: ${e(date(p.next_date))}</div>
          <button type="button" class="adm-btn-action btn-cancel-renew" data-command="cancelPayment" data-key="${p.id}">Hủy gia hạn</button>
        </div>`;
      }).join('') || empty('Chưa có giao dịch.');
    }
  }

  function renderTutors() {
    const tutors = activeTutors();
    const centers = activeCenters();
    const cMap = centerMap();
    text('tutorTabCountBadge', tutors.length);

    const centerSel = id('adminTutorCenterFilter');
    if (centerSel) {
      const prev = centerSel.value;
      centerSel.innerHTML = '<option value="all">Tất cả nguồn / trung tâm</option>' +
        centers.map(c => `<option value="${c.id}">${e(c.name)}</option>`).join('');
      centerSel.value = prev && [...centerSel.options].some(o => o.value === prev) ? prev : 'all';
    }

    const q = (id('adminTutorSearchInput')?.value || '').trim().toLowerCase();
    const statusFilter = id('adminTutorStatusFilter')?.value || 'all';
    const centerFilter = centerSel?.value || 'all';

    const filtered = tutors.filter(t => {
      const st = tutorStatusInfo(t);
      if (q && !(`${t.name} ${t.login} ${t.phone || ''}`).toLowerCase().includes(q)) return false;
      if (statusFilter !== 'all' && st.code !== statusFilter) return false;
      if (centerFilter !== 'all' && String(t.center_id || '') !== centerFilter) return false;
      return true;
    });

    const table = id('adminTutorsTable');
    if (table) {
      table.querySelector('thead').innerHTML = '<tr><th>Gia sư</th><th>Mã ĐN / SĐT</th><th>Trung tâm</th><th>Gói / Hạn</th><th>Trạng thái</th><th>Thao tác</th></tr>';
      table.querySelector('tbody').innerHTML = filtered.map(t => {
        const st = tutorStatusInfo(t);
        const center = cMap.get(t.center_id);
        const isDue = ['trial_expired', 'sub_expired', 'due'].includes(st.code);
        return `<tr>
          <td><div class="adm-user-cell"><span class="adm-avatar-circle">${e(initialOf(t.name))}</span><div><strong>${e(t.name)}</strong></div></div></td>
          <td><span class="adm-phone-tag">${e(t.login)}</span><div style="font-size:12px;color:#64748B;margin-top:4px;">${e(t.phone || '—')}</div></td>
          <td><span class="adm-tag-tutor">${e(center ? center.name : 'Trực tiếp')}</span></td>
          <td><div><strong>${e(t.account_type)}</strong></div><span class="adm-due-badge ${isDue ? 'is-due' : ''}">${e(date(t.next_billing_date))}</span></td>
          <td><span class="adm-status-pill ${st.cls}">${e(st.label)}</span></td>
          <td>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="adm-btn-action btn-edit" data-command="editTutor" data-key="${t.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
              <button type="button" class="adm-btn-action btn-pay" data-command="renewTutor" data-key="${t.id}"><i class="fa-solid fa-bolt"></i> Gia hạn</button>
              <button type="button" class="adm-btn-action ${t.status === 'locked' ? 'btn-unlock' : 'btn-lock'}" data-command="toggleTutorLock" data-key="${t.id}">${t.status === 'locked' ? 'Mở khóa' : 'Khóa'}</button>
              <button type="button" class="adm-btn-action btn-cancel-renew" data-command="deleteTutor" data-key="${t.id}">Xóa</button>
            </div>
          </td>
        </tr>`;
      }).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748B;">Không có gia sư phù hợp.</td></tr>';
    }

    const mobile = id('adminTutorsMobile');
    if (mobile) {
      mobile.innerHTML = filtered.map(t => {
        const st = tutorStatusInfo(t);
        const center = cMap.get(t.center_id);
        return `<div class="accordion-item" style="padding:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <div class="adm-user-cell"><span class="adm-avatar-circle">${e(initialOf(t.name))}</span><div><strong>${e(t.name)}</strong><div style="font-size:12px;color:#64748B;">${e(t.login)}</div></div></div>
            <span class="adm-status-pill ${st.cls}">${e(st.label)}</span>
          </div>
          <div style="font-size:12.5px;color:#475569;margin-bottom:10px;">${e(center ? center.name : 'Trực tiếp')} · Hạn: ${e(date(t.next_billing_date))}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;">
            <button type="button" class="adm-btn-action btn-edit" data-command="editTutor" data-key="${t.id}">Sửa</button>
            <button type="button" class="adm-btn-action btn-pay" data-command="renewTutor" data-key="${t.id}">Gia hạn</button>
            <button type="button" class="adm-btn-action ${t.status === 'locked' ? 'btn-unlock' : 'btn-lock'}" data-command="toggleTutorLock" data-key="${t.id}">${t.status === 'locked' ? 'Mở khóa' : 'Khóa'}</button>
            <button type="button" class="adm-btn-action btn-cancel-renew" data-command="deleteTutor" data-key="${t.id}">Xóa</button>
          </div>
        </div>`;
      }).join('') || empty('Không có gia sư phù hợp.');
    }
  }

  function renderCenters() {
    const centers = activeCenters();
    const tutors = activeTutors();
    const payments = activePayments();
    text('centerTabCountBadge', centers.length);

    const rowsData = centers.map(c => {
      const cTutors = tutors.filter(t => t.center_id === c.id);
      const tidSet = new Set(cTutors.map(t => t.id));
      const rev = payments.filter(p => tidSet.has(p.tutor_id)).reduce((s, p) => s + Number(p.amount || 0), 0);
      return { center: c, tutorCount: cTutors.length, revenue: rev };
    });

    const table = id('adminCentersTable');
    if (table) {
      table.querySelector('thead').innerHTML = '<tr><th>Mã</th><th>Tên trung tâm</th><th>Liên hệ</th><th>Số gia sư</th><th>Doanh thu thu thực</th><th>Thao tác</th></tr>';
      table.querySelector('tbody').innerHTML = rowsData.map(r => `<tr>
        <td><span class="adm-phone-tag">${e(r.center.code)}</span></td>
        <td><strong>${e(r.center.name)}</strong></td>
        <td>${e(r.center.contact || '—')}</td>
        <td><span class="adm-tag-tutor">${r.tutorCount} gia sư</span></td>
        <td style="font-weight:700;color:#059669;">${money(r.revenue)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            <button type="button" class="adm-btn-action btn-edit" data-command="editCenter" data-key="${r.center.id}">Sửa</button>
            <button type="button" class="adm-btn-action btn-cancel-renew" data-command="deleteCenter" data-key="${r.center.id}">Xóa</button>
          </div>
        </td>
      </tr>`).join('') || '<tr><td colspan="6" style="text-align:center;padding:24px;color:#64748B;">Chưa có trung tâm nào.</td></tr>';
    }
    const mobile = id('adminCentersMobile');
    if (mobile) {
      mobile.innerHTML = rowsData.map(r => `<div class="accordion-item" style="padding:14px;">
        <strong>${e(r.center.name)} (${e(r.center.code)})</strong>
        <p style="font-size:12.5px;color:#64748B;margin:6px 0;">Liên hệ: ${e(r.center.contact || '—')} · ${r.tutorCount} gia sư · ${money(r.revenue)}</p>
        <div style="display:flex;gap:6px;">
          <button type="button" class="adm-btn-action btn-edit" data-command="editCenter" data-key="${r.center.id}">Sửa</button>
          <button type="button" class="adm-btn-action btn-cancel-renew" data-command="deleteCenter" data-key="${r.center.id}">Xóa</button>
        </div>
      </div>`).join('') || empty('Chưa có trung tâm.');
    }
  }

  function renderSettings() {
    const box = id('adminTabSettings');
    if (!box) return;
    box.innerHTML = `<div class="adm-card">
      <div class="adm-card-header"><h2 class="adm-card-title"><i class="fa-solid fa-sliders" style="color:#2563EB;"></i> Cài đặt thông báo hệ thống</h2></div>
      <form id="adminSettingsForm">
        <div style="margin-bottom:14px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px;">Thông báo chạy chữ cổng học sinh</label>
          <textarea name="marquee" class="adm-search-input" style="padding-left:14px;min-height:76px;">${e(data.settings?.marquee || '')}</textarea>
        </div>
        <div style="margin-bottom:16px;">
          <label style="display:block;font-size:13px;font-weight:600;color:#334155;margin-bottom:6px;">Thông tin liên hệ giả lập</label>
          <input type="text" name="contact" class="adm-search-input" style="padding-left:14px;" value="${e(data.settings?.contact || '')}">
        </div>
        <button class="btn-primary-gradient" type="submit"><i class="fa-solid fa-floppy-disk"></i> Lưu cài đặt</button>
      </form>
    </div>`;
    id('adminSettingsForm')?.addEventListener('submit', async ev => {
      ev.preventDefault();
      const values = Object.fromEntries(new FormData(ev.currentTarget));
      const res = await request('settings', 'PUT', values);
      data.settings = res.settings;
      notice('Đã lưu cài đặt hệ thống.');
    });
  }

  function renderAll() {
    renderOverview();
    renderTutors();
    renderCenters();
    renderSettings();
  }

  async function refresh() {
    data = await request('dashboard');
    renderAll();
  }

  const TABS = [
    ['btnAdminTabReport', 'adminTabReport'],
    ['btnAdminTabTutors', 'adminTabTutors'],
    ['btnAdminTabCenters', 'adminTabCenters'],
    ['btnAdminTabSettings', 'adminTabSettings'],
  ];
  for (const [btnId, secId] of TABS) {
    Lab.on(btnId, 'click', () => {
      for (const [b, s] of TABS) {
        id(b)?.classList.toggle('active', b === btnId);
        const sec = id(s);
        if (sec) sec.style.display = s === secId ? 'block' : 'none';
      }
    });
  }

  function openTutorModal(existing = null) {
    const centers = activeCenters();
    const centerOpts = [['', 'Trực tiếp (không qua trung tâm)'], ...centers.map(c => [String(c.id), c.name])];
    openAdminModal(existing ? '<i class="fa-solid fa-user-pen" style="color:#2563EB;"></i> Sửa gia sư' : '<i class="fa-solid fa-user-plus" style="color:#2563EB;"></i> Thêm gia sư mới', [
      { name: 'name', label: 'Tên gia sư', value: existing?.name || '', required: true },
      ...(existing ? [] : [{ name: 'login', label: 'Mã đăng nhập (để trống để tự tạo)', value: '' }]),
      { name: 'phone', label: 'Số điện thoại', value: existing?.phone || '' },
      { name: 'center_id', label: 'Trung tâm giới thiệu', value: existing?.center_id ? String(existing.center_id) : '', options: centerOpts },
      { name: 'account_type', label: 'Gói tài khoản', value: existing?.account_type || 'trial', options: [['trial', 'Dùng thử'], ['standard', 'Tiêu chuẩn'], ['pro', 'Chuyên nghiệp']] },
      { name: 'next_billing_date', label: 'Hạn sử dụng', type: 'date', value: existing?.next_billing_date || '' },
      { name: 'password', label: existing ? 'Đổi mật khẩu mới (để trống nếu giữ nguyên)' : 'Mật khẩu / mã PIN (mặc định 123456)', type: 'password' },
    ], async values => {
      const body = { ...values };
      if (!body.center_id) body.center_id = null;
      if (!body.next_billing_date) delete body.next_billing_date;
      if (!body.password) delete body.password;
      await request(existing ? `tutors/${existing.id}` : 'tutors', existing ? 'PATCH' : 'POST', body);
      await refresh();
      notice(existing ? 'Đã cập nhật gia sư.' : 'Đã thêm gia sư mới.');
    });
  }

  function openCenterModal(existing = null) {
    openAdminModal(existing ? '<i class="fa-solid fa-building" style="color:#2563EB;"></i> Cập nhật trung tâm' : '<i class="fa-solid fa-building" style="color:#2563EB;"></i> Thêm trung tâm mới', [
      ...(existing ? [] : [{ name: 'code', label: 'Mã trung tâm', required: true }]),
      { name: 'name', label: 'Tên trung tâm', value: existing?.name || '', required: true },
      { name: 'contact', label: 'Thông tin liên hệ', value: existing?.contact || '' },
    ], async values => {
      await request(existing ? `centers/${existing.id}` : 'centers', existing ? 'PATCH' : 'POST', values);
      await refresh();
      notice(existing ? 'Đã cập nhật trung tâm.' : 'Đã thêm trung tâm mới.');
    });
  }

  Lab.on('btnRefreshAdmin', 'click', async () => { await refresh(); notice('Đã làm mới dữ liệu.'); });
  Lab.on('adminTutorSearchInput', 'input', renderTutors);
  Lab.on('adminTutorStatusFilter', 'change', renderTutors);
  Lab.on('adminTutorCenterFilter', 'change', renderTutors);
  Lab.on('btnOpenAddCenterModal', 'click', () => openCenterModal(null));

  Lab.commands({
    openAdminAccountModal: () => openAdminModal('<i class="fa-solid fa-user-shield" style="color:#2563EB;"></i> Tài khoản quản trị viên', [
      { name: 'name', label: 'Họ và tên', value: data.user.name, required: true },
      { name: 'phone', label: 'Số điện thoại', value: data.user.phone || '' },
      { name: 'current_password', label: 'Mật khẩu hiện tại (khi đổi mật khẩu)', type: 'password' },
      { name: 'password', label: 'Mật khẩu mới (để trống nếu giữ nguyên)', type: 'password' },
    ], async values => {
      const body = { name: values.name, phone: values.phone };
      if (values.password) {
        body.current_password = values.current_password;
        body.password = values.password;
      }
      const res = await request('account', 'PATCH', body);
      data.user = res.user;
      text('adminNameDisplay', 'Xin chào, ' + data.user.name);
      notice('Đã cập nhật tài khoản quản trị.');
    }),
    openAdminAddTutorModal: () => openTutorModal(null),
    editTutor: key => openTutorModal(data.tutors.find(t => t.id === Number(key))),
    renewTutor: key => {
      const tutor = data.tutors.find(t => t.id === Number(key));
      if (!tutor) return;
      openAdminModal(`<i class="fa-solid fa-bolt" style="color:#10B981;"></i> Gia hạn cho ${e(tutor.name)}`, [
        { name: 'days', label: 'Số ngày gia hạn', type: 'number', min: 1, value: 30, required: true },
        { name: 'amount', label: 'Phí thu (VNĐ)', type: 'number', min: 0, value: 199000, required: true },
        { name: 'account_type', label: 'Gói kích hoạt', value: 'standard', options: [['standard', 'Tiêu chuẩn'], ['pro', 'Chuyên nghiệp'], ['trial', 'Dùng thử']] },
        { name: 'note', label: 'Ghi chú giao dịch', value: 'Gia hạn định kỳ' },
      ], async values => {
        await request(`tutors/${tutor.id}/payments`, 'POST', values);
        await refresh();
        notice('Đã gia hạn tài khoản gia sư.');
      }, 'Xác nhận thu phí');
    },
    toggleTutorLock: async key => {
      const tutor = data.tutors.find(t => t.id === Number(key));
      if (!tutor) return;
      const nextStatus = tutor.status === 'locked' ? 'active' : 'locked';
      await request(`tutors/${tutor.id}`, 'PATCH', { status: nextStatus });
      await refresh();
      notice(nextStatus === 'locked' ? 'Đã khóa tài khoản gia sư.' : 'Đã mở khóa tài khoản gia sư.');
    },
    deleteTutor: key => openAdminModal('Chuyển gia sư vào thùng rác?', [], async () => {
      await request(`tutors/${key}`, 'DELETE');
      await refresh();
      notice('Đã chuyển gia sư vào thùng rác.');
    }, 'Xóa'),
    openTutorTrashModal: () => {
      const trashed = data.tutors.filter(t => t.deleted_at);
      const body = trashed.map(t => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:#F8FAFC;border:1px solid #E2E8F0;border-radius:10px;margin-bottom:8px;"><span><strong>${e(t.name)}</strong> (${e(t.login)})</span><button type="button" class="adm-btn-action btn-unlock" data-command="restoreTutor" data-key="${t.id}">Khôi phục</button></div>`).join('')
        || '<p style="color:#64748B;">Thùng rác gia sư trống.</p>';
      openAdminModal('Thùng rác Gia sư', [], null, '', body);
    },
    restoreTutor: async key => {
      await request(`tutors/${key}/restore`, 'POST', {});
      document.querySelector('.lab-admin-modal')?.remove();
      await refresh();
      notice('Đã khôi phục gia sư.');
    },
    cancelPayment: key => openAdminModal('Hủy giao dịch gia hạn này?', [], async () => {
      await request(`payments/${key}`, 'DELETE');
      await refresh();
      notice('Đã hủy giao dịch và khôi phục hạn cũ.');
    }, 'Xác nhận hủy'),
    editCenter: key => openCenterModal(data.centers.find(c => c.id === Number(key))),
    deleteCenter: key => openAdminModal('Xóa trung tâm này?', [], async () => {
      await request(`centers/${key}`, 'DELETE');
      await refresh();
      notice('Đã xóa trung tâm.');
    }, 'Xóa'),
  });

  renderAll();
})().catch(err => Lab.notice(err.message, true));
