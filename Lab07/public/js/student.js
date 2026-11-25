'use strict';
(async () => {
  const { id, text, html, live, escape: e, date, money, month } = Lab;
  let data = await Lab.dashboard(['student']);
  if (!data) return;

  let limit = 5;
  let lineChart = null;
  let btvnChart = null;
  let ccChart = null;
  const signed = data.user;
  id('resultBox').style.display = 'block';

  const avg = vals => (vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : null);

  function scoreColor(val) {
    const n = parseFloat(val);
    if (isNaN(n)) return 'var(--text-secondary, #94A3B8)';
    if (n >= 9) return '#059669';
    if (n >= 7) return '#2563EB';
    if (n >= 5) return '#D97706';
    return '#DC2626';
  }

  function scoreBadge(val) {
    if (val === null || isNaN(val)) return '';
    if (val >= 9.0) return '<span class="score-badge-xs badge-excellent">Xuất sắc ⭐</span>';
    if (val >= 7.0) return '<span class="score-badge-xs badge-good">Giỏi 👍</span>';
    if (val >= 5.0) return '<span class="score-badge-xs badge-average">Khá 📚</span>';
    return '<span class="score-badge-xs badge-poor">Cần cố gắng 💪</span>';
  }

  function statusBadge(status) {
    const raw = (status || 'Đã học').trim();
    const t = raw.toLowerCase();
    if (t.includes('bù')) return '<span class="status-badge badge-hocbu">Học bù</span>';
    if (t.includes('nghỉ') || t.includes('vắng') || t.includes('hủy')) return `<span class="status-badge badge-nghi">${e(raw)}</span>`;
    return '<span class="status-badge badge-dahoc">Có mặt</span>';
  }

  function btvnBadge(btvn) {
    const raw = (btvn || '').trim();
    const bt = raw.toLowerCase();
    if (!raw || raw === '-' || raw === 'không có') {
      return '<span class="status-badge" style="background: var(--bg-input); border: 1px solid var(--border-card); color: var(--text-secondary);">-</span>';
    }
    if (bt.includes('không làm') || bt.includes('chưa làm') || bt.includes('chưa nộp')) {
      return `<span class="status-badge badge-nghi">${e(raw)}</span>`;
    }
    if (bt.includes('thiếu')) {
      return `<span class="status-badge badge-thieu">${e(raw)}</span>`;
    }
    return `<span class="status-badge badge-hoanthanh">${e(raw)}</span>`;
  }

  const legItem = (color, label, count) =>
    `<div class="donut-leg-item" style="display:flex;align-items:center;gap:8px;font-size:12.5px;color:#475569;margin-bottom:6px;"><span style="width:10px;height:10px;border-radius:50%;background:${color};flex-shrink:0;"></span><span>${e(label)}</span><strong style="margin-left:auto;color:#1E293B;">${count}</strong></div>`;

  function render() {
    const student = data.students.find(s => s.id === signed.id) || signed;
    text('loiChao', 'Xin chào, ' + student.name);
    text('khuVucThongBao', [data.settings?.marquee, student.announcement].filter(Boolean).join(' · ') || 'Chào mừng em đến với hệ thống tra cứu học tập!');

    const allLessons = live(data.lessons).sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    const sel = id('studentStatsMonthFilter');
    const prev = sel.value;
    const months = [...new Set(allLessons.map(l => l.date.slice(0, 7)))].sort((a, b) => b.localeCompare(a));
    sel.innerHTML = '<option value="">Tất cả các tháng</option>' +
      months.map(m => `<option value="${e(m)}">Tháng ${Number(m.slice(5))}/${m.slice(0, 4)}</option>`).join('');
    sel.value = months.includes(prev) ? prev : '';

    const logs = allLessons.filter(l => !sel.value || l.date.startsWith(sel.value));
    const badgePeriod = sel.value ? `(Tháng ${Number(sel.value.slice(5))})` : '(Tất cả)';
    text('btvnMonthBadge', badgePeriod);
    text('chuyenCanMonthBadge', badgePeriod);

    const attendedLogs = logs.filter(l => !/nghỉ|vắng/i.test(l.status));
    const avgDG = avg(attendedLogs.map(l => l.start_score).filter(n => n != null));
    const avgDK = avg(attendedLogs.map(l => l.exam_score).filter(n => n != null));
    text('valDiemDauGio', avgDG != null ? avgDG.toFixed(2) : 'Chưa có');
    text('valDiemDinhKi', avgDK != null ? avgDK.toFixed(2) : 'Chưa có');
    html('badgeDauGioContainer', scoreBadge(avgDG));
    html('badgeDinhKiContainer', scoreBadge(avgDK));

    // Line chart with original gradient fill
    const timeline = [...logs].reverse();
    const lineCanvas = id('diemChart');
    if (lineCanvas && window.Chart) {
      if (lineChart) lineChart.destroy();
      const ctx = lineCanvas.getContext('2d');
      const gradBlue = ctx.createLinearGradient(0, 0, 0, 260);
      gradBlue.addColorStop(0, 'rgba(59, 130, 246, 0.35)');
      gradBlue.addColorStop(1, 'rgba(59, 130, 246, 0.01)');
      lineChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: timeline.map(l => date(l.date).slice(0, 5)),
          datasets: [
            {
              label: 'Điểm đầu giờ',
              data: timeline.map(l => l.start_score),
              borderColor: '#3B82F6',
              backgroundColor: gradBlue,
              borderWidth: 3,
              fill: true,
              tension: 0.38,
              pointBackgroundColor: '#3B82F6',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              spanGaps: true,
            },
            {
              label: 'Điểm định kì',
              data: timeline.map(l => l.exam_score),
              borderColor: '#F59E0B',
              borderWidth: 3,
              fill: false,
              tension: 0.38,
              pointBackgroundColor: '#F59E0B',
              pointBorderColor: '#FFFFFF',
              pointBorderWidth: 2,
              pointRadius: 5,
              pointHoverRadius: 7,
              spanGaps: true,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: { mode: 'index', intersect: false },
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { display: false }, ticks: { color: '#94A3B8', font: { size: 11 } } },
            y: { display: false, min: 0, suggestedMax: 10.5 },
          },
        },
      });
    }

    // Progress comparison box
    const scored = timeline.filter(l => l.start_score != null);
    if (scored.length >= 2) {
      id('progressCompare').style.display = 'block';
      text('progressCompareLabel', `(${scored.length} buổi có điểm)`);
      const firstScore = Number(scored[0].start_score);
      const lastScore = Number(scored[scored.length - 1].start_score);
      const diff = (lastScore - firstScore).toFixed(1);
      const sign = diff > 0 ? '+' : '';
      html('progressCompareGrid', `
        <div class="progress-compare-card" style="background:#EFF6FF;border:1px solid #BFDBFE;border-radius:14px;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;">
          <span>Buổi đầu: <strong>${firstScore}</strong> → Gần nhất: <strong>${lastScore}</strong></span>
          <span class="status-badge ${diff >= 0 ? 'badge-hoanthanh' : 'badge-thieu'}">${sign}${diff} điểm</span>
        </div>
      `);
    } else {
      id('progressCompare').style.display = 'none';
    }

    // Donut 1: BTVN
    const btvnDone = attendedLogs.filter(l => /hoàn thành|đủ|đã làm|tốt|đạt/i.test(l.homework_status || '')).length;
    const btvnMiss = Math.max(0, attendedLogs.length - btvnDone);
    const btvnPct = attendedLogs.length ? Math.round((btvnDone / attendedLogs.length) * 100) : 0;
    text('btvnPct', attendedLogs.length ? `${btvnPct}%` : '—');
    html('btvnLegend', legItem('#10B981', 'Hoàn thành', btvnDone) + legItem('#F97316', 'Chưa hoàn thành', btvnMiss));
    html('btvnRewardBadge', attendedLogs.length
      ? (btvnPct >= 90
        ? '<div class="donut-reward-pill reward-trophy"><i class="fa-solid fa-trophy" style="color:#D97706;"></i> Chăm chỉ Xuất sắc</div>'
        : '<div class="donut-reward-pill reward-silver"><i class="fa-solid fa-award" style="color:#059669;"></i> Tích cực Rèn luyện</div>')
      : '');
    if (window.Chart && id('btvnChart')) {
      if (btvnChart) btvnChart.destroy();
      btvnChart = new Chart(id('btvnChart'), {
        type: 'doughnut',
        data: { datasets: [{ data: attendedLogs.length ? [btvnDone, btvnMiss] : [0, 1], backgroundColor: attendedLogs.length ? ['#10B981', '#F97316'] : ['#CBD5E1', '#E2E8F0'], borderWidth: 0 }] },
        options: { cutout: '72%', responsive: false, animation: false, plugins: { legend: { display: false } } },
      });
    }

    // Donut 2: Chuyen can
    const ccPresent = attendedLogs.length;
    const ccAbsent = logs.length - ccPresent;
    const ccPct = logs.length ? Math.round((ccPresent / logs.length) * 100) : 0;
    text('chuyenCanPct', logs.length ? `${ccPct}%` : '—');
    html('chuyenCanLegend', legItem('#3B82F6', 'Có mặt', ccPresent) + legItem('#EF4444', 'Vắng / Nghỉ', ccAbsent));
    html('chuyenCanRewardBadge', logs.length
      ? (ccPct >= 90
        ? '<div class="donut-reward-pill reward-gold"><i class="fa-solid fa-medal" style="color:#2563EB;"></i> Chuyên cần Gương mẫu</div>'
        : '<div class="donut-reward-pill reward-cheer"><i class="fa-solid fa-star" style="color:#9333EA;"></i> Đang Cố gắng</div>')
      : '');
    if (window.Chart && id('chuyenCanChart')) {
      if (ccChart) ccChart.destroy();
      ccChart = new Chart(id('chuyenCanChart'), {
        type: 'doughnut',
        data: { datasets: [{ data: logs.length ? [ccPresent, ccAbsent] : [0, 1], backgroundColor: logs.length ? ['#3B82F6', '#EF4444'] : ['#CBD5E1', '#E2E8F0'], borderWidth: 0 }] },
        options: { cutout: '72%', responsive: false, animation: false, plugins: { legend: { display: false } } },
      });
    }

    // History table + Mobile accordion cards
    const shown = logs.slice(0, limit);
    if (shown.length) {
      const tableRows = shown.map((l, idx) => {
        const isAbs = /nghỉ|vắng/i.test(l.status);
        const tuan = l.week || (logs.length - idx);
        const commentHtml = l.evaluation
          ? `<span style="color:var(--text-primary);font-style:italic;"><i class="fa-solid fa-comment-dots" style="color:#3B82F6;font-size:12px;margin-right:5px;"></i>${e(l.evaluation)}</span>`
          : '<span style="color:var(--text-muted);font-style:italic;">—</span>';
        return `<tr class="history-row${isAbs ? ' row-absent' : ''}">
          <td style="text-align:center;font-weight:700;color:var(--text-primary);">${e(tuan)}</td>
          <td style="white-space:nowrap;text-align:center;font-weight:500;">${e(date(l.date))}</td>
          <td>${l.subject ? `<span class="subj-chip">${e(l.subject)}</span>` : ''}</td>
          <td class="cell-noidung">${e(l.content || '—')}</td>
          <td class="cell-nhanxet">${commentHtml}</td>
          <td style="text-align:center;">${isAbs ? '-' : btvnBadge(l.homework_status)}</td>
          <td style="text-align:center;font-weight:700;font-size:14px;color:${scoreColor(l.start_score)};">${e(l.start_score ?? '—')}</td>
          <td style="text-align:center;font-weight:700;font-size:14px;color:${scoreColor(l.exam_score)};">${e(l.exam_score ?? '-')}</td>
          <td style="text-align:center;">${statusBadge(l.status)}</td>
        </tr>`;
      }).join('');

      const mobileCards = shown.map((l, idx) => {
        const isAbs = /nghỉ|vắng/i.test(l.status);
        const tuan = l.week ? `Tuần ${l.week}` : `Buổi ${logs.length - idx}`;
        return `<div class="accordion-item student-history-row">
          <div class="accordion-header" data-command="toggleAcc" data-key="${idx}">
            <div class="accordion-header-title">
              <span style="font-size:15px;font-weight:700;color:var(--text-primary);">${e(tuan)}</span>
              <span class="accordion-header-date">${e(date(l.date))}</span>
            </div>
            <div class="accordion-header-status">${statusBadge(l.status)}<i class="fa-solid fa-chevron-down" id="stu-chev-${idx}" style="font-size:13px;color:#3B82F6;"></i></div>
          </div>
          <div class="accordion-body" id="stu-acc-${idx}" style="display:none;">
            <div class="accordion-body-row"><span class="accordion-body-label">Môn học</span><span class="accordion-body-val">${e(l.subject || '—')}</span></div>
            <div class="accordion-body-row"><span class="accordion-body-label">Nội dung</span><span class="accordion-body-val">${e(l.content || '—')}</span></div>
            <div class="accordion-body-row"><span class="accordion-body-label">Nhận xét</span><span class="accordion-body-val" style="color:#2563EB;font-style:italic;">${e(l.evaluation || '—')}</span></div>
            <div class="accordion-body-row"><span class="accordion-body-label">BTVN</span><span class="accordion-body-val">${isAbs ? '—' : btvnBadge(l.homework_status)}</span></div>
            <div class="accordion-body-row"><span class="accordion-body-label">Đầu giờ / Định kì</span><span class="accordion-body-val">${e(l.start_score ?? '—')} / ${e(l.exam_score ?? '—')}</span></div>
          </div>
        </div>`;
      }).join('');

      html('khuVucLichSu', `
        <div class="table-wrapper desktop-table-view">
          <table class="history-table">
            <thead><tr>
              <th style="width:48px;text-align:center;">Tuần</th>
              <th style="width:90px;text-align:center;">Ngày dạy</th>
              <th style="width:85px;text-align:center;">Môn</th>
              <th>Nội dung</th>
              <th>Nhận xét của gia sư</th>
              <th style="width:115px;text-align:center;">Đánh giá BTVN</th>
              <th style="width:78px;text-align:center;">KT Đầu giờ</th>
              <th style="width:78px;text-align:center;">KT Định kì</th>
              <th style="width:90px;text-align:center;">Trạng thái</th>
            </tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
        </div>
        <div class="mobile-cards-view">${mobileCards}</div>
      `);
    } else {
      html('khuVucLichSu', '<p style="color:#64748B;padding:16px;">Chưa có dữ liệu buổi học trong kỳ.</p>');
    }
    id('loadMoreContainer').style.display = logs.length > limit ? 'block' : 'none';

    // Tuition & invoice strip matching original card style
    if (!id('labFees')) {
      id('khuVucLichSu').parentElement.insertAdjacentHTML('afterend', '<div id="labFees" class="schedule-section reveal" style="margin-bottom:24px;"></div>');
    }
    const totalFee = logs.reduce((n, l) => n + Number(l.amount || 0), 0);
    const paidFee = logs.filter(l => l.paid).reduce((n, l) => n + Number(l.amount || 0), 0);
    html('labFees', `
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h3 style="margin:0 0 6px;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-receipt" style="color:#2563EB;"></i> Tổng kết học phí kỳ học</h3>
          <p style="margin:0;color:#475569;font-size:14px;">Tổng kỳ: <strong>${money(totalFee)}</strong> · Đã đóng: <strong style="color:#059669;">${money(paidFee)}</strong> · Còn lại: <strong style="color:#D97706;">${money(totalFee - paidFee)}</strong></p>
        </div>
        <a class="btn-back-compact" href="/preview-invoice.html?id=${Number(student.id)}&amp;month=${encodeURIComponent(sel.value || '')}" style="background:linear-gradient(135deg,#3B82F6,#1D4ED8);color:#fff;border:none;text-decoration:none;">
          <i class="fa-solid fa-file-invoice-dollar"></i> Xem phiếu học phí &amp; hóa đơn
        </a>
      </div>
    `);

    if (!id('feedbackHistory')) {
      id('feedbackMessage').insertAdjacentHTML('afterend', '<div id="feedbackHistory" style="display:flex;flex-direction:column;gap:8px;margin-top:14px;"></div>');
    }
    html('feedbackHistory', live(data.feedback).slice().reverse().map(f => `
      <div style="background:#F8FAFF;border:1px solid #DBEAFE;border-radius:12px;padding:10px 14px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
        <span style="color:#1E293B;font-size:13.5px;"><i class="fa-regular fa-comment-dots" style="color:#3B82F6;margin-right:6px;"></i>${e(f.content)}</span>
        <span style="color:#64748B;font-size:12px;">${e(date(f.created_at))}</span>
      </div>
    `).join(''));
  }

  render();

  Lab.on('studentStatsMonthFilter', 'change', () => { limit = 5; render(); });
  Lab.on('btnLoadMore', 'click', () => { limit += 5; render(); });
  ['btnLegDauGio', 'btnLegDinhKi'].forEach((key, i) => Lab.on(key, 'click', () => {
    if (!lineChart) return;
    const visible = lineChart.isDatasetVisible(i);
    lineChart.setDatasetVisibility(i, !visible);
    lineChart.update();
    id(key)?.classList.toggle('active', !visible);
  }));
  Lab.on('btnSubmitFeedback', 'click', async () => {
    const content = id('feedbackInput').value.trim();
    if (!content) throw new Error('Hãy nhập nội dung phản hồi.');
    await Lab.request('feedback', 'POST', { content });
    id('feedbackInput').value = '';
    data = await Lab.request('dashboard');
    render();
    Lab.notice('Đã gửi phản hồi cho gia sư.');
  });
  Lab.commands({
    toggleAcc: key => {
      const body = id(`stu-acc-${key}`);
      const chev = id(`stu-chev-${key}`);
      if (!body) return;
      const open = body.style.display === 'none';
      body.style.display = open ? 'flex' : 'none';
      if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
    },
    lamMoiLichSuHocTap: async () => {
      data = await Lab.request('dashboard');
      render();
      Lab.notice('Đã làm mới dữ liệu.');
    },
    goToHomeworkPortal: () => location.assign('/homework.html'),
  });
})().catch(e => Lab.notice(e.message, true));
