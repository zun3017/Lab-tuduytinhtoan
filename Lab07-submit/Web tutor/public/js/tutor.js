'use strict';
(async () => {
  const { id, all, text, html, escape: e, live, money, iso, month, date, request, notice, files } = Lab;
  let data = await Lab.dashboard(['tutor', 'admin']);
  if (!data) return;

  id('tutorDashboardBox').style.display = 'block';

  const WEEKDAYS = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];
var THEME_NAMES = {
  'theme-dark-purple': 'Tím Đêm (Gốc)',
  'preset-blue': 'Xanh gốc',
  'preset-hong-hoa': 'Hồng hoa',
  'preset-hong-nhe': 'Hồng nhẹ',
  'preset-matcha': 'Matcha Tea',
  'preset-linen': 'Linen Cocoa',
  'theme-azure-mist-full': 'Azure Mist · Nền & bóng',
  'theme-azure-mist-minimal': 'Azure Mist · Tối giản',
  'theme-woodland-cottage-full': 'Woodland Cottage · Nền & bóng',
  'theme-woodland-cottage-minimal': 'Woodland Cottage · Tối giản',
  'theme-sage-blush-full': 'Sage Blush · Nền & bóng',
  'theme-sage-blush-minimal': 'Sage Blush · Tối giản',
  'theme-golden-caramel-full': 'Golden Caramel · Nền & bóng',
  'theme-golden-caramel-minimal': 'Golden Caramel · Tối giản',
  'theme-pastel-alpine-full': 'Pastel Alpine · Nền & bóng',
  'theme-pastel-alpine-minimal': 'Pastel Alpine · Tối giản',
  'theme-dreamy-cosmic-full': 'Dreamy Cosmic · Nền & bóng (Tối)',
  'theme-dreamy-cosmic-minimal': 'Dreamy Cosmic · Tối giản (Tối)',
  'theme-sunset-meadow-full': 'Sunset Meadow · Nền & bóng',
  'theme-sunset-meadow-minimal': 'Sunset Meadow · Tối giản',
  'theme-neon-seoul-full': 'Neon Seoul · Nền & bóng (Tối)',
  'theme-neon-seoul-minimal': 'Neon Seoul · Tối giản (Tối)',
  'theme-mystic-blue-full': 'Mystic Blue · Nền & bóng (Tối)',
  'theme-mystic-blue-minimal': 'Mystic Blue · Tối giản (Tối)',
  'theme-blue-lime-full': 'Blue Lime · Nền & bóng',
  'theme-blue-lime-minimal': 'Blue Lime · Tối giản',
  'theme-cloud-meadow-full': 'Cloud Meadow · Nền & bóng',
  'theme-cloud-meadow-minimal': 'Cloud Meadow · Tối giản',
  'theme-soft-blue-white-full': 'Soft Blue · Nền & bóng',
  'theme-soft-blue-white-minimal': 'Soft Blue · Tối giản',
  'theme-soft-blue-full': 'Soft Blue · Nền & bóng',
  'theme-soft-blue-minimal': 'Soft Blue · Tối giản',
  'theme-blossom-noir-full': 'Blossom Noir · Nền & bóng (Tối)',
  'theme-blossom-noir-minimal': 'Blossom Noir · Tối giản (Tối)',
  'theme-violet-planet-full': 'Violet Planet · Nền & bóng (Tối)',
  'theme-violet-planet-minimal': 'Violet Planet · Tối giản (Tối)',
  'theme-claude-full': 'Claude · Nền & bóng (Ấm)',
  'theme-claude-minimal': 'Claude · Tối giản (Ấm)'
};

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
  let feedbackFilter = 'all';
  let showAssignForm = true;
  let submissionLimit = 8;
  let selectedAssignment = null;
  let selectedSubmission = null;
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

  function drawRevenueTrend(labels, dataValues) {
    const canvasEl = id('revenueBarChartCanvas');
    if (!canvasEl || !window.Chart) return;
    var maxVal = Math.max.apply(null, dataValues);
    if (maxVal <= 0) maxVal = 2000000;

    var ctx = canvasEl.getContext('2d');
    Chart.getChart(canvasEl)?.destroy();

    // Top data labels plugin (Biểu đồ đường - hiển thị số tiền phía trên mỗi điểm)
    var topLabelsPlugin = {
        id: 'topDataLabels',
        afterDatasetsDraw: function(chart) {
            var c = chart.ctx;
            var meta = chart.getDatasetMeta(0);
            if (!meta || !meta.data) return;

            c.save();
            c.font = '600 10.5px Inter, -apple-system, sans-serif';
            c.textAlign = 'center';
            c.textBaseline = 'bottom';
            c.fillStyle = '#94A3B8';

            meta.data.forEach(function(item, idx) {
                var v = dataValues[idx] || 0;
                var text = "";
                if (v === 0) {
                    text = "0đ";
                } else if (v >= 1000000) {
                    text = (v / 1000000).toFixed(1).replace('.', ',') + 'tr';
                } else {
                    text = (v / 1000).toFixed(0) + 'k';
                }
                c.fillText(text, item.x, item.y - 8);
            });
            c.restore();
        }
    };

    var themeComp = getComputedStyle(document.documentElement);
    var chartThemeBar = (themeComp.getPropertyValue('--chart-bar') || '#4A72E8').trim();
    var chartThemeRgb = (themeComp.getPropertyValue('--chart-bar-rgb') || '74, 114, 232').trim();

    var lineGrad = ctx.createLinearGradient(0, 0, 0, 220);
    lineGrad.addColorStop(0, 'rgba(' + chartThemeRgb + ', 0.38)');
    lineGrad.addColorStop(1, 'rgba(' + chartThemeRgb + ', 0.01)');

    var datasets = [{
        label: 'Doanh thu',
        data: dataValues,
        borderColor: chartThemeBar,
        borderWidth: 3,
        backgroundColor: lineGrad,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: chartThemeBar,
        pointBorderColor: '#FFFFFF',
        pointBorderWidth: 2,
        pointRadius: 4.5,
        pointHoverRadius: 7
    }];

    new Chart(ctx, {
        type: 'line',
        plugins: [topLabelsPlugin],
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            animation: {
                duration: 1200,
                easing: 'easeOutQuart'
            },
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: (getComputedStyle(document.documentElement).getPropertyValue('--bg-card-alt') || '#1E2235').trim(),
                    titleColor: '#FFFFFF',
                    titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                    bodyColor: '#10B981',
                    bodyFont: { family: 'Inter', size: 12, weight: 'bold' },
                    borderColor: 'rgba(74, 114, 232, 0.4)',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return 'Doanh thu: ' + Number(context.parsed.y).toLocaleString('vi-VN') + ' đ';
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: '#94A3B8',
                        font: { family: 'Inter', size: 11, weight: '500' }
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    suggestedMax: maxVal * 1.3
                }
            }
        }
    });
  }

  function drawStudentRevenue(studentStats) {
    const canvasEl = id("studentRevenueDonutCanvas");
    const totalMonthRevenue = studentStats.reduce((sum, row) => sum + row.revenue, 0);
    // Sort descending by revenue
    studentStats.sort(function(a, b) {
        return b.revenue - a.revenue;
    });

    // Update center total
    var totalValEl = document.getElementById('studentDonutTotalVal');
    if (totalValEl) {
        if (totalMonthRevenue >= 1000000) {
            totalValEl.innerText = (totalMonthRevenue / 1000000).toFixed(1) + "tr";
        } else {
            totalValEl.innerText = totalMonthRevenue.toLocaleString('vi-VN') + "đ";
        }
        totalValEl.title = totalMonthRevenue.toLocaleString('vi-VN') + "đ";
    }

    // Render list
    var listEl = document.getElementById('studentRevenueList');
    if (listEl) {
        var listHtml = "";
        if (studentStats.length === 0) {
            listHtml = '<div style="text-align: center; padding: 25px 10px; color: var(--text-muted); font-size: 13px;">Chưa có học sinh nào</div>';
        } else {
            studentStats.forEach(function(s) {
                var amtClass = s.revenue > 0 ? "student-revenue-amount" : "student-revenue-amount zero";
                listHtml += '<div class="student-revenue-item">' +
                    '<div class="student-revenue-left">' +
                        '<span class="student-color-dot" style="background: ' + e(s.color) + '; box-shadow: 0 0 6px ' + e(s.color) + '66;"></span>' +
                        '<div class="student-revenue-info">' +
                            '<span class="student-revenue-name">' + e(s.name) + '</span>' +
                            '<span class="student-revenue-sessions">' + s.sessions + ' buổi học</span>' +
                        '</div>' +
                    '</div>' +
                    '<span class="' + amtClass + '">' + s.revenue.toLocaleString('vi-VN') + 'đ</span>' +
                '</div>';
            });
        }
        listEl.innerHTML = listHtml;
    }

    // Donut chart slices: only students with revenue > 0
    var donutLabels = [];
    var donutData = [];
    var donutColors = [];

    studentStats.forEach(function(s) {
        if (s.revenue > 0) {
            donutLabels.push(s.name);
            donutData.push(s.revenue);
            donutColors.push(s.color);
        }
    });

    if (donutData.length === 0) {
        donutLabels = ["Chưa có buổi học"];
        donutData = [1];
        var emptyRingColor = (getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#E2E8F0').trim();
        donutColors = [emptyRingColor];
    }

    var ctx = canvasEl.getContext('2d');
    Chart.getChart(canvasEl)?.destroy();

    var themeComp = getComputedStyle(document.documentElement);
    var donutCardBg = (themeComp.getPropertyValue('--bg-card') || '#0B0826').trim();

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: donutLabels,
            datasets: [{
                data: donutData,
                backgroundColor: donutColors,
                borderWidth: 2,
                borderColor: donutCardBg,
                hoverOffset: 4
            }]
        },
        options: {
            animation: {
                duration: 1500,
                easing: 'easeOutQuart'
            },
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: donutData.length > 0 && donutLabels[0] !== "Chưa có buổi học",
                    backgroundColor: (getComputedStyle(document.documentElement).getPropertyValue('--bg-card-alt') || '#1E2235').trim(),
                    titleColor: (getComputedStyle(document.documentElement).getPropertyValue('--text-primary') || '#FFFFFF').trim(),
                    titleFont: { family: 'Inter', size: 12, weight: 'bold' },
                    bodyColor: (getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || '#8E4DFF').trim(),
                    bodyFont: { family: 'Inter', size: 12 },
                    borderColor: (getComputedStyle(document.documentElement).getPropertyValue('--border-color') || 'rgba(142, 77, 255, 0.4)').trim(),
                    borderWidth: 1,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            var val = context.parsed;
                            var pct = totalMonthRevenue > 0 ? Math.round((val / totalMonthRevenue) * 100) : 0;
                            return ' ' + Number(val).toLocaleString('vi-VN') + 'đ (' + pct + '%)';
                        }
                    }
                }
            }
        }
    });
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
    const endMonth = 12;
    const startMonth = Math.max(1, endMonth - monthsCount + 1);
    const monthLabels = [];
    const monthlyRevenue = [];
    for (let m = startMonth; m <= endMonth; m++) {
      const key = ym(chosenYear, m);
      monthLabels.push(`T${m}`);
      monthlyRevenue.push(lessons.filter(l => l.date.startsWith(key)).reduce((sum, l) => sum + Number(l.amount || 0), 0));
    }
    text('revenueChartTitle', `Doanh thu ${monthLabels.length} tháng (${chosenYear})`);
    text('revenuePeriodTotal', money(monthlyRevenue.reduce((a, b) => a + b, 0)));
    drawRevenueTrend(monthLabels, monthlyRevenue);

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
    const palette = ['#8B5CF6','#10B981','#F59E0B','#3B82F6','#EC4899','#06B6D4','#84CC16','#F97316'];
    drawStudentRevenue(students.map((student,index)=>{
      const sessions = periodLessons.filter(lesson=>lesson.student_id===student.id);
      return {name:student.name, sessions:sessions.length, color:palette[index % palette.length],
              revenue:sessions.reduce((sum,lesson)=>sum+Number(lesson.amount || 0),0)};
    }));

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
    const from = id('reportStartDate').value;
    const to = id('reportEndDate').value;
    const inPeriod = day => (!from || day >= from) && (!to || day <= to);
    const stuLessons = chosenStu ? activeLessons().filter(l => l.student_id === chosenStu.id && inPeriod(l.date)).sort((a, b) => b.date.localeCompare(a.date)) : [];
    const container=id('reportPreviewContainer');
    const exportBtn=id('btnExportReportPng'), exportPdfBtn=id('btnExportReportPdf');
    Lab.html('reportStudentSelect', students.map(st=>`<option value="${st.id}">${e(st.name)}</option>`).join(''));
    id('reportStudentSelect').value=chosenStu?.id || '';
    syncCustomDropdownFromSelect('reportStudentSelect');
    const flatSessions=stuLessons.map(l=>({
      studentName:chosenStu.name, studentSubject:l.subject,
      log:{ngay:date(l.date),mon:l.subject,topic:l.content,nhanXet:l.evaluation,
           btvn:l.homework_status,chuyenCan:l.status}
    }));
        if (flatSessions.length === 0) {
            container.innerHTML = '<div style="background: var(--bg-card-alt); border: 1px dashed var(--border-color); border-radius: 20px; padding: 40px; text-align: center; max-width: 600px; width: 100%;">' +
                '<i class="fa-solid fa-file-circle-xmark" style="font-size: 38px; color: var(--color-primary); margin-bottom: 12px; display: block;"></i>' +
                '<h4 style="color: var(--text-primary); font-size: 16px; margin: 0 0 6px 0;">Không tìm thấy buổi học nào</h4>' +
                '<p style="color: var(--text-secondary); font-size: 13px; margin: 0;">Vui lòng điều chỉnh lại khoảng thời gian "Từ ngày" - "Đến ngày" hoặc chọn học sinh khác.</p>' +
            '</div>';
            if (exportBtn) exportBtn.style.display = 'none';
            if (exportPdfBtn) exportPdfBtn.style.display = 'none';
            return;
        }

        if (exportBtn) exportBtn.style.display = 'inline-flex';
        if (exportPdfBtn) exportPdfBtn.style.display = 'inline-flex';

        // Calculate metrics
        var totalSessions = flatSessions.length;
        var presentCount = 0;
        var hwDoneCount = 0;

        flatSessions.forEach(function(it) {
            var l = it.log;
            var cc = (l.chuyenCan || "").toLowerCase();
            if (cc.indexOf("vắng") === -1 && cc.indexOf("nghỉ") === -1) presentCount++;
            var bt = (l.btvn || "").toLowerCase();
            if (bt.indexOf("hoàn thành") !== -1 || bt.indexOf("đạt") !== -1 || bt.indexOf("tốt") !== -1) hwDoneCount++;
        });

        var attRate = Math.round((presentCount / totalSessions) * 100) + "%";
        var hwRate = Math.round((hwDoneCount / totalSessions) * 100) + "%";

    const tutorName=data.user.name, targetStudentDisplay=chosenStu.name;
    const startDisplay=from ? date(from) : 'Đầu kỳ', endDisplay=to ? date(to) : 'Hiện tại';
        var html = '<div id="reportCaptureCard" class="report-capture-card">' +
            '<!-- Header / Branding -->' +
            '<div class="report-card-banner">' +
                '<div>' +
                    '<div class="report-brand-title"><i class="fa-solid fa-graduation-cap" style="margin-right: 8px; color: var(--color-primary);"></i> BÁO CÁO TIẾN ĐỘ HỌC TẬP</div>' +
                    '<div class="report-brand-sub">Gia sư phụ trách: <b>' + e(tutorName) + '</b> • Hệ thống quản lý học sinh 1-1</div>' +
                '</div>' +
                '<div class="report-meta-pills">' +
                    '<span class="report-meta-pill"><i class="fa-solid fa-user-graduate"></i> ' + e(targetStudentDisplay) + '</span>' +
                    '<span class="report-meta-pill"><i class="fa-regular fa-calendar-days"></i> ' + e(startDisplay) + ' → ' + e(endDisplay) + '</span>' +
                    '<span class="report-meta-pill" style="background: rgba(16,185,129,0.15); border-color: #10B981; color: #6EE7B7;"><i class="fa-solid fa-check"></i> ' + totalSessions + ' buổi học</span>' +
                '</div>' +
            '</div>' +

            '<!-- Stats Summary Grid -->' +
            '<div class="report-stats-grid">' +
                '<div class="report-stat-box">' +
                    '<div class="report-stat-num text-purple">' + totalSessions + '</div>' +
                    '<div class="report-stat-lbl">Tổng số buổi ghi nhận</div>' +
                '</div>' +
                '<div class="report-stat-box">' +
                    '<div class="report-stat-num text-green">' + attRate + '</div>' +
                    '<div class="report-stat-lbl">Tỷ lệ chuyên cần (' + presentCount + '/' + totalSessions + ')</div>' +
                '</div>' +
                '<div class="report-stat-box">' +
                    '<div class="report-stat-num text-amber">' + hwRate + '</div>' +
                    '<div class="report-stat-lbl">Hoàn thành bài tập về nhà</div>' +
                '</div>' +
            '</div>' +

            '<!-- Detailed Session Cards -->' +
            '<div class="report-sessions-list">';

        flatSessions.forEach(function(it) {
            var log = it.log;
            var stStyle = studentStyle(it.studentName);
            var dateWithDay = log.ngay;
            var btvnBadge = '<span class="status-badge">' + e(log.btvn || '—') + '</span>';
            var comment = (log.nhanXet || "").trim() || "Chưa có nhận xét";

            html += '<div class="report-session-item">' +
                '<div class="report-session-top">' +
                    '<div style="display: flex; align-items: center; gap: 8px;">' +
                        '<span class="report-session-date"><i class="fa-regular fa-calendar-check" style="color: var(--color-primary);"></i> ' + e(dateWithDay) + '</span>' +
                        '<span style="background:' + e(stStyle.bg) + '; border:1px solid ' + e(stStyle.border) + '; color:' + e(stStyle.text) + '; padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700;">' + e(it.studentName) + '</span>' +
                        '<span style="font-size: 11.5px; color: var(--text-secondary);">' + e(log.mon || it.studentSubject) + '</span>' +
                    '</div>' +
                    '<div>' + btvnBadge + '</div>' +
                '</div>' +
                '<div class="report-session-topic"><b>Nội dung:</b> ' + e(log.topic || log.noiDung || "Học theo giáo trình") + '</div>' +
                '<div class="report-session-comment"><b>Nhận xét gia sư:</b> ' + e(comment) + '</div>' +
            '</div>';
        });

        html += '</div>' +
            '<!-- Footer -->' +
            '<div class="report-card-footer">' +
                '<div><i class="fa-solid fa-heart" style="color: var(--color-primary);"></i> Chúc các em luôn học tập tốt và bứt phá điểm số!</div>' +
                '<div>Thời gian xuất: ' + new Date().toLocaleString('vi-VN') + '</div>' +
            '</div>' +
        '</div>';

        container.innerHTML = html;
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

    const options = students.map(st => `<option value="${st.id}">${e(st.name)}</option>`).join('');
    const selectedForAssignment = id('assignStudent').value;
    html('assignStudent', options);
    id('assignStudent').value = diaryStudentId || selectedForAssignment || students[0]?.id || '';
    html('diaryStudentFilter', '<option value="">Tất cả học sinh</option>' + options);
    id('diaryStudentFilter').value = diaryStudentId;
    text('diaryStudentSelectedText', diaryStudentId ? selectedStu?.name : 'Tất cả học sinh');
    const monthName = m => `Tháng ${Number(m.slice(5))}/${m.slice(0,4)}`;
    html('diaryMonthFilter', '<option value="">Tất cả các tháng</option>' + months.map(m => `<option value="${e(m)}">${monthName(m)}</option>`).join(''));
    id('diaryMonthFilter').value = diaryMonth;
    text('diaryMonthSelectedText', diaryMonth ? monthName(diaryMonth) : 'Tất cả các tháng');
    text('diaryTotalSessionsBadge', filteredLessons.length + ' buổi học');
    id('tutorQuickAnnouncementWidget').hidden = !selectedStu;
    id('quickAnnouncementInput').value = selectedStu?.announcement || '';
    text('announcementStudentBadge', selectedStu?.name ? '· ' + selectedStu.name : '');
    const visibleFeedback = feedbackFilter === 'all' ? live(data.feedback).slice().reverse() : feedbacks.filter(f => f.student_id === selectedStu?.id);
    html('tutorFeedbackList', visibleFeedback.map(f => Lab.item(sMap.get(f.student_id)?.name || 'Học sinh', `<p>${e(f.content)}</p><small>${e(date(f.created_at))}</small>`)).join('') || Lab.empty('Chưa có phản hồi từ phụ huynh.'));
    ['All','Current'].forEach((key,index) => id('btnFbFilter'+key).setAttribute('aria-pressed', String((feedbackFilter === 'all') === (index === 0))));
    const row = columns => `<tr>${columns.map(cell => `<td>${cell}</td>`).join('')}</tr>`;
    const foot = label => `<tr><td colspan="5" style="text-align:center;padding:16px">${label}</td></tr>`;
    const action = (cmd, label, key, css='btn-edit') => `<button type="button" class="action-btn-hw ${css}" data-command="${cmd}" data-key="${key}">${label}</button>`;
    const assignActions = a => action('editAssign','Sửa',a.id)+action('deleteAssign','Xóa',a.id,'btn-delete');
    html('assignedHwTableBody', assigns.map(a => row([date(a.release_date),date(a.due_date),`<strong>${e(a.title)}</strong><div>${e(sMap.get(a.student_id)?.name)}</div><small>${e(a.description)}</small>`,files(a.files)||'—',assignActions(a)])).join('') || foot('Chưa có bài tập.'));
    html('assignedHwMobile', assigns.map(a => Lab.item(a.title, `<p>${e(sMap.get(a.student_id)?.name)} · Hạn ${date(a.due_date)}</p><p>${e(a.description)}</p>${files(a.files)}`,assignActions(a))).join('') || Lab.empty());
    const shown = subs.slice(0,submissionLimit);
    const grade = x => action('gradeSub',x.score == null ? 'Chấm bài' : x.score+'/10 · Sửa',x.id);
    const content = x => `<div>${e(x.content)}</div>${files(x.files)}`;
    html('studentSubmissionsTableBody',shown.map(x=>row([date(x.submitted_at),`<strong>${e(assignMap.get(x.assignment_id)?.title)}</strong><p>${e(sMap.get(x.student_id)?.name)}</p>`,e(x.content),grade(x)+`<small>${e(x.comment)}</small>`,files(x.files)||'—'])).join('')||foot('Chưa có bài nộp.'));
    html('submittedHwMobile', shown.map(x=>Lab.item(assignMap.get(x.assignment_id)?.title,`<p>${e(sMap.get(x.student_id)?.name)} · ${date(x.submitted_at)}</p>${content(x)}<p>${e(x.comment)}</p>`,grade(x))).join('')||Lab.empty());
    id('submissionViewMoreBtnContainer').style.display = shown.length < subs.length ? 'block' : 'none';
    id('tabContentSubmit').style.display = hwSubTab === 'submit' ? 'block' : 'none';
    id('tabContentAssign').style.display = hwSubTab === 'assign' ? 'block' : 'none';
    id('tabAssignBtn').classList.toggle('active',hwSubTab === 'assign');
    id('tabSubmitBtn').classList.toggle('active',hwSubTab === 'submit');
    id('assignHwFormContainer').style.display = showAssignForm ? 'block' : 'none';
    id('assignedHwListContainer').style.display = showAssignForm ? 'none' : 'block';
    html('tutorStudentHistory', `        <div class="table-wrapper">
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
`);
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

      return '<div class="student-profile-card" data-command="editStudent" data-key="'+s.id+'">' +
            '<div class="student-card-header">' +
                '<div class="student-initial-avatar" style="background: ' + e(st.bg) + '; border: 2px solid ' + e(st.border) + '; color: ' + e(st.text) + ';">' + e(initialOf(s.name)) + '</div>' +
                '<div class="student-card-info">' +
                    '<div class="student-card-name" title="' + e(s.name) + '">' + e(s.name) + '</div>' +
                    '<div class="student-card-sub"><i class="fa-solid fa-graduation-cap" style="color: var(--color-primary);"></i> ' + e(allStuLessons[0]?.subject || "Gia sư") + (cls ? ' • '+e(cls.name) : '') + '</div>' +
                '</div>' +
            '</div>' +
            '<div class="student-card-schedule" title="' + e(schedSummary) + '">' +
                '<i class="fa-regular fa-clock"></i>' +
                '<span>' + e(schedSummary) + '</span>' +
            '</div>' +
            '<div class="student-card-metrics">' +
                '<div class="card-metric-box">' +
                    '<div class="card-metric-val text-green">' + monthSessions + '</div>' +
                    '<div class="card-metric-lbl">' + (viewMonth === todayDate.getMonth()+1 && viewYear === todayDate.getFullYear() ? "Buổi tháng này" : "Buổi tháng "+viewMonth) + '</div>' +
                '</div>' +
                '<div class="card-metric-box">' +
                    '<div class="card-metric-val" style="color: var(--text-primary);">' + e(hwRate) + '</div>' +
                    '<div class="card-metric-lbl">Nộp BTVN</div>' +
                '</div>' +
                '<div class="card-metric-box">' +
                    '<div class="card-metric-val text-amber">' + money(s.tuition) + '</div>' +
                    '<div class="card-metric-lbl">Học phí/buổi</div>' +
                '</div>' +
            '</div>' +
            '<div class="student-card-actions">' +
                '<button type="button" class="btn-card-detail" data-command="editStudent" data-key="'+s.id+'" title="Chỉnh sửa hoặc xóa học sinh"><i class="fa-solid fa-user-pen"></i> Chỉnh sửa</button>' +
                '<button type="button" class="btn-card-diary" data-command="goDiary" data-key="'+s.id+'" title="Xem nhật ký học sinh này"><i class="fa-solid fa-book-open"></i> Nhật ký</button>' +
                '<button type="button" class="btn-card-detail" data-command="deleteStudent" data-key="'+s.id+'" aria-label="Xóa học sinh"><i class="fa-solid fa-trash-can"></i></button>' +
            '</div></div>';
    }).join('') || `<div style="grid-column:1/-1;" class="empty-state"><div class="empty-state-title">Chưa có học sinh nào</div><button type="button" class="empty-state-btn" data-command="openAddStudentModal"><i class="fa-solid fa-plus"></i> Thêm học sinh</button></div>`;
  }

