'use strict';
(() => {
  const { id, html, text, escape: e, request, live, date, files } = Lab;
  const pin = id('studentPin');
  pin.required = false;
  pin.placeholder = 'PIN (hoặc bỏ trống nếu dùng Mã BT)';
  id('maInput').placeholder = 'Mã học sinh hoặc Mã bài tập (VD: BT-SAO-07)';

  let state = null;
  let editing = null;
  let donutChart = null;
  let barChart = null;
  const assignTitle = aid => state.assignments.find(a => a.id === aid)?.title || 'Bài tập';

  function updateFileBadge() {
    const input = id('hwFileInputDesktop');
    const badge = id('hwSelectedFilesBadge');
    if (!input || !badge) return;
    const list = [...(input.files || [])];
    if (list.length) {
      badge.style.display = 'block';
      badge.textContent = `Đã chọn ${list.length} tệp: ` + list.map(f => f.name).join(', ');
    } else {
      badge.style.display = 'none';
      badge.textContent = '';
    }
  }

  function render() {
    const assigns = live(state.assignments);
    const subs = live(state.submissions).slice().sort((a, b) => b.id - a.id);
    const student = state.students.find(s => s.id === state.user.id) || state.user;
    id('mainScreen').hidden = true;
    id('homeworkDashboard').style.display = 'block';
    text('hwStudentName', student.name);
    text('hwCode', student.homework_code || student.login || 'Chế độ bài tập');
    if (student.subject) {
      id('hwSubjectTag').style.display = 'inline-flex';
      text('hwSubject', student.subject);
    }

    const submittedAssignIds = new Set(subs.map(s => s.assignment_id));
    const done = submittedAssignIds.size;
    const late = subs.filter(s => {
      const due = assigns.find(a => a.id === s.assignment_id)?.due_date;
      return due && s.submitted_at.slice(0, 10) > due;
    }).length;
    const missing = Math.max(0, assigns.length - done);

    text('kpiTotal', assigns.length);
    text('kpiSubmitted', done);
    text('kpiOnTime', Math.max(0, subs.length - late));
    text('kpiMissing', missing);

    const pct = assigns.length ? Math.round((100 * done) / assigns.length) : 0;
    text('hwDonutPct', assigns.length ? `${pct}%` : '—');
    html('hwDonutLegend', `
      <div class="hw-donut-leg-item"><span class="hw-donut-leg-dot" style="background:#3B82F6;"></span><span>Đã nộp</span><span class="hw-donut-leg-count">${done}</span></div>
      <div class="hw-donut-leg-item"><span class="hw-donut-leg-dot" style="background:#E2E8F0;"></span><span>Chưa nộp</span><span class="hw-donut-leg-count">${missing}</span></div>
    `);

    if (window.Chart && id('hwDonutChart')) {
      if (donutChart) donutChart.destroy();
      donutChart = new Chart(id('hwDonutChart'), {
        type: 'doughnut',
        data: { datasets: [{ data: assigns.length ? [done, missing] : [0, 1], backgroundColor: assigns.length ? ['#3B82F6', '#E2E8F0'] : ['#CBD5E1', '#E2E8F0'], borderWidth: 0 }] },
        options: { cutout: '72%', responsive: false, animation: false, plugins: { legend: { display: false } } },
      });
    }

    const gradedSubs = subs.filter(s => s.score != null).reverse();
    if (window.Chart && id('hwBarChart')) {
      if (barChart) barChart.destroy();
      barChart = new Chart(id('hwBarChart'), {
        type: 'bar',
        data: {
          labels: gradedSubs.length ? gradedSubs.map(s => assignTitle(s.assignment_id)) : ['Chưa có điểm'],
          datasets: [{ label: 'Điểm bài tập', data: gradedSubs.length ? gradedSubs.map(s => s.score) : [0], backgroundColor: '#3B82F6', borderRadius: 8 }],
        },
        options: { responsive: true, maintainAspectRatio: false, animation: false, scales: { y: { min: 0, max: 10 } } },
      });
    }

    html('workChoice', assigns.map(a => `<option value="${a.id}">${e(a.title)}</option>`).join(''));
    id('btnSubmitHomework').disabled = !assigns.length;

    id('hwAssignedCard').style.display = 'block';
    html('hwAssignedListContainer', assigns.map(a => {
      const isDone = submittedAssignIds.has(a.id);
      const fileBtns = (a.files || []).map(f =>
        `<a class="btn-download-assigned" href="/api/files/${Number(f.id)}?download=1" style="text-decoration:none;"><i class="fa-solid fa-download"></i> ${e(f.name)}</a>`
      ).join('');
      return `<div class="hw-assigned-card ${isDone ? 'submitted' : 'not-submitted'}">
        <div class="hw-assigned-left">
          <div class="hw-assigned-icon ${isDone ? 'icon-done' : 'icon-todo'}"><i class="fa-solid ${isDone ? 'fa-circle-check' : 'fa-file-pen'}"></i></div>
          <div>
            <div class="hw-assigned-title">${e(a.title)}</div>
            <div class="hw-assigned-deadline"><i class="fa-regular fa-clock"></i> Hạn nộp: ${e(date(a.due_date))}</div>
            ${a.description ? `<div class="hw-assigned-desc">${e(a.description)}</div>` : ''}
          </div>
        </div>
        <div class="hw-assigned-right">
          <span class="hw-status-badge ${isDone ? 'badge-done' : 'badge-todo'}">${isDone ? 'Đã nộp' : 'Chưa nộp'}</span>
          ${fileBtns}
          <button type="button" class="btn-submit-assigned" data-command="choose" data-key="${a.id}"><i class="fa-solid fa-paper-plane"></i> Nộp bài</button>
        </div>
      </div>`;
    }).join('') || '<p style="color:#64748B;padding:12px;">Gia sư chưa giao bài tập nào.</p>');

    const statusBadge = s => {
      if (s.score != null) {
        return `<span class="sub-status-chip sub-on-time">${s.score}/10 · ${e(s.comment || 'Đã chấm')}</span>`;
      }
      const due = assigns.find(a => a.id === s.assignment_id)?.due_date;
      const isLate = due && s.submitted_at.slice(0, 10) > due;
      return isLate
        ? '<span class="sub-status-chip sub-late">Nộp trễ · Chờ chấm</span>'
        : '<span class="sub-status-chip sub-default">Đã nộp · Chờ chấm</span>';
    };

    const actions = s => (s.score == null
      ? `<button type="button" class="action-btn-hw btn-edit" data-command="edit" data-key="${s.id}"><i class="fa-solid fa-pen"></i> Sửa</button>
         <button type="button" class="action-btn-hw btn-delete" data-command="remove" data-key="${s.id}"><i class="fa-solid fa-trash"></i> Thu hồi</button>`
      : '<span style="font-size:12px;color:#059669;font-weight:600;"><i class="fa-solid fa-lock"></i> Đã chấm</span>');

    html('homeworkListBody', subs.map(s => `
      <tr>
        <td style="white-space:nowrap;">${e(date(s.submitted_at))}</td>
        <td><strong>${e(assignTitle(s.assignment_id))}</strong>${s.content ? `<div style="font-size:12px;color:#64748B;margin-top:2px;">${e(s.content)}</div>` : ''}</td>
        <td>${files(s.files) || '<span style="color:#94A3B8;">—</span>'}</td>
        <td>${statusBadge(s)}</td>
        <td style="text-align:center;"><div style="display:inline-flex;gap:6px;">${actions(s)}</div></td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;color:#64748B;">Chưa nộp bài tập nào.</td></tr>');

    html('homeworkMobileList', subs.map(s => `
      <div class="accordion-item">
        <div class="accordion-header" style="padding:14px 16px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;">
            <strong>${e(assignTitle(s.assignment_id))}</strong>
            ${statusBadge(s)}
          </div>
          <div style="font-size:12px;color:#64748B;margin-top:4px;">Nộp ngày ${e(date(s.submitted_at))}</div>
          ${s.content ? `<p style="font-size:13px;color:#334155;margin:8px 0 6px;">${e(s.content)}</p>` : ''}
          <div>${files(s.files)}</div>
          <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;">${actions(s)}</div>
        </div>
      </div>
    `).join('') || '<p style="color:#64748B;padding:12px;">Chưa nộp bài tập nào.</p>');
  }

  async function reload() {
    state = await request('dashboard');
    render();
  }

  id('uploadAreaDesktop')?.addEventListener('click', () => id('hwFileInputDesktop')?.click());
  id('hwFileInputDesktop')?.addEventListener('change', updateFileBadge);
  const dropZone = id('uploadAreaDesktop');
  dropZone?.addEventListener('dragover', ev => { ev.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone?.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone?.addEventListener('drop', ev => {
    ev.preventDefault();
    dropZone.classList.remove('dragover');
    if (ev.dataTransfer?.files?.length && id('hwFileInputDesktop')) {
      id('hwFileInputDesktop').files = ev.dataTransfer.files;
      updateFileBadge();
    }
  });

  Lab.on('formBaiTap', 'submit', async event => {
    event.preventDefault();
    const code = id('maInput').value.trim();
    if (pin.value) await request('login', 'POST', { login: code, password: pin.value });
    else await request('homework/access', 'POST', { code });
    const data = await request('dashboard');
    if (!['student', 'homework'].includes(data.user.role)) {
      location.assign('/' + Lab.roles[data.user.role] + '.html');
      return;
    }
    state = data;
    render();
  });

  Lab.on('submitWork', 'submit', async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    if (!data.get('content')?.trim() && !data.getAll('files').some(f => f.size)) {
      throw new Error('Hãy nhập nội dung hoặc chọn tệp để nộp.');
    }
    const b = id('btnSubmitHomework');
    b.disabled = true;
    try {
      await request(editing ? 'submissions/' + editing : 'submissions', editing ? 'PATCH' : 'POST', data);
      editing = null;
      form.reset();
      updateFileBadge();
      text('btnSubmitHomeworkLabel', 'Gửi bài làm');
      id('cancelSubmissionEdit')?.remove();
      await reload();
      Lab.notice('Đã lưu bài nộp.');
    } finally {
      b.disabled = false;
    }
  });

  Lab.commands({
    choose: key => {
      editing = null;
      id('submitWork').reset();
      updateFileBadge();
      id('workChoice').value = key;
      text('btnSubmitHomeworkLabel', 'Gửi bài làm');
      id('cancelSubmissionEdit')?.remove();
      id('hwContentInput')?.focus();
      id('hwFormCard')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    },
    edit: key => {
      const s = state.submissions.find(x => x.id === Number(key));
      if (!s) return;
      editing = s.id;
      id('workChoice').value = s.assignment_id;
      id('hwContentInput').value = s.content || '';
      text('btnSubmitHomeworkLabel', 'Lưu thay đổi');
      if (!id('cancelSubmissionEdit')) {
        id('btnSubmitHomework').insertAdjacentHTML('afterend', '<button type="button" class="action-btn-hw btn-delete" data-command="cancelEdit" id="cancelSubmissionEdit" style="height:46px;padding:0 16px;">Hủy sửa</button>');
      }
      id('hwContentInput').focus();
    },
    cancelEdit: () => {
      editing = null;
      id('submitWork').reset();
      updateFileBadge();
      text('btnSubmitHomeworkLabel', 'Gửi bài làm');
      id('cancelSubmissionEdit')?.remove();
    },
    remove: key => Lab.dialog('Thu hồi bài nộp?', [], async () => {
      await request('submissions/' + key, 'DELETE');
      await reload();
      Lab.notice('Đã thu hồi bài nộp.');
    }, 'Thu hồi'),
  });

  request('session').then(async data => {
    if (['student', 'homework'].includes(data.user?.role)) await reload();
  }).catch(err => {
    if (err.status !== 401) Lab.notice(err.message, true);
  });
})();
