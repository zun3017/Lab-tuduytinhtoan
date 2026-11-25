'use strict';
(async () => {
  const { id, all, text, html, escape: e, live, money, iso, month, date, request, notice, files } = Lab;
  let data = await Lab.dashboard(['tutor', 'admin']);
  if (!data) return;

  id('tutorDashboardBox').style.display = 'block';

  const WEEKDAYS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
  const THEMES = [
    ['theme-soft-blue-white-full', 'Soft Blue · Nền & bóng', '#3B82F6'],
    ['theme-soft-blue-white-minimal', 'Soft Blue · Tối giản', '#60A5FA'],
    ['theme-azure-mist-full', 'Azure Mist · Nền & bóng', '#0EA5E9'],
    ['theme-azure-mist-minimal', 'Azure Mist · Tối giản', '#38BDF8'],
    ['theme-woodland-cottage-full', 'Woodland Cottage · Nền & bóng', '#10B981'],
    ['theme-sage-blush-full', 'Sage Blush · Nền & bóng', '#EC4899'],
    ['theme-golden-caramel-full', 'Golden Caramel · Nền & bóng', '#F59E0B'],
    ['theme-pastel-alpine-full', 'Pastel Alpine · Nền & bóng', '#6366F1'],
    ['theme-claude-full', 'Claude · Ấm', '#D97706'],
    ['theme-dark-purple', 'Tím Đêm (Tối)', '#8E4DFF'],
    ['theme-dreamy-cosmic-full', 'Dreamy Cosmic (Tối)', '#7C3AED'],
    ['theme-neon-seoul-full', 'Neon Seoul (Tối)', '#EC4899'],
    ['theme-mystic-blue-full', 'Mystic Blue (Tối)', '#2563EB'],
  ];

  const PALETTE = [
    { bg: 'rgba(59,130,246,0.14)', border: '#3B82F6', text: '#1D4ED8' },
    { bg: 'rgba(16,185,129,0.14)', border: '#10B981', text: '#047857' },
    { bg: 'rgba(139,92,246,0.14)', border: '#8B5CF6', text: '#6D28D9' },
    { bg: 'rgba(245,158,11,0.14)', border: '#F59E0B', text: '#B45309' },
    { bg: 'rgba(236,72,153,0.14)', border: '#EC4899', text: '#BE185D' },
    { bg: 'rgba(6,182,212,0.14)', border: '#06B6D4', text: '#0E7490' },
  ];

  function studentStyle(name) {
    let h = 0;
    for (const ch of String(name || '')) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    return PALETTE[h % PALETTE.length];
  }
  const initialOf = name => String(name || '?').trim().split(/\s+/).pop().charAt(0).toUpperCase();

  const todayDate = new Date();
  let viewYear = todayDate.getFullYear();
  let viewMonth = todayDate.getMonth() + 1;
  let calendarLoaded = false;
  let hwSubTab = 'assign';
  let diaryStudentId = '';
  let diaryMonth = '';
  let reportStudentId = '';

  const ym = (y, m) => `${y}-${String(m).padStart(2, '0')}`;
  const studentMap = () => new Map(data.students.map(s => [s.id, s]));
  const classMap = () => new Map(live(data.classes).map(c => [c.id, c]));
  const activeStudents = () => live(data.students);
  const activeLessons = () => live(data.lessons);
  const activeSchedules = () => live(data.schedules);
  const activeAssignments = () => live(data.assignments);
  const activeSubmissions = () => live(data.submissions);

  function parseHours(start, end) {
    if (!start || !end) return 1.5;
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    return diff > 0 ? diff / 60 : 1.5;
  }

  function applyTheme() {
    Lab.theme(data.user.theme);
  }

  function openModal(titleHtml, fields, submit, submitLabel = 'Lưu', extraHtml = '') {
    document.querySelectorAll('.lab-tutor-modal').forEach(el => el.remove());
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay lab-tutor-modal';
    overlay.style.display = 'flex';
    const fieldsHtml = fields.map(f => {
      const n = e(f.name);
      const req = f.required ? 'required' : '';
      const mul = f.multiple ? 'multiple' : '';
      const min = f.min !== undefined ? `min="${e(f.min)}"` : '';
      const max = f.max !== undefined ? `max="${e(f.max)}"` : '';
      const step = f.step !== undefined ? `step="${e(f.step)}"` : '';
      let control;
      if (f.options) {
        control = `<select name="${n}" ${req}>${f.options.map(([v, t]) => `<option value="${e(v)}" ${String(v) === String(f.value) ? 'selected' : ''}>${e(t)}</option>`).join('')}</select>`;
      } else if (f.type === 'textarea') {
        control = `<textarea name="${n}" rows="3" ${req}>${e(f.value ?? '')}</textarea>`;
      } else if (f.type === 'file') {
        control = `<input type="file" name="${n}" ${req} ${mul}>`;
      } else {
        control = `<input type="${e(f.type || 'text')}" name="${n}" value="${e(f.value ?? '')}" ${req} ${min} ${max} ${step}>`;
      }
      return `<div class="modal-form-group"><label>${e(f.label)}${f.required ? ' <span style="color:#EF4444;">*</span>' : ''}</label>${control}</div>`;
    }).join('');

    overlay.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${titleHtml}</h3>
          <button type="button" class="modal-close" aria-label="Đóng">&times;</button>
        </div>
        ${extraHtml}
        <form id="labTutorModalForm">
          ${fieldsHtml}
          <p class="lab-error" role="alert" hidden style="margin-bottom:10px;"></p>
          <div class="modal-footer">
            <button type="button" class="modal-btn modal-btn-secondary">Đóng</button>
            ${submit ? `<button type="submit" class="modal-btn modal-btn-primary">${e(submitLabel)}</button>` : ''}
          </div>
        </form>
      </div>
    `;
    const close = () => overlay.remove();
    overlay.addEventListener('click', ev => { if (ev.target === overlay) close(); });
    overlay.querySelector('.modal-close').onclick = close;
    overlay.querySelector('.modal-btn-secondary').onclick = close;
    overlay.querySelector('form').onsubmit = async ev => {
      ev.preventDefault();
      if (!submit) return close();
      const form = ev.currentTarget;
      const btn = form.querySelector('.modal-btn-primary');
      const errEl = form.querySelector('.lab-error');
      errEl.hidden = true;
      btn.disabled = true;
      try {
        const fd = new FormData(form);
        await submit(Object.fromEntries(fd), fd);
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

  function renderProfile() {
    applyTheme();
    text('sidebarTutorName', data.user.name);
    text('mobileHeaderTutorName', data.user.name);
    text('tutorNameDisplay', 'Xin chào, ' + data.user.name);
    const avatarImg = id('sidebarAvatarImg');
    const avatarIcon = id('sidebarAvatarIcon');
    if (data.user.avatar_url) {
      avatarImg.src = data.user.avatar_url;
      avatarImg.style.display = 'block';
      avatarIcon.style.display = 'none';
    } else {
      avatarImg.style.display = 'none';
      avatarIcon.style.display = '';
    }
    const tutorMeta = data.tutors.find(t => t.id === data.user.id);
    const badgeLabel = tutorMeta && tutorMeta.account_type === 'trial' ? 'Dùng thử' : '';
    for (const bid of ['sidebarTutorStatusBadge', 'mobileHeaderTutorStatusBadge']) {
      const el = id(bid);
      if (!el) continue;
      if (badgeLabel) {
        el.textContent = badgeLabel;
        el.style.display = 'inline-block';
      } else {
        el.style.display = 'none';
      }
    }
  }

  function schedulesForDate(schedules, targetDate) {
    const isoStr = iso(targetDate);
    const jsDay = targetDate.getDay();
    const weekday = jsDay === 0 ? 7 : jsDay;
    return schedules
      .filter(s => s.date === isoStr || (!s.date && Number(s.weekday) === weekday))
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  function renderOverview() {
    const students = activeStudents();
    const lessons = activeLessons();
    const period = ym(viewYear, viewMonth);
    const monthLessons = lessons.filter(l => l.date.startsWith(period));
    const attended = monthLessons.filter(l => !/nghỉ|vắng/i.test(l.status));
    const schedules = activeSchedules();

    text('overviewMonthDisplay', `Tháng ${viewMonth}/${viewYear}`);
    const nextBtn = id('overviewNextMonthBtn');
    if (nextBtn) nextBtn.disabled = viewYear > todayDate.getFullYear() || (viewYear === todayDate.getFullYear() && viewMonth >= todayDate.getMonth() + 1);

    text('kpiStudentCount', students.length);
    text('kpiSessionLabel', `Buổi dạy tháng ${viewMonth}/${viewYear}`);
    text('kpiSessionCount', attended.length);

    let totalHours = 0;
    for (const l of attended) {
      const matchSched = schedules.find(s => s.student_id === l.student_id);
      totalHours += matchSched ? parseHours(matchSched.start_time, matchSched.end_time) : 1.5;
    }
    text('kpiTotalHours', `${Math.round(totalHours * 10) / 10}h`);
    text('kpiTuitionLabel', `Học phí tháng ${viewMonth}/${viewYear}`);
    text('kpiTuitionTotal', money(monthLessons.reduce((sum, l) => sum + Number(l.amount || 0), 0)));

    // Upcoming cards matching original ZunTutor UI
    const sMap = studentMap();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const renderCol = (listId, badgeId, list, emptyMsg, iconCls) => {
      text(badgeId, `${list.length} buổi`);
      html(listId, list.map(sc => {
        const stu = sMap.get(sc.student_id);
        const st = studentStyle(stu?.name || '');
        const border = sc.color || st.border;
        return `<div class="upcoming-session-card">
          <div class="upcoming-session-info">
            <span class="upcoming-student-tag" style="background:${st.bg};border-color:${e(border)};color:${st.text};"><i class="fa-solid fa-user-graduate"></i> ${e(stu ? stu.name : 'Ca dạy chung')}</span>
            <span class="upcoming-subject-badge"><i class="fa-solid fa-book-bookmark" style="color:var(--color-primary);"></i> ${e(sc.subject || 'Gia sư 1-1')}${sc.note ? ' (' + e(sc.note) + ')' : ''}</span>
          </div>
          <span class="upcoming-time-badge"><i class="fa-regular fa-clock"></i> ${e(sc.start_time)} - ${e(sc.end_time)}</span>
        </div>`;
      }).join('') || `<div class="upcoming-empty-card"><i class="${iconCls}" style="font-size:20px;color:#8E95BE;margin-bottom:6px;"></i><span>${e(emptyMsg)}</span></div>`);
    };
    renderCol('upcomingTodayList', 'upcomingTodayCountBadge', schedulesForDate(schedules, today), 'Không có lịch dạy hôm nay', 'fa-solid fa-face-smile-beam');
    renderCol('upcomingTomorrowList', 'upcomingTomorrowCountBadge', schedulesForDate(schedules, tomorrow), 'Không có lịch dạy ngày mai', 'fa-solid fa-mug-hot');

    // Charts
    const monthsCount = Number(id('revenuePeriodFilter')?.value || 12);
    const yearSelect = id('revenueYearFilter');
    if (yearSelect) {
      const years = [...new Set([todayDate.getFullYear(), todayDate.getFullYear() - 1, ...lessons.map(l => Number(l.date.slice(0, 4)))])].sort((a, b) => b - a);
      const prevYear = yearSelect.value;
      yearSelect.innerHTML = years.map(y => `<option value="${y}">Năm ${y}</option>`).join('');
      yearSelect.value = years.includes(Number(prevYear)) ? prevYear : String(viewYear);
    }
    const chosenYear = Number(yearSelect?.value || viewYear);
    const endMonth = chosenYear === todayDate.getFullYear() ? todayDate.getMonth() + 1 : 12;
    const startMonth = Math.max(1, endMonth - monthsCount + 1);
    const barLabels = [];
    const barValues = [];
    for (let m = startMonth; m <= endMonth; m++) {
      const key = ym(chosenYear, m);
      barLabels.push(`T${m}`);
      barValues.push(lessons.filter(l => l.date.startsWith(key)).reduce((sum, l) => sum + Number(l.amount || 0), 0));
    }
    text('revenueChartTitle', `Doanh thu ${barLabels.length} tháng (${chosenYear})`);
    text('revenuePeriodTotal', money(barValues.reduce((a, b) => a + b, 0)));
    Lab.chart('revenueBarChartCanvas', 'bar', barLabels, [{
      label: 'Học phí (VNĐ)',
      data: barValues,
      backgroundColor: '#3b82f6',
      borderRadius: 8,
    }]);

    const donutFilter = id('studentRevenueMonthFilter');
    const availablePeriods = [...new Set([period, month(), ...lessons.map(l => l.date.slice(0, 7))])].sort((a, b) => b.localeCompare(a));
    if (donutFilter) {
      const cur = donutFilter.value;
      donutFilter.innerHTML = availablePeriods.map(p => {
        const [y, m] = p.split('-');
        return `<option value="${e(p)}">Tháng ${Number(m)}/${y}</option>`;
      }).join('');
      donutFilter.value = availablePeriods.includes(cur) ? cur : period;
    }
    const chosenPeriod = donutFilter?.value || period;
    const periodLessons = lessons.filter(l => l.date.startsWith(chosenPeriod));
    const totals = students.map(s => ({
      student: s,
      total: periodLessons.filter(l => l.student_id === s.id).reduce((acc, l) => acc + Number(l.amount || 0), 0),
    })).filter(row => row.total > 0);
    const grand = totals.reduce((sum, r) => sum + r.total, 0);
    text('studentDonutTotalVal', money(grand));
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
    Lab.chart(
      'studentRevenueDonutCanvas',
      'doughnut',
      totals.length ? totals.map(r => r.student.name) : ['Chưa có dữ liệu'],
      [{ data: totals.length ? totals.map(r => r.total) : [1], backgroundColor: totals.length ? totals.map((_, i) => colors[i % colors.length]) : ['#e2e8f0'], borderWidth: 0 }],
      { cutout: '70%' }
    );
    html('studentRevenueList', totals.map((r, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 10px;border-radius:10px;background:var(--bg-input,#f8fafc);margin-bottom:6px;font-size:13px;">
        <span style="display:flex;align-items:center;gap:8px;font-weight:600;"><span style="width:10px;height:10px;border-radius:50%;background:${colors[i % colors.length]};"></span>${e(r.student.name)}</span>
        <strong style="color:var(--color-primary);">${money(r.total)}</strong>
      </div>
    `).join('') || '<p style="color:var(--text-muted);font-size:13px;">Chưa có học phí trong tháng đã chọn.</p>');

    // Weekly summary table
    const tbody = document.querySelector('#tutorScheduleTable tbody');
    const mobile = id('tutorScheduleMobile');
    if (!students.length) {
      if (tbody) tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--text-muted);padding:20px;">Chưa có học sinh.</td></tr>';
      if (mobile) mobile.innerHTML = '<div style="text-align:center;color:var(--text-muted);padding:15px;">Chưa có học sinh.</div>';
      return;
    }
    if (tbody) {
      tbody.innerHTML = students.map(s => {
        const st = studentStyle(s.name);
        const cells = [1, 2, 3, 4, 5, 6, 7].map(wd => {
          const matches = schedules.filter(sc => sc.student_id === s.id && Number(sc.weekday) === wd);
          const label = matches.map(m => `${m.start_time} - ${m.end_time}`).join('<br>');
          return `<td style="text-align:center;padding:10px;border-top:1px solid var(--border-card);">${label ? `<span style="display:inline-block;padding:4px 8px;border-radius:8px;background:${st.bg};color:${st.text};font-size:12px;font-weight:700;">${label}</span>` : '<span style="color:var(--text-muted);">—</span>'}</td>`;
        }).join('');
        return `<tr>
          <td style="padding:10px 14px;font-weight:700;border-top:1px solid var(--border-card);">${e(s.name)}</td>
          ${cells}
          <td style="text-align:center;padding:10px;border-top:1px solid var(--border-card);"><button type="button" class="btn-card-detail" style="padding:5px 10px;" data-command="openCal"><i class="fa-solid fa-pen"></i></button></td>
        </tr>`;
      }).join('');
    }
    if (mobile) {
      mobile.innerHTML = students.map(s => {
        const list = schedules.filter(sc => sc.student_id === s.id)
          .map(sc => `${sc.weekday ? WEEKDAYS[sc.weekday] : date(sc.date)}: ${sc.start_time}–${sc.end_time}`).join(' · ');
        return `<div class="student-profile-card" style="padding:14px;margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <strong>${e(s.name)}</strong>
            <button type="button" class="btn-card-detail" style="padding:5px 10px;" data-command="openCal">Mở lịch</button>
          </div>
          <div style="font-size:12.5px;color:var(--text-secondary);margin-top:6px;">${e(list || 'Chưa xếp lịch cố định')}</div>
        </div>`;
      }).join('');
    }
  }

  function renderReportsSection() {
    const box = id('tutorSectionReports');
    if (!box) return;
    const students = activeStudents();
    if (!reportStudentId && students.length) reportStudentId = String(students[0].id);
    const chosenStu = students.find(s => String(s.id) === reportStudentId) || students[0];
    const stuLessons = chosenStu ? activeLessons().filter(l => l.student_id === chosenStu.id).sort((a, b) => b.date.localeCompare(a.date)) : [];
    const stuAssigns = chosenStu ? activeAssignments().filter(a => a.student_id === chosenStu.id) : [];
    const stuSubs = chosenStu ? activeSubmissions().filter(s => s.student_id === chosenStu.id) : [];

    const totalFee = stuLessons.reduce((n, l) => n + Number(l.amount || 0), 0);
    const attended = stuLessons.filter(l => !/nghỉ|vắng/i.test(l.status)).length;
    const avgDG = stuLessons.filter(l => l.start_score != null);
    const avgVal = avgDG.length ? (avgDG.reduce((a, b) => a + Number(b.start_score), 0) / avgDG.length).toFixed(1) : '—';

    box.innerHTML = `
      <div class="report-filter-toolbar">
        <div class="report-toolbar-header">
          <h3><i class="fa-solid fa-file-image" style="color:var(--color-primary);"></i> <span>Xuất báo cáo học tập &amp; Lịch sử buổi học</span></h3>
          <p>Chọn học sinh để xem trước báo cáo tổng hợp và xuất ảnh PNG gửi phụ huynh</p>
        </div>
        <div class="report-filter-controls">
          <div class="report-control-group">
            <label class="report-control-label" for="reportStudentSelect"><i class="fa-solid fa-user-graduate"></i> Học sinh:</label>
            <select id="reportStudentSelect" class="report-input-box" style="min-width:200px;">
              ${students.map(s => `<option value="${s.id}" ${String(s.id) === reportStudentId ? 'selected' : ''}>${e(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="report-actions" style="display:flex;gap:10px;flex-wrap:wrap;">
            ${chosenStu ? `<button type="button" id="btnExportReportPng" class="btn-report-export"><i class="fa-solid fa-camera"></i> <span>Xuất ảnh PNG</span></button>
            <a class="btn-tuition-invoice" href="/preview-invoice.html?id=${Number(chosenStu.id)}" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-file-invoice-dollar"></i> Phiếu học phí</a>` : ''}
          </div>
        </div>
      </div>

      <div class="report-preview-wrapper" id="reportPreviewContainer">
        ${chosenStu ? `
          <div id="reportPrintableCard" style="background:var(--bg-card,#fff);border:1px solid var(--border-card);border-radius:18px;padding:22px;max-width:860px;margin:0 auto;">
            <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--border-card);padding-bottom:14px;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
              <div>
                <h3 style="margin:0;color:var(--text-primary);">${e(chosenStu.name)}</h3>
                <div style="font-size:13px;color:var(--text-secondary);">Phụ huynh: ${e(chosenStu.parent_name || '—')} · Mã ĐN: ${e(chosenStu.login)}</div>
              </div>
              <span class="tuition-status-badge status-paid">Tổng hợp học tập</span>
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin-bottom:18px;">
              <div class="card-metric-box"><div class="card-metric-val text-green">${attended}/${stuLessons.length}</div><div class="card-metric-lbl">Buổi có mặt</div></div>
              <div class="card-metric-box"><div class="card-metric-val" style="color:var(--color-primary);">${avgVal}</div><div class="card-metric-lbl">TB điểm đầu giờ</div></div>
              <div class="card-metric-box"><div class="card-metric-val">${stuSubs.length}/${stuAssigns.length}</div><div class="card-metric-lbl">Bài tập đã nộp</div></div>
              <div class="card-metric-box"><div class="card-metric-val text-amber">${money(totalFee)}</div><div class="card-metric-lbl">Tổng học phí</div></div>
            </div>
            <div class="table-wrapper">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead><tr>
                  <th style="text-align:left;padding:10px;background:var(--nav-active-bg);">Ngày</th>
                  <th style="text-align:left;padding:10px;background:var(--nav-active-bg);">Nội dung</th>
                  <th style="text-align:left;padding:10px;background:var(--nav-active-bg);">Nhận xét</th>
                  <th style="text-align:center;padding:10px;background:var(--nav-active-bg);">Điểm</th>
                  <th style="text-align:center;padding:10px;background:var(--nav-active-bg);">Trạng thái</th>
                </tr></thead>
                <tbody>
                  ${stuLessons.map(l => `<tr>
                    <td style="padding:10px;border-bottom:1px solid var(--border-card);white-space:nowrap;">${e(date(l.date))}</td>
                    <td style="padding:10px;border-bottom:1px solid var(--border-card);">${e(l.content || '—')}</td>
                    <td style="padding:10px;border-bottom:1px solid var(--border-card);">${e(l.evaluation || '—')}</td>
                    <td style="padding:10px;border-bottom:1px solid var(--border-card);text-align:center;font-weight:700;">${e(l.start_score ?? '—')}</td>
                    <td style="padding:10px;border-bottom:1px solid var(--border-card);text-align:center;">${e(l.status)}</td>
                  </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:16px;">Chưa có buổi học nào.</td></tr>'}
                </tbody>
              </table>
            </div>
          </div>
        ` : '<div style="text-align:center;color:var(--text-muted);padding:30px;">Chưa có học sinh để lập báo cáo.</div>'}
      </div>
    `;

    id('reportStudentSelect')?.addEventListener('change', ev => {
      reportStudentId = ev.target.value;
      renderReportsSection();
    });
    id('btnExportReportPng')?.addEventListener('click', async () => {
      const card = id('reportPrintableCard');
      if (!card || !window.html2canvas) return;
      const canvas = await window.html2canvas(card, { scale: 2, logging: false });
      const link = document.createElement('a');
      link.download = `Bao-cao-${chosenStu.login}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  function renderDiarySection() {
    const box = id('tutorSectionDiary');
    if (!box) return;
    const students = activeStudents();
    const sMap = studentMap();
    if (diaryStudentId && !students.some(s => String(s.id) === diaryStudentId)) diaryStudentId = '';
    const selectedStu = students.find(s => String(s.id) === diaryStudentId) || students[0] || null;

    const allLessons = activeLessons().slice().sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const months = [...new Set(allLessons.map(l => l.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
    const filteredLessons = allLessons.filter(l =>
      (!diaryStudentId || String(l.student_id) === diaryStudentId) &&
      (!diaryMonth || l.date.startsWith(diaryMonth))
    );

    const feedbacks = live(data.feedback).filter(f => !diaryStudentId || String(f.student_id) === diaryStudentId).slice().reverse();
    const assigns = activeAssignments().filter(a => !diaryStudentId || String(a.student_id) === diaryStudentId).slice().sort((a, b) => b.id - a.id);
    const subs = activeSubmissions().filter(s => !diaryStudentId || String(s.student_id) === diaryStudentId).slice().sort((a, b) => b.id - a.id);
    const assignMap = new Map(activeAssignments().map(a => [a.id, a]));

    box.innerHTML = `
      <div class="diary-toolbar">
        <div class="diary-toolbar-title">
          <h3 style="color:var(--text-primary);font-size:18px;margin:0;display:flex;align-items:center;gap:8px;">
            <i class="fa-solid fa-book-open" style="color:var(--color-primary);"></i>
            <span>Nhật ký buổi học, Bài tập &amp; Nhận xét</span>
          </h3>
          <p style="color:var(--text-secondary);font-size:13px;margin:4px 0 0 0;">Theo dõi tiến độ bài học, giao bài tập, chấm bài và gửi thông báo cho phụ huynh</p>
        </div>
        <div class="diary-filters">
          <div class="diary-filter-item">
            <label for="diaryStudentFilter"><i class="fa-solid fa-user-graduate"></i> Học sinh:</label>
            <select id="diaryStudentFilter">
              <option value="">Tất cả học sinh</option>
              ${students.map(s => `<option value="${s.id}" ${String(s.id) === diaryStudentId ? 'selected' : ''}>${e(s.name)}</option>`).join('')}
            </select>
          </div>
          <div class="diary-filter-item">
            <label for="diaryMonthFilter"><i class="fa-solid fa-calendar-days"></i> Tháng:</label>
            <select id="diaryMonthFilter">
              <option value="">Tất cả các tháng</option>
              ${months.map(m => `<option value="${e(m)}" ${m === diaryMonth ? 'selected' : ''}>Tháng ${Number(m.slice(5))}/${m.slice(0, 4)}</option>`).join('')}
            </select>
          </div>
          <div class="diary-count-pill">${filteredLessons.length} buổi học</div>
        </div>
      </div>

      ${selectedStu ? `
      <div id="tutorQuickAnnouncementWidget" style="background:var(--nav-active-bg);border:1px dashed var(--border-color);border-radius:12px;padding:15px;margin:18px 0;display:flex;flex-direction:column;gap:10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:var(--text-secondary);font-size:13.5px;font-weight:700;"><i class="fa-solid fa-bullhorn" style="color:var(--color-primary);"></i> Thông báo nhanh cho phụ huynh (${e(selectedStu.name)})</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <input type="text" id="quickAnnouncementInput" value="${e(selectedStu.announcement || '')}" placeholder="Ví dụ: Mang theo sách bài tập nâng cao..." style="flex:1;min-width:240px;padding:10px 14px;border-radius:8px;border:1px solid var(--border-color);background:var(--bg-input);color:var(--text-primary);font-size:13.5px;">
          <button type="button" class="modal-btn modal-btn-primary" style="width:auto;padding:10px 18px;" data-command="saveQuickAnn" data-key="${selectedStu.id}"><i class="fa-solid fa-paper-plane"></i> Lưu thông báo</button>
        </div>
      </div>` : ''}

      <div id="tutorFeedbackContainer" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:14px;padding:16px 20px;margin-bottom:20px;">
        <h4 style="margin:0 0 12px;font-size:14.5px;color:var(--text-primary);display:flex;align-items:center;gap:8px;"><i class="fa-regular fa-comment-dots" style="color:var(--color-primary);"></i> Ý kiến phản hồi của Phụ huynh (${feedbacks.length})</h4>
        <div style="display:flex;flex-direction:column;gap:8px;">
          ${feedbacks.map(f => {
            const stu = sMap.get(f.student_id);
            return `<div style="background:var(--bg-input);border:1px solid var(--border-card);border-radius:10px;padding:10px 14px;display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;">
              <span><strong>${e(stu ? stu.name : 'Học sinh')}:</strong> ${e(f.content)}</span>
              <span style="font-size:12px;color:var(--text-secondary);">${e(date(f.created_at))}</span>
            </div>`;
          }).join('') || '<div style="color:var(--text-muted);font-size:13px;">Chưa có phản hồi từ phụ huynh.</div>'}
        </div>
      </div>

      <div id="tutorHomeworkSection" style="margin-bottom:24px;">
        <div class="hw-tutor-container" style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;border-bottom:1px solid var(--border-card);padding-bottom:12px;margin-bottom:16px;">
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button type="button" class="tutor-hw-tab ${hwSubTab === 'assign' ? 'active' : ''}" data-command="switchHwTab" data-key="assign"><i class="fa-solid fa-pen-ruler"></i> Bài tập đã giao (${assigns.length})</button>
              <button type="button" class="tutor-hw-tab ${hwSubTab === 'submit' ? 'active' : ''}" data-command="switchHwTab" data-key="submit"><i class="fa-solid fa-graduation-cap"></i> Học sinh nộp bài (${subs.length})</button>
            </div>
            <button type="button" class="modal-btn modal-btn-primary" style="width:auto;padding:8px 16px;" data-command="addAssign"><i class="fa-solid fa-plus"></i> Giao bài tập mới</button>
          </div>

          ${hwSubTab === 'assign' ? `
            <div class="table-wrapper">
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr>
                  <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Học sinh</th>
                  <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Tiêu đề</th>
                  <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Hạn nộp</th>
                  <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Tệp đề bài</th>
                  <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Thao tác</th>
                </tr></thead>
                <tbody>
                  ${assigns.map(a => {
                    const stu = sMap.get(a.student_id);
                    return `<tr>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);font-weight:600;">${e(stu ? stu.name : '')}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);"><strong>${e(a.title)}</strong>${a.description ? `<div style="font-size:12px;color:var(--text-secondary);">${e(a.description)}</div>` : ''}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;">${e(date(a.due_date))}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);">${files(a.files) || '—'}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;">
                        <button type="button" class="btn-card-detail" style="padding:5px 10px;" data-command="editAssign" data-key="${a.id}">Sửa</button>
                        <button type="button" class="btn-card-detail" style="padding:5px 10px;color:#EF4444;" data-command="deleteAssign" data-key="${a.id}">Xóa</button>
                      </td>
                    </tr>`;
                  }).join('') || '<tr><td colspan="5" style="text-align:center;padding:18px;color:var(--text-muted);">Chưa có bài tập nào.</td></tr>'}
                </tbody>
              </table>
            </div>
          ` : `
            <div class="table-wrapper">
              <table style="width:100%;border-collapse:collapse;">
                <thead><tr>
                  <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Ngày nộp</th>
                  <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Học sinh &amp; Bài tập</th>
                  <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Bài làm &amp; Tệp</th>
                  <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Điểm &amp; Nhận xét</th>
                  <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Thao tác</th>
                </tr></thead>
                <tbody>
                  ${subs.map(sub => {
                    const stu = sMap.get(sub.student_id);
                    const asn = assignMap.get(sub.assignment_id);
                    return `<tr>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);white-space:nowrap;">${e(date(sub.submitted_at))}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);"><strong>${e(stu ? stu.name : '')}</strong><div style="font-size:12px;color:var(--text-secondary);">${e(asn ? asn.title : 'Bài tập')}</div></td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);"><div>${e(sub.content || '')}</div>${files(sub.files)}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;">${sub.score != null ? `<span class="tuition-status-badge status-paid">${sub.score}/10</span><div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${e(sub.comment || '')}</div>` : '<span class="tuition-status-badge status-unpaid">Chờ chấm</span>'}</td>
                      <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;">
                        <button type="button" class="btn-tuition-invoice" data-command="gradeSub" data-key="${sub.id}">${sub.score != null ? 'Sửa điểm' : 'Chấm bài'}</button>
                      </td>
                    </tr>`;
                  }).join('') || '<tr><td colspan="5" style="text-align:center;padding:18px;color:var(--text-muted);">Chưa có bài nộp nào.</td></tr>'}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>

      <div class="schedule-section">
        <h3 style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin-bottom:14px;">
          <span style="display:flex;align-items:center;gap:10px;"><i class="fa-solid fa-clock-rotate-left" style="color:var(--color-primary);"></i> Lịch sử buổi học &amp; Điểm danh</span>
          <button type="button" class="btn-refresh-history" data-command="addLesson" style="background:var(--btn-bg);border:none;color:var(--btn-text);font-weight:bold;border-radius:20px;padding:8px 18px;display:inline-flex;align-items:center;gap:6px;box-shadow:var(--shadow-primary);cursor:pointer;"><i class="fa-solid fa-calendar-plus"></i> Thêm buổi học</button>
        </h3>
        <div class="table-wrapper">
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr>
              <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Ngày</th>
              <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Học sinh</th>
              <th style="text-align:left;padding:10px 12px;background:var(--nav-active-bg);">Nội dung &amp; Nhận xét</th>
              <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Điểm (ĐG/ĐK)</th>
              <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Trạng thái</th>
              <th style="text-align:center;padding:10px 12px;background:var(--nav-active-bg);">Thao tác</th>
            </tr></thead>
            <tbody>
              ${filteredLessons.map(l => {
                const stu = sMap.get(l.student_id);
                return `<tr>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);white-space:nowrap;">${e(date(l.date))}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);font-weight:700;">${e(stu ? stu.name : '')}<div style="font-size:11.5px;color:var(--text-secondary);">${e(l.subject || '')}</div></td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);"><div>${e(l.content || '—')}</div><div style="font-size:12px;color:var(--text-secondary);font-style:italic;">${e(l.evaluation || '')}</div></td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;font-weight:700;">${e(l.start_score ?? '—')} / ${e(l.exam_score ?? '—')}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;">${e(l.status)}</td>
                  <td style="padding:10px 12px;border-bottom:1px solid var(--border-card);text-align:center;">
                    <button type="button" class="btn-card-detail" style="padding:5px 10px;" data-command="editLesson" data-key="${l.id}">Sửa</button>
                    <button type="button" class="btn-card-detail" style="padding:5px 10px;color:#EF4444;" data-command="deleteLesson" data-key="${l.id}">Xóa</button>
                  </td>
                </tr>`;
              }).join('') || '<tr><td colspan="6" style="text-align:center;padding:18px;color:var(--text-muted);">Chưa có buổi học nào.</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;

    id('diaryStudentFilter')?.addEventListener('change', ev => { diaryStudentId = ev.target.value; renderDiarySection(); });
    id('diaryMonthFilter')?.addEventListener('change', ev => { diaryMonth = ev.target.value; renderDiarySection(); });
  }

  function renderStudentsSection() {
    const students = activeStudents();
    const classes = classMap();
    const lessons = activeLessons();
    const schedules = activeSchedules();
    const grid = id('tutorStudentsGrid');
    if (!grid) return;

    const curPeriod = ym(viewYear, viewMonth);
    grid.innerHTML = students.map(s => {
      const st = studentStyle(s.name);
      const cls = classes.get(s.class_id);
      const monthSessions = lessons.filter(l => l.student_id === s.id && l.date.startsWith(curPeriod) && !/nghỉ|vắng/i.test(l.status)).length;
      const allStuLessons = lessons.filter(l => l.student_id === s.id && !/nghỉ|vắng/i.test(l.status));
      const doneHw = allStuLessons.filter(l => /hoàn thành|đủ|đã làm|tốt|đạt/i.test(l.homework_status || '')).length;
      const hwRate = allStuLessons.length ? `${Math.round((100 * doneHw) / allStuLessons.length)}%` : '—';
      const schedSummary = schedules.filter(sc => sc.student_id === s.id)
        .map(sc => `${sc.weekday ? WEEKDAYS[sc.weekday] : date(sc.date)}: ${sc.start_time}–${sc.end_time}`).join(' · ') || 'Chưa xếp lịch cố định';

      return `<div class="student-profile-card">
        <div class="student-card-header">
          <div class="student-initial-avatar" style="background:${st.bg};border:2px solid ${st.border};color:${st.text};">${e(initialOf(s.name))}</div>
          <div class="student-card-info">
            <div class="student-card-name" title="${e(s.name)}">${e(s.name)}</div>
            <div class="student-card-sub"><i class="fa-solid fa-graduation-cap" style="color:var(--color-primary);"></i> ${e(cls ? cls.name : 'Kèm 1-1')} · ĐN: ${e(s.login)} · BT: ${e(s.homework_code)}</div>
          </div>
        </div>
        <div class="student-card-schedule" title="${e(schedSummary)}">
          <i class="fa-regular fa-clock"></i>
          <span>${e(schedSummary)}</span>
        </div>
        <div class="student-card-metrics">
          <div class="card-metric-box">
            <div class="card-metric-val text-green">${monthSessions}</div>
            <div class="card-metric-lbl">Buổi tháng ${viewMonth}</div>
          </div>
          <div class="card-metric-box">
            <div class="card-metric-val" style="color:var(--text-primary);">${hwRate}</div>
            <div class="card-metric-lbl">Nộp BTVN</div>
          </div>
          <div class="card-metric-box">
            <div class="card-metric-val text-amber">${money(s.tuition)}</div>
            <div class="card-metric-lbl">Học phí/buổi</div>
          </div>
        </div>
        <div class="student-card-actions">
          <button type="button" class="btn-card-detail" data-command="editStudent" data-key="${s.id}"><i class="fa-solid fa-user-pen"></i> Chỉnh sửa</button>
          <button type="button" class="btn-card-diary" data-command="goDiary" data-key="${s.id}"><i class="fa-solid fa-book-open"></i> Nhật ký</button>
          <button type="button" class="btn-card-detail" style="color:#EF4444;" data-command="deleteStudent" data-key="${s.id}" title="Xóa học sinh"><i class="fa-solid fa-trash-can"></i></button>
        </div>
      </div>`;
    }).join('') || `<div style="grid-column:1/-1;" class="empty-state"><div class="empty-state-title">Chưa có học sinh nào</div><button type="button" class="empty-state-btn" data-command="openAddStudentModal"><i class="fa-solid fa-plus"></i> Thêm học sinh</button></div>`;
  }

  function renderTuitionSection() {
    const input = id('tuitionMonth');
    if (input && !input.value) input.value = month();
    const chosenMonth = input?.value || month();
    const students = activeStudents();
    const classes = classMap();
    const lessons = activeLessons().filter(l => l.date.startsWith(chosenMonth));

    const expected = lessons.reduce((sum, l) => sum + Number(l.amount || 0), 0);
    const collected = lessons.filter(l => l.paid).reduce((sum, l) => sum + Number(l.amount || 0), 0);
    text('tuitionTotalExpected', money(expected));
    text('tuitionTotalCollected', money(collected));
    text('tuitionTotalPending', money(expected - collected));

    const rowsData = students.map(s => {
      const stuLessons = lessons.filter(l => l.student_id === s.id);
      const total = stuLessons.reduce((sum, l) => sum + Number(l.amount || 0), 0);
      const unpaidIds = stuLessons.filter(l => !l.paid).map(l => l.id);
      const isPaid = stuLessons.length > 0 && unpaidIds.length === 0;
      return { student: s, cls: classes.get(s.class_id), count: stuLessons.length, total, isPaid };
    });

    const tbody = id('tuitionTableBody');
    if (tbody) {
      tbody.innerHTML = rowsData.map(r => {
        const st = studentStyle(r.student.name);
        const statusBtn = r.count === 0
          ? '<span style="color:var(--text-muted);font-size:12px;">Chưa có buổi</span>'
          : (r.isPaid
            ? `<button type="button" class="tuition-status-badge status-paid" data-command="toggleTuition" data-key="${r.student.id}|0"><i class="fa-solid fa-circle-check"></i> Đã thu</button>`
            : `<button type="button" class="tuition-status-badge status-unpaid" data-command="toggleTuition" data-key="${r.student.id}|1"><i class="fa-solid fa-clock"></i> Chưa thu</button>`);
        return `<tr style="border-bottom:1px solid var(--border-card);">
          <td style="padding:12px 14px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <span style="background:${st.bg};border:1px solid ${st.border};color:${st.text};width:32px;height:32px;border-radius:50%;font-size:13px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;">${e(initialOf(r.student.name))}</span>
              <div>
                <div style="font-weight:700;color:var(--text-primary);font-size:14px;">${e(r.student.name)}</div>
                <div style="font-size:11.5px;color:var(--text-secondary);">${e(r.cls ? r.cls.name : 'Kèm 1-1')}</div>
              </div>
            </div>
          </td>
          <td style="padding:12px 10px;text-align:center;"><span style="background:var(--nav-active-bg);color:var(--text-heading);border:1px solid var(--border-color);padding:4px 10px;border-radius:12px;font-size:12.5px;font-weight:700;">${r.count} buổi</span></td>
          <td style="padding:12px 10px;text-align:right;color:var(--text-secondary);font-size:13px;font-weight:600;">${money(r.student.tuition)}/buổi</td>
          <td style="padding:12px 14px;text-align:right;color:var(--color-primary);font-size:15px;font-weight:800;">${money(r.total)}</td>
          <td style="padding:12px 10px;text-align:center;">${statusBtn}</td>
          <td style="padding:12px 14px;text-align:center;"><a class="btn-tuition-invoice" href="/preview-invoice.html?id=${Number(r.student.id)}&amp;month=${encodeURIComponent(chosenMonth)}" style="text-decoration:none;"><i class="fa-solid fa-file-invoice-dollar"></i> Xem hóa đơn</a></td>
        </tr>`;
      }).join('') || '<tr><td colspan="6" style="text-align:center;color:var(--text-muted);padding:25px;">Chưa có dữ liệu học phí.</td></tr>';
    }

    const mobile = id('tuitionMobileList');
    if (mobile) {
      mobile.innerHTML = rowsData.map(r => {
        const st = studentStyle(r.student.name);
        const statusBtn = r.count === 0 ? '' : (r.isPaid
          ? `<button type="button" class="tuition-status-badge status-paid" data-command="toggleTuition" data-key="${r.student.id}|0"><i class="fa-solid fa-circle-check"></i> Đã thu</button>`
          : `<button type="button" class="tuition-status-badge status-unpaid" data-command="toggleTuition" data-key="${r.student.id}|1"><i class="fa-solid fa-clock"></i> Chưa thu</button>`);
        return `<div class="student-profile-card" style="padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="background:${st.bg};border:1px solid ${st.border};color:${st.text};width:30px;height:30px;border-radius:50%;font-size:12px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;">${e(initialOf(r.student.name))}</span>
              <strong>${e(r.student.name)}</strong>
            </div>
            ${statusBtn}
          </div>
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:10px;"><span>${r.count} buổi · ${money(r.student.tuition)}</span><strong style="color:var(--color-primary);">${money(r.total)}</strong></div>
          <a class="btn-tuition-invoice" style="width:100%;justify-content:center;text-decoration:none;display:inline-flex;" href="/preview-invoice.html?id=${Number(r.student.id)}&amp;month=${encodeURIComponent(chosenMonth)}"><i class="fa-solid fa-file-invoice-dollar"></i> Xem chi tiết hóa đơn</a>
        </div>`;
      }).join('');
    }
  }

  function renderAll() {
    renderProfile();
    renderOverview();
    renderReportsSection();
    renderDiarySection();
    renderStudentsSection();
    renderTuitionSection();
  }

  async function refresh() {
    data = await request('dashboard');
    renderAll();
  }

  const SECTION_MAP = {
    overview: 'tutorSectionOverview',
    reports: 'tutorSectionReports',
    diary: 'tutorSectionDiary',
    calendar: 'tutorSectionCalendar',
    students: 'tutorSectionStudents',
    tuition: 'tutorSectionTuition',
  };

  function switchTab(tab) {
    if (!SECTION_MAP[tab]) return;
    for (const [key, secId] of Object.entries(SECTION_MAP)) {
      const el = id(secId);
      if (el) el.style.display = key === tab ? (key === 'calendar' ? 'flex' : 'block') : 'none';
    }
    for (const navBtn of all('.sidebar-nav-item[data-tab], .zt-bnav-item[data-tab]')) {
      navBtn.classList.toggle('active', navBtn.dataset.tab === tab);
    }
    if (tab === 'calendar' && !calendarLoaded) {
      const frame = id('tutorCalendarIframe');
      if (frame) {
        frame.src = '/tutor-calendar.html?embed=1';
        calendarLoaded = true;
      }
    }
    setMobileSidebar(false);
  }

  function setMobileSidebar(open) {
    id('tutorSidebar')?.classList.toggle('sidebar-open', open);
    id('tutorSidebar')?.classList.toggle('mobile-open', open);
    id('tutorSidebarOverlay')?.classList.toggle('active', open);
  }

  function openThemeDialog() {
    document.querySelectorAll('.lab-tutor-modal').forEach(el => el.remove());
    const cur = data.user.theme || 'theme-soft-blue-white-full';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay lab-tutor-modal';
    overlay.style.display = 'flex';
    overlay.innerHTML = `
      <div class="modal-content" style="max-width:620px;">
        <div class="modal-header">
          <h3><i class="fa-solid fa-palette"></i> Đổi chủ đề giao diện</h3>
          <button type="button" class="modal-close">&times;</button>
        </div>
        <div class="theme-full-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px;max-height:58vh;overflow-y:auto;">
          ${THEMES.map(([cls, label, dot]) => `
            <button type="button" class="theme-full-item ${cls === cur ? 'active' : ''}" data-theme-pick="${e(cls)}" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid ${cls === cur ? 'var(--color-primary)' : 'var(--border-card)'};background:var(--bg-input);cursor:pointer;text-align:left;color:var(--text-primary);">
              <span style="width:18px;height:18px;border-radius:50%;background:${dot};flex-shrink:0;"></span>
              <span style="font-size:12.5px;font-weight:600;">${e(label)}</span>
            </button>
          `).join('')}
        </div>
      </div>
    `;
    const close = () => overlay.remove();
    overlay.addEventListener('click', ev => { if (ev.target === overlay) close(); });
    overlay.querySelector('.modal-close').onclick = close;
    overlay.querySelectorAll('[data-theme-pick]').forEach(btn => {
      btn.onclick = async () => {
        const res = await request('account', 'PATCH', { theme: btn.dataset.themePick });
        data.user = res.user;
        applyTheme();
        const frame = id('tutorCalendarIframe');
        if (frame?.contentDocument) frame.contentDocument.documentElement.className = document.documentElement.className;
        close();
        notice('Đã áp dụng chủ đề giao diện.');
      };
    });
    document.body.append(overlay);
  }

  function openAccountDialog() {
    const dlg = openModal('<i class="fa-solid fa-user-gear"></i> Tài khoản của tôi', [
      { name: 'name', label: 'Họ và tên gia sư', value: data.user.name, required: true },
      { name: 'phone', label: 'Số điện thoại', value: data.user.phone || '' },
      { name: 'current_password', label: 'Mật khẩu / PIN hiện tại (khi đổi mật khẩu)', type: 'password' },
      { name: 'password', label: 'Mật khẩu / PIN mới (để trống nếu giữ nguyên)', type: 'password' },
    ], async values => {
      const body = { name: values.name, phone: values.phone };
      if (values.password) {
        body.current_password = values.current_password;
        body.password = values.password;
      }
      const res = await request('account', 'PATCH', body);
      data.user = res.user;
      renderProfile();
      notice('Đã cập nhật tài khoản.');
    }, 'Lưu thay đổi');

    const form = dlg.querySelector('form');
    const avatarBox = document.createElement('div');
    avatarBox.className = 'modal-form-group';
    avatarBox.style.marginTop = '12px';
    avatarBox.innerHTML = `<label>Ảnh đại diện mới</label><div style="display:flex;gap:8px;align-items:center;"><input type="file" id="labAvatarInput" accept="image/png,image/jpeg,image/webp,image/gif"><button type="button" class="modal-btn modal-btn-secondary" id="labAvatarUploadBtn" style="white-space:nowrap;">Tải ảnh</button></div>`;
    form.before(avatarBox);
    dlg.querySelector('#labAvatarUploadBtn').onclick = async () => {
      const file = dlg.querySelector('#labAvatarInput').files[0];
      if (!file) return notice('Hãy chọn ảnh đại diện.', true);
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await request('account/avatar', 'POST', fd);
      data.user = res.user;
      renderProfile();
      dlg.remove();
      notice('Đã cập nhật ảnh đại diện.');
    };
  }

  function openClassSettingsDialog() {
    const classes = live(data.classes);
    const listHtml = `<div class="modal-form-group"><label>Các lớp hiện có</label><div style="display:flex;flex-direction:column;gap:8px;">${
      classes.map(c => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--bg-input);border:1px solid var(--border-card);border-radius:10px;"><strong>${e(c.name)}</strong><button type="button" class="btn-card-detail" style="padding:4px 10px;color:#EF4444;" data-command="deleteClass" data-key="${c.id}">Xóa</button></div>`).join('')
      || '<span style="color:var(--text-muted);font-size:13px;">Chưa có lớp học nào.</span>'
    }</div></div>`;
    openModal('<i class="fa-solid fa-gear"></i> Quản lý lớp học', [
      { name: 'name', label: 'Tên lớp học mới', required: true },
    ], async values => {
      await request('classes', 'POST', { name: values.name });
      await refresh();
      notice('Đã thêm lớp học mới.');
    }, 'Thêm lớp', listHtml);
  }

  function openStudentModal(existing = null) {
    const classes = live(data.classes);
    const classOptions = [['', 'Kèm 1-1 (không xếp lớp)'], ...classes.map(c => [String(c.id), c.name])];
    const fields = [
      { name: 'name', label: 'Họ và tên học sinh', value: existing?.name || '', required: true },
      ...(existing ? [] : [{ name: 'login', label: 'Mã đăng nhập (để trống để tự tạo)', value: '' }]),
      { name: 'phone', label: 'Số điện thoại phụ huynh', value: existing?.phone || '' },
      { name: 'parent_name', label: 'Họ và tên phụ huynh', value: existing?.parent_name || '' },
      { name: 'class_id', label: 'Lớp học', value: existing?.class_id ? String(existing.class_id) : '', options: classOptions },
      { name: 'tuition', label: 'Mức học phí / buổi (VNĐ)', type: 'number', min: 0, value: existing?.tuition ?? 150000, required: true },
      { name: 'homework_code', label: 'Mã bài tập (để trống để tự tạo)', value: existing?.homework_code || '' },
      { name: 'announcement', label: 'Thông báo gửi phụ huynh/học sinh', type: 'textarea', value: existing?.announcement || '' },
      { name: 'password', label: existing ? 'Đổi mã PIN mới (để trống nếu giữ nguyên)' : 'Mã PIN đăng nhập (mặc định 123456)', type: 'password' },
    ];
    openModal(existing ? '<i class="fa-solid fa-user-pen"></i> Chỉnh sửa học sinh' : '<i class="fa-solid fa-user-plus"></i> Thêm học sinh mới', fields, async values => {
      const body = { ...values };
      if (!body.class_id) body.class_id = null;
      if (!body.password) delete body.password;
      if (existing && !body.homework_code) delete body.homework_code;
      await request(existing ? `students/${existing.id}` : 'students', existing ? 'PATCH' : 'POST', body);
      await refresh();
      notice(existing ? 'Đã cập nhật hồ sơ học sinh.' : 'Đã thêm học sinh mới.');
    });
  }

  function openAssignModal(existing = null, defaultStudentId = '') {
    const students = activeStudents();
    if (!students.length) return notice('Cần thêm ít nhất một học sinh trước khi giao bài.', true);
    const fields = [
      ...(existing ? [] : [{
        name: 'student_id',
        label: 'Học sinh',
        value: String(defaultStudentId || diaryStudentId || students[0].id),
        options: students.map(s => [String(s.id), s.name]),
        required: true,
      }]),
      { name: 'title', label: 'Tên bài tập', value: existing?.title || '', required: true },
      { name: 'description', label: 'Hướng dẫn / yêu cầu', type: 'textarea', value: existing?.description || '' },
      { name: 'release_date', label: 'Ngày phát hành', type: 'date', value: existing?.release_date || iso(), required: true },
      { name: 'due_date', label: 'Hạn nộp bài', type: 'date', value: existing?.due_date || '' },
      { name: 'files', label: 'Tệp bài tập (Hình ảnh, Word, PDF...)', type: 'file', multiple: true },
    ];
    openModal(existing ? '<i class="fa-solid fa-pen-ruler"></i> Sửa bài tập' : '<i class="fa-solid fa-folder-plus"></i> Đăng tải bài tập mới', fields, async (_values, formData) => {
      await request(existing ? `assignments/${existing.id}` : 'assignments', existing ? 'PATCH' : 'POST', formData);
      await refresh();
      notice(existing ? 'Đã cập nhật bài tập.' : 'Đã giao bài tập cho học sinh.');
    }, existing ? 'Lưu bài tập' : 'Giao bài');
  }

  function openLessonModal(existing = null, defaultStudentId = '') {
    const students = activeStudents();
    if (!students.length) return notice('Cần thêm học sinh trước khi ghi nhật ký.', true);
    const stu = students.find(s => String(s.id) === String(defaultStudentId || diaryStudentId)) || students[0];
    const fields = [
      ...(existing ? [] : [{
        name: 'student_id',
        label: 'Học sinh',
        value: String(stu.id),
        options: students.map(s => [String(s.id), s.name]),
        required: true,
      }]),
      { name: 'date', label: 'Ngày dạy', type: 'date', value: existing?.date || iso(), required: true },
      { name: 'subject', label: 'Môn học', value: existing?.subject || 'Toán' },
      { name: 'status', label: 'Trạng thái điểm danh', value: existing?.status || 'Đã học', options: [['Đã học', 'Đã học'], ['Học bù', 'Học bù'], ['Nghỉ phép', 'Nghỉ phép'], ['Vắng', 'Vắng']] },
      { name: 'content', label: 'Nội dung buổi học', type: 'textarea', value: existing?.content || '' },
      { name: 'evaluation', label: 'Nhận xét của gia sư', type: 'textarea', value: existing?.evaluation || '' },
      { name: 'homework_status', label: 'Đánh giá BTVN', value: existing?.homework_status || 'Hoàn thành', options: [['Hoàn thành', 'Hoàn thành'], ['Đã làm', 'Đã làm'], ['Thiếu bài', 'Thiếu bài'], ['Chưa làm', 'Chưa làm']] },
      { name: 'start_score', label: 'Điểm đầu giờ (0-10)', type: 'number', min: 0, max: 10, step: '0.1', value: existing?.start_score ?? '' },
      { name: 'exam_score', label: 'Điểm định kì (0-10)', type: 'number', min: 0, max: 10, step: '0.1', value: existing?.exam_score ?? '' },
      { name: 'amount', label: 'Học phí buổi này (VNĐ)', type: 'number', min: 0, value: existing ? existing.amount : stu.tuition },
    ];
    openModal(existing ? '<i class="fa-solid fa-pen-to-square"></i> Sửa buổi học' : '<i class="fa-solid fa-calendar-plus"></i> Thêm buổi học mới', fields, async values => {
      const body = { ...values };
      if (body.start_score === '') body.start_score = null;
      if (body.exam_score === '') body.exam_score = null;
      await request(existing ? `lessons/${existing.id}` : 'lessons', existing ? 'PATCH' : 'POST', body);
      await refresh();
      notice(existing ? 'Đã cập nhật buổi học.' : 'Đã thêm buổi học mới.');
    });
  }

  renderAll();
  const initialTab = new URLSearchParams(location.search).get('tab');
  if (initialTab && SECTION_MAP[initialTab]) switchTab(initialTab);

  Lab.on('sidebarCollapseBtn', 'click', () => id('tutorDashboardBox')?.classList.toggle('sidebar-collapsed'));
  Lab.on('tutorSidebarOverlay', 'click', () => setMobileSidebar(false));
  Lab.on('overviewPrevMonthBtn', 'click', () => {
    viewMonth -= 1;
    if (viewMonth < 1) { viewMonth = 12; viewYear -= 1; }
    renderOverview();
  });
  Lab.on('overviewNextMonthBtn', 'click', () => {
    viewMonth += 1;
    if (viewMonth > 12) { viewMonth = 1; viewYear += 1; }
    renderOverview();
  });
  Lab.on('revenuePeriodFilter', 'change', () => renderOverview());
  Lab.on('revenueYearFilter', 'change', () => renderOverview());
  Lab.on('studentRevenueMonthFilter', 'change', () => renderOverview());
  Lab.on('tuitionMonth', 'change', () => renderTuitionSection());
  Lab.on('sidebarBtnTheme', 'click', openThemeDialog);
  Lab.on('mobileBtnTheme', 'click', openThemeDialog);
  Lab.on('sidebarBtnAccount', 'click', openAccountDialog);
  Lab.on('mobileBtnAccount', 'click', openAccountDialog);
  Lab.on('sidebarBtnSettings', 'click', openClassSettingsDialog);
  Lab.on('mobileBtnSettings', 'click', openClassSettingsDialog);

  Lab.commands({
    toggleTutorMobileSidebar: () => setMobileSidebar(!id('tutorSidebar')?.classList.contains('sidebar-open')),
    switchTutorNavTab: (_k, el) => switchTab(el.dataset.tab),
    ztBottomNavGo: (_k, el) => {
      if (el.dataset.tab === 'more') setMobileSidebar(true);
      else switchTab(el.dataset.tab);
    },
    openTutorCalendarTab: () => switchTab('calendar'),
    openCal: () => switchTab('calendar'),
    openTutorAccountModal: openAccountDialog,
    openAddStudentModal: () => openStudentModal(null),
    editStudent: key => openStudentModal(data.students.find(s => s.id === Number(key))),
    goDiary: key => {
      diaryStudentId = String(key);
      renderDiarySection();
      switchTab('diary');
    },
    deleteStudent: key => {
      const stu = data.students.find(s => s.id === Number(key));
      openModal('<i class="fa-solid fa-trash-can"></i> Chuyển vào thùng rác', [], async () => {
        await request(`students/${key}`, 'DELETE');
        await refresh();
        notice('Đã chuyển học sinh vào thùng rác.');
      }, 'Xóa', `<p style="margin:0 0 12px;color:var(--text-secondary);">Bạn muốn chuyển <strong>${e(stu?.name || 'học sinh')}</strong> vào thùng rác? Có thể khôi phục lại sau.</p>`);
    },
    openTrashModal: () => {
      const trashed = data.students.filter(s => s.deleted_at);
      const body = trashed.map(s => `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;background:var(--bg-input);border:1px solid var(--border-card);border-radius:10px;margin-bottom:8px;"><span><strong>${e(s.name)}</strong> (${e(s.login)})</span><button type="button" class="btn-tuition-invoice" data-command="restoreStudent" data-key="${s.id}">Khôi phục</button></div>`).join('')
        || '<p style="color:var(--text-muted);">Thùng rác trống.</p>';
      openModal('<i class="fa-solid fa-trash-can"></i> Thùng rác học sinh', [], null, '', body);
    },
    restoreStudent: async key => {
      await request(`students/${key}/restore`, 'POST', {});
      document.querySelector('.lab-tutor-modal')?.remove();
      await refresh();
      notice('Đã khôi phục học sinh.');
    },
    deleteClass: async key => {
      await request(`classes/${key}`, 'DELETE');
      document.querySelector('.lab-tutor-modal')?.remove();
      await refresh();
      notice('Đã xóa lớp học.');
    },
    switchHwTab: key => { hwSubTab = key; renderDiarySection(); },
    saveQuickAnn: async key => {
      const val = id('quickAnnouncementInput')?.value || '';
      await request(`students/${key}`, 'PATCH', { announcement: val });
      await refresh();
      notice('Đã lưu thông báo gửi phụ huynh.');
    },
    addAssign: () => openAssignModal(null),
    editAssign: key => openAssignModal(data.assignments.find(a => a.id === Number(key))),
    deleteAssign: key => openModal('<i class="fa-solid fa-trash"></i> Xóa bài tập', [], async () => {
      await request(`assignments/${key}`, 'DELETE');
      await refresh();
      notice('Đã xóa bài tập.');
    }, 'Xóa', '<p style="margin:0 0 12px;color:var(--text-secondary);">Xác nhận xóa bài tập này?</p>'),
    gradeSub: key => {
      const sub = data.submissions.find(s => s.id === Number(key));
      if (!sub) return;
      openModal('<i class="fa-solid fa-check-double"></i> Chấm điểm &amp; Nhận xét', [
        { name: 'score', label: 'Điểm số (0-10)', type: 'number', min: 0, max: 10, step: '0.1', value: sub.score ?? '', required: true },
        { name: 'comment', label: 'Lời phê chữa bài cho học sinh', type: 'textarea', value: sub.comment || '' },
      ], async values => {
        await request(`submissions/${sub.id}`, 'PATCH', values);
        await refresh();
        notice('Đã lưu điểm và nhận xét.');
      }, 'Lưu điểm');
    },
    addLesson: () => openLessonModal(null),
    editLesson: key => openLessonModal(data.lessons.find(l => l.id === Number(key))),
    deleteLesson: key => openModal('<i class="fa-solid fa-trash"></i> Xóa buổi học', [], async () => {
      await request(`lessons/${key}`, 'DELETE');
      await refresh();
      notice('Đã xóa buổi học.');
    }, 'Xóa', '<p style="margin:0 0 12px;color:var(--text-secondary);">Xác nhận xóa nhật ký buổi học này?</p>'),
    toggleTuition: async key => {
      const [sidStr, flag] = String(key).split('|');
      const sid = Number(sidStr);
      const chosenMonth = id('tuitionMonth')?.value || month();
      const ids = activeLessons().filter(l => l.student_id === sid && l.date.startsWith(chosenMonth)).map(l => l.id);
      if (!ids.length) return;
      await request('lessons/payment', 'PUT', { ids, paid: flag === '1' });
      await refresh();
      notice(flag === '1' ? 'Đã ghi nhận thanh toán học phí.' : 'Đã chuyển lại trạng thái chưa thu.');
    },
  });
})().catch(err => Lab.notice(err.message, true));