function toggleCustomDropdown(selectId, e) {
    if (e) {
        e.stopPropagation();
    }
    var select = document.getElementById(selectId);
    if (!select) return;
    var wrap = select.closest('.custom-dropdown-wrap');
    if (!wrap) return;
    var menu = wrap.querySelector('.custom-dropdown-menu');
    if (!menu) return;

    var isOpen = wrap.classList.contains('open');
    closeAllCustomDropdowns();
    if (!isOpen) {
        syncCustomDropdownFromSelect(selectId);
        wrap.classList.add('open');
        menu.classList.add('open');
        var parentToolbar = wrap.closest('.diary-toolbar, .tuition-toolbar, .report-filter-toolbar');
        if (parentToolbar) {
            parentToolbar.classList.add('has-open-dropdown');
        }
    }
}
window.toggleCustomDropdown = toggleCustomDropdown;

function closeAllCustomDropdowns() {
    document.querySelectorAll('.custom-dropdown-wrap.open').forEach(function(w) {
        w.classList.remove('open');
    });
    document.querySelectorAll('.custom-dropdown-menu.open').forEach(function(m) {
        m.classList.remove('open');
    });
    document.querySelectorAll('.has-open-dropdown').forEach(function(t) {
        t.classList.remove('has-open-dropdown');
    });
}
window.closeAllCustomDropdowns = closeAllCustomDropdowns;

function syncCustomDropdownFromSelect(selectId) {
    var select = document.getElementById(selectId);
    if (!select) return;
    var wrap = select.closest('.custom-dropdown-wrap');
    if (!wrap) return;
    var selectedTextEl = wrap.querySelector('.custom-dropdown-selected');
    var menu = wrap.querySelector('.custom-dropdown-menu');
    if (!selectedTextEl || !menu) return;

    var curVal = select.value;
    var curText = "";
    menu.innerHTML = "";

    if (select.options.length === 0) {
        selectedTextEl.innerText = (selectId === 'reportStudentSelect' || selectId === 'diaryStudentFilter') ? "Chưa có học sinh" : "Tất cả các tháng";
        return;
    }

    Array.from(select.options).forEach(function(opt) {
        var isSelected = (opt.value === curVal);
        if (isSelected || (!curText && select.selectedIndex === 0)) {
            curText = opt.innerText;
        }

        var item = document.createElement('div');
        item.className = 'custom-dropdown-item' + (isSelected ? ' active' : '');
        item.dataset.value = opt.value;

        var iconHtml = '';
        if (selectId === 'diaryStudentFilter' || selectId === 'reportStudentSelect') {
            iconHtml = '<i class="fa-solid fa-graduation-cap" style="margin-right: 8px; opacity: 0.7; font-size: 12px;"></i>';
        } else if (opt.value === 'all') {
            iconHtml = '<i class="fa-solid fa-layer-group" style="margin-right: 8px; opacity: 0.7; font-size: 12px;"></i>';
        } else {
            iconHtml = '<i class="fa-regular fa-calendar-check" style="margin-right: 8px; opacity: 0.7; font-size: 12px;"></i>';
        }

        item.innerHTML = '<span style="display: inline-flex; align-items: center;">' + iconHtml + e(opt.innerText) + '</span>' +
                         '<i class="fa-solid fa-check item-check"></i>';

        item.onclick = function(ev) {
            ev.stopPropagation();
            select.value = opt.value;
            select.dispatchEvent(new Event('change'));
            syncCustomDropdownFromSelect(selectId);
            closeAllCustomDropdowns();
        };

        menu.appendChild(item);
    });

    if (select.selectedIndex >= 0 && select.options[select.selectedIndex]) {
        curText = select.options[select.selectedIndex].innerText;
    }
    selectedTextEl.innerText = curText || "Chọn...";
}
window.syncCustomDropdownFromSelect = syncCustomDropdownFromSelect;

if (typeof window._customDropdownClickBound === 'undefined') {
    window._customDropdownClickBound = true;
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-dropdown-wrap')) {
            closeAllCustomDropdowns();
        }
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllCustomDropdowns();
        }
    });
}


  for(const wrap of all('.custom-dropdown-wrap')){
    const select=wrap.querySelector('select');
    if(!select)continue;
    wrap.addEventListener('click',evt=>toggleCustomDropdown(select.id,evt));
    wrap.addEventListener('keydown',evt=>{
      if(evt.target===wrap && ['Enter',' '].includes(evt.key)){
        evt.preventDefault();toggleCustomDropdown(select.id,evt);
        const items=wrap.querySelectorAll('.custom-dropdown-item');
        items.forEach(item=>{item.tabIndex=0;item.onkeydown=e=>{if(e.key==='Enter')item.click();};});
        items[0]?.focus();
      }
    });
  }

  function renderTuitionSection() {
    const input = id('tuitionMonthFilter');
    const chosenMonth = input.value === 'all' ? '' : (input.value || month());
    const periods = [...new Set([month(),...activeLessons().map(l=>l.date.slice(0,7))])].sort().reverse();
    input.innerHTML='<option value="all">Tất cả các tháng</option>'+periods.map(p=>{
      const [year,m]=p.split('-');
      return '<option value="'+e(p)+'">Tháng '+Number(m)+'/'+year+'</option>';
    }).join('');
    input.value=chosenMonth || 'all';
    syncCustomDropdownFromSelect('tuitionMonthFilter');
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
    const panel=id('themeSwitcherPanel');
    const current=data.user.theme || 'theme-soft-blue-white-full';
    const close=()=>{panel.style.display='none';};
    async function select(name) {
      const res=await request('account','PATCH',{theme:name});
      data.user=res.user;
      applyTheme();
      renderOverview();
      const frame=id('tutorCalendarIframe');
      frame?.contentWindow?.postMessage({type:'setTheme',themeId:name},location.origin);
      close();
    }
    panel.style.display='flex';
    panel.querySelector('.theme-switcher-close').onclick=close;
    panel.querySelector('.theme-switcher-overlay').onclick=close;
    for(const item of panel.querySelectorAll('[data-theme]')){
      item.classList.toggle('active', item.dataset.theme===current);
      item.tabIndex=0;
      item.setAttribute('role','button');
      item.onclick=Lab.guard(()=>select(item.dataset.theme));
      item.onkeydown=event=>{if(['Enter',' '].includes(event.key)){event.preventDefault();item.click();}};
    }
    const hex=id('customColorHex'),picker=id('customColorPicker');
    if(current.startsWith('custom:'))hex.value=picker.value=current.slice(7);
    picker.oninput=()=>{hex.value=picker.value.toUpperCase();};
    panel.querySelector('.theme-btn-apply-custom').onclick=Lab.guard(()=>{
      if(!/^#[a-f0-9]{6}$/i.test(hex.value.trim()))throw new Error('Nhập mã màu dạng #RRGGBB.');
      return select('custom:'+hex.value.trim());
    });
    text('themeCurrentLabel',THEME_NAMES[current] || current);
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

  let modalTrigger;
  function showOriginalDialog(key) {
    const overlay = id(key);
    modalTrigger = document.activeElement;
    overlay.style.display = 'flex';
    const focus = overlay.querySelector('input:not([readonly]),textarea,button');
    focus?.focus();
  }

  function closeOriginalDialog(overlay) {
    if (!overlay) return;
    overlay.style.display = 'none';
    modalTrigger?.focus();
  }

  const fileFields = editing => editing ? ['tutorEditHwFileInput'] : ['tutorHwFileInputDesktop','tutorHwImageInputMobile','tutorHwDocInputMobile'];
  const selectedFiles = editing => fileFields(editing).flatMap(key => [...id(key).files]);

  function showSelectedFiles(editing) {
    const list = selectedFiles(editing);
    id(editing ? 'tutorEditSelectedFileBox' : 'tutorSelectedFileBox').style.display = list.length ? 'flex' : 'none';
    text(editing ? 'tutorEditSelectedFileName' : 'tutorSelectedFileName', list.map(f => f.name).join(', '));
  }

  function clearFiles(editing) {
    fileFields(editing).forEach(key => { id(key).value = ''; });
    showSelectedFiles(editing);
  }

  async function saveAssignment(editing) {
    const prefix = editing ? 'editAssignHw' : 'assignHw';
    const title = id(prefix+'Title').value.trim();
    if (!title) {id(prefix+'Title').focus(); throw new Error('Hãy nhập tên bài tập.');}
    const fd = new FormData();
    fd.append('title',title);
    fd.append('description',id(prefix+'Link').value.trim());
    fd.append('release_date',id(prefix+'ReleaseDate').value || iso());
    const release = new Date(fd.get('release_date')+'T12:00:00');
    release.setDate(release.getDate()+4);
    fd.append('due_date',id(prefix+'DueDate').value || iso(release));
    if (fd.get('due_date') < fd.get('release_date')) throw new Error('Hạn nộp phải bằng hoặc sau ngày phát hành.');
    if (!editing) {
      if (!id('assignStudent').value) throw new Error('Hãy chọn học sinh nhận bài.');
      fd.append('student_id',id('assignStudent').value);
    }
    selectedFiles(editing).forEach(f=>fd.append('files',f));
    await request(editing ? 'assignments/'+selectedAssignment : 'assignments', editing ? 'PATCH' : 'POST',fd);
    if (editing) closeOriginalDialog(id('editAssignedHwModal'));
    else {
      id(prefix+'Title').value='';id(prefix+'Link').value='';id(prefix+'DueDate').value='';
      showAssignForm=false;
    }
    clearFiles(editing);
    await refresh();
    notice(editing ? 'Đã cập nhật bài tập.' : 'Đã giao bài tập cho học sinh.');
  }

  function editAssignment(key) {
    const assignment = data.assignments.find(a=>a.id===Number(key));
    if (!assignment) return;
    selectedAssignment=assignment.id;
    id('editAssignHwTitle').value=assignment.title;
    id('editAssignHwLink').value=assignment.description || '';
    id('editAssignHwReleaseDate').value=assignment.release_date || '';
    id('editAssignHwDueDate').value=assignment.due_date || '';
    clearFiles(true);
    showOriginalDialog('editAssignedHwModal');
  }

  function openGradeDialog(key) {
    const sub=data.submissions.find(x=>x.id===Number(key));
    if (!sub) return;
    selectedSubmission=sub.id;
    id('gradeStudentNameInput').value=studentMap().get(sub.student_id)?.name || '';
    id('gradeScoreInput').value=sub.score ?? '';
    id('gradeCommentInput').value=sub.comment || '';
    showOriginalDialog('tutorGradeModal');
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

  const clickOnce = (key, handler) => Lab.on(key,'click',async () => {
    const button=id(key);button.disabled=true;try{await handler();}finally{button.disabled=false;}
  });
  for (const field of [...fileFields(false),...fileFields(true)]) {
    Lab.on(field,'change',()=>showSelectedFiles(field==='tutorEditHwFileInput'));
  }
  all('[data-pick-file]').forEach(el=>{
    el.addEventListener('click',ev=>{if(ev.target.tagName!=='INPUT')id(el.dataset.pickFile).click();});
    if(el.getAttribute('role')==='button')el.addEventListener('keydown',ev=>{
      if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();id(el.dataset.pickFile).click();}
    });
  });
  all('[data-close-modal]').forEach(el=>el.addEventListener('click',()=>closeOriginalDialog(el.closest('.modal-overlay'))));
  document.addEventListener('keydown',ev=>{
    const dialog=all('.modal-overlay').find(el=>getComputedStyle(el).display!=='none');
    if(ev.key==='Escape' && dialog) {if(dialog.classList.contains('lab-tutor-modal'))dialog.remove();else closeOriginalDialog(dialog);}
  });
  for(const [key,sub] of [['tabAssignBtn','assign'],['tabSubmitBtn','submit']])Lab.on(key,'click',()=>{hwSubTab=sub;renderDiarySection();});
  for(const [key,show] of [['btnShowUploadForm',true],['btnToggleViewAssignedHw',false]])Lab.on(key,'click',()=>{showAssignForm=show;renderDiarySection();});
  Lab.on('diaryStudentFilter','change',ev=>{diaryStudentId=ev.target.value;renderDiarySection();});
  Lab.on('diaryMonthFilter','change',ev=>{diaryMonth=ev.target.value;renderDiarySection();});
  for(const [key,value] of [['btnFbFilterAll','all'],['btnFbFilterCurrent','current']])Lab.on(key,'click',()=>{feedbackFilter=value;renderDiarySection();});
  for(const key of ['btnSaveQuickAnnouncement','btnClearQuickAnnouncement'])clickOnce(key,async ()=>{
    const stu=activeStudents().find(s=>String(s.id)===diaryStudentId)||activeStudents()[0];
    if(!stu)return;
    await request('students/'+stu.id,'PATCH',{announcement:key==='btnClearQuickAnnouncement'?'':id('quickAnnouncementInput').value});
    await refresh();notice('Đã cập nhật thông báo.');
  });
  clickOnce('btnSubmitAssignedHw',()=>saveAssignment(false));
  clickOnce('btnSubmitEditAssignedHw',()=>saveAssignment(true));
  clickOnce('btnSaveSubmissionGrade',async()=>{
    const value=id('gradeScoreInput').value.trim().replace(',','.');
    const score=Number(value);
    if(!value || !Number.isFinite(score)||score<0||score>10)throw new Error('Điểm số phải nằm trong khoảng từ 0 đến 10.');
    await request('submissions/'+selectedSubmission,'PATCH',{score,comment:id('gradeCommentInput').value});
    closeOriginalDialog(id('tutorGradeModal'));await refresh();notice('Đã lưu điểm và nhận xét.');
  });
  Lab.on('reportStudentSelect','change',ev=>{reportStudentId=ev.target.value;renderReportsSection();});
  for(const key of ['reportStartDate','reportEndDate'])Lab.on(key,'change',()=>{
    id('reportEndDate').min=id('reportStartDate').value;id('reportStartDate').max=id('reportEndDate').value;
    renderReportsSection();
  });
  clickOnce('btnExportReportPng',async()=>{
    const card=id('reportCaptureCard');if(!card)throw new Error('Hãy chọn học sinh.');
    const image=await window.html2canvas(card,{scale:2,logging:false});
    const a=document.createElement('a');a.download='Bao-cao-hoc-tap.png';a.href=image.toDataURL('image/png');a.click();
  });
  Lab.on('btnExportReportPdf','click',()=>{if(id('reportCaptureCard'))window.print();});
  id('assignHwReleaseDate').value=iso();
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
  Lab.on('tuitionMonthFilter', 'change', () => renderTuitionSection());
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
      html('trashStudentList',data.students.filter(s=>s.deleted_at).map(s=>Lab.item(s.name,'',Lab.btn('restoreStudent','Khôi phục',s.id))).join('')||Lab.empty('Thùng rác trống.'));
      showOriginalDialog('trashModal');
    },
    archiveAssign: () => {
      html('tutorHwTrashTableBody',data.assignments.filter(a=>a.deleted_at).map(a=>`<tr><td>${e(a.title)}</td><td>${date(a.deleted_at)}</td><td>${Lab.btn('restoreAssignment','Khôi phục',a.id)}</td></tr>`).join('')||'<tr><td colspan="3">Thùng rác trống.</td></tr>');
      showOriginalDialog('tutorHwTrashModal');
    },
    restoreAssignment: async key => {
      await request('assignments/'+key+'/restore','POST',{});
      closeOriginalDialog(id('tutorHwTrashModal'));await refresh();notice('Đã khôi phục bài tập.');
    },
    restoreStudent: async key => {
      await request(`students/${key}/restore`, 'POST', {});
      closeOriginalDialog(id('trashModal'));
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
    listAssigned: () => {showAssignForm=false;renderDiarySection();},
    moreSubs: () => {submissionLimit+=8;renderDiarySection();},
    clearFiles: (_key,el) => clearFiles(Boolean(el.closest('#editAssignedHwModal'))),
    refreshDiary: refresh,
    editAssign: editAssignment,
    deleteAssign: key => openModal('<i class="fa-solid fa-trash"></i> Xóa bài tập', [], async () => {
      await request(`assignments/${key}`, 'DELETE');
      await refresh();
      notice('Đã xóa bài tập.');
    }, 'Xóa', '<p style="margin:0 0 12px;color:var(--text-secondary);">Xác nhận xóa bài tập này?</p>'),
    gradeSub: openGradeDialog,
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
      const chosenMonth = (id('tuitionMonthFilter').value === 'all' ? '' : id('tuitionMonthFilter').value);
      const ids = activeLessons().filter(l => l.student_id === sid && l.date.startsWith(chosenMonth)).map(l => l.id);
      if (!ids.length) return;
      await request('lessons/payment', 'PUT', { ids, paid: flag === '1' });
      await refresh();
      notice(flag === '1' ? 'Đã ghi nhận thanh toán học phí.' : 'Đã chuyển lại trạng thái chưa thu.');
    },
  });
})().catch(err => Lab.notice(err.message, true));
