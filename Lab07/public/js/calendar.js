'use strict';
(async () => {
  const { id, text, html, escape: e, live, date, request, notice } = Lab;
  const WEEKDAYS = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
  const PRESET_COLORS = [
    '#2563eb', '#8E4DFF', '#00D2FC', '#10B981', '#4CAF50', '#AEEA00',
    '#FFD23F', '#FF9100', '#FF6B9D', '#FF4D4D', '#64748B', '#0EA5E9',
  ];

  if (new URLSearchParams(location.search).get('embed') === '1') {
    document.documentElement.classList.add('is-embedded-calendar');
    document.body.classList.add('is-embedded-calendar');
  }

  let data = await Lab.dashboard(['tutor', 'admin']);
  if (!data) return;
  Lab.theme(data.user.theme);

  const studentMap = () => new Map(data.students.map(s => [s.id, s]));
  const activeStudents = () => live(data.students);
  const activeSchedules = () => live(data.schedules);
  let calendar = null;
  let activeSchedule = null;

  const isoLocal = dt => [
    dt.getFullYear(),
    String(dt.getMonth() + 1).padStart(2, '0'),
    String(dt.getDate()).padStart(2, '0'),
  ].join('-');
  const hhmm = dt => String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
  const fcWeekday = dt => (dt.getDay() === 0 ? 7 : dt.getDay());

  function initSwatches() {
    const container = id('colorSwatches');
    if (!container) return;
    container.innerHTML = PRESET_COLORS.map(c =>
      `<div class="color-swatch" data-color="${c}" style="background-color:${c};"></div>`
    ).join('');
    container.querySelectorAll('.color-swatch').forEach(sw => {
      sw.onclick = () => selectColor(sw.dataset.color);
    });
  }

  function selectColor(color) {
    const val = /^#[0-9a-fA-F]{6}$/.test(color || '') ? color : '#2563eb';
    id('eventColor').value = val;
    document.querySelectorAll('#colorSwatches .color-swatch').forEach(s => {
      s.classList.toggle('selected', s.dataset.color.toLowerCase() === val.toLowerCase());
    });
  }

  function toggleRepeatModeUI() {
    const mode = id('eventRepeatMode').value;
    id('daySelectGroup').style.display = mode === 'weekly' ? 'block' : 'none';
    id('specificDateGroup').style.display = mode === 'once' ? 'block' : 'none';
  }

  function renderSheetTable() {
    const tbody = id('sheetDataTableBody');
    if (!tbody) return;
    const students = activeStudents();
    const scheds = activeSchedules();
    tbody.innerHTML = students.map(stu => {
      const cols = [1, 2, 3, 4, 5, 6, 7].map(wd => {
        const items = scheds.filter(sc => sc.student_id === stu.id && Number(sc.weekday) === wd);
        const val = items.map(i => `${i.start_time} - ${i.end_time}${i.subject ? ' (' + i.subject + ')' : ''}`).join(' | ');
        return val ? `<td class="cell-active">${e(val)}</td>` : '<td class="cell-empty">-</td>';
      }).join('');
      return `<tr><td style="font-weight:700;text-align:left;">${e(stu.name)}</td>${cols}</tr>`;
    }).join('') || '<tr><td colspan="8" style="text-align:center;padding:16px;">Chưa có lịch dạy.</td></tr>';
  }

  function buildEvents(startDate, endDate) {
    const sMap = studentMap();
    const events = [];
    for (const sc of activeSchedules()) {
      const stu = sMap.get(sc.student_id);
      const label = (stu ? stu.name : 'Ca dạy') + (sc.subject ? ` (${sc.subject})` : '');
      const color = sc.color || '#2563eb';
      if (sc.date) {
        events.push({
          id: String(sc.id),
          title: label + ' [1 lần]',
          start: `${sc.date}T${sc.start_time}:00`,
          end: `${sc.date}T${sc.end_time}:00`,
          backgroundColor: color + '33',
          borderColor: color,
          textColor: '#1e293b',
          extendedProps: { schedule: sc, dateStr: sc.date },
        });
      } else if (sc.weekday) {
        const cursor = new Date(startDate);
        cursor.setHours(0, 0, 0, 0);
        while (cursor < endDate) {
          if (fcWeekday(cursor) === Number(sc.weekday)) {
            const dStr = isoLocal(cursor);
            events.push({
              id: `${sc.id}_${dStr}`,
              title: label,
              start: `${dStr}T${sc.start_time}:00`,
              end: `${dStr}T${sc.end_time}:00`,
              backgroundColor: color + '33',
              borderColor: color,
              textColor: '#1e293b',
              extendedProps: { schedule: sc, dateStr: dStr },
            });
          }
          cursor.setDate(cursor.getDate() + 1);
        }
      }
    }
    return events;
  }

  function updateLegendAndStatus(events) {
    const sMap = studentMap();
    const seen = new Map();
    for (const sc of activeSchedules()) {
      if (sc.student_id && !seen.has(sc.student_id)) seen.set(sc.student_id, sc.color || '#2563eb');
    }
    html('calStudentLegendList', [...seen.entries()].map(([sid, color]) => {
      const stu = sMap.get(sid);
      return `<span class="cal-legend-item"><span class="cal-legend-dot" style="background:${e(color)}"></span><span class="cal-legend-name">${e(stu ? stu.name : 'Học sinh')}</span></span>`;
    }).join(''));
    text('calStatusText', `${events.length} buổi trong khung xem · ${seen.size} học sinh`);
  }

  function closeDetailPopover() {
    id('eventDetailPopover')?.classList.remove('visible');
    id('popoverBackdrop')?.classList.remove('visible');
    activeSchedule = null;
  }

  function showDetailPopover(info) {
    const sc = info.event.extendedProps.schedule;
    activeSchedule = sc;
    const stu = studentMap().get(sc.student_id);
    text('detailTitle', stu ? stu.name : 'Ca dạy chung');
    const dot = id('detailColorDot');
    if (dot) dot.style.backgroundColor = sc.color || '#2563eb';
    text('detailDateTime', `${sc.date ? date(sc.date) : WEEKDAYS[sc.weekday]} · ${sc.start_time} – ${sc.end_time}`);
    text('detailRecurrence', sc.date ? 'Diễn ra một lần' : `Hàng tuần vào ${WEEKDAYS[sc.weekday].toLowerCase()}`);
    if (sc.note || sc.subject) {
      id('detailNotesContainer').style.display = 'flex';
      text('detailNotes', [sc.subject, sc.note].filter(Boolean).join(' · '));
    } else {
      id('detailNotesContainer').style.display = 'none';
    }

    const pop = id('eventDetailPopover');
    const backdrop = id('popoverBackdrop');
    if (window.innerWidth < 768) {
      pop.classList.add('visible');
      backdrop.classList.add('visible');
    } else {
      pop.style.left = '-9999px';
      pop.style.top = '-9999px';
      pop.classList.add('visible');
      const rect = info.el.getBoundingClientRect();
      const popW = pop.offsetWidth || 310;
      const popH = pop.offsetHeight || 200;
      const left = rect.right + 12 + popW <= window.innerWidth ? rect.right + 12 : Math.max(12, rect.left - 12 - popW);
      const top = Math.min(Math.max(12, rect.top), window.innerHeight - popH - 12);
      pop.style.left = left + 'px';
      pop.style.top = top + 'px';
    }
  }

  function openEventModal(existing = null, defaults = {}) {
    closeDetailPopover();
    const students = activeStudents();
    id('eventStudent').innerHTML = '<option value="">Ca dạy chung</option>' +
      students.map(s => `<option value="${s.id}">${e(s.name)}</option>`).join('');

    id('eventScheduleId').value = existing ? String(existing.id) : '';
    id('eventStudent').value = existing?.student_id ? String(existing.student_id) : (defaults.student_id || (students[0] ? String(students[0].id) : ''));
    const mode = existing ? (existing.date ? 'once' : 'weekly') : (defaults.mode || 'weekly');
    id('eventRepeatMode').value = mode;
    id('eventDayOfWeek').value = String(existing?.weekday || defaults.weekday || 1);
    id('eventSpecificDate').value = existing?.date || defaults.date || isoLocal(new Date());
    id('eventStartTime').value = existing?.start_time || defaults.start_time || '17:30';
    id('eventEndTime').value = existing?.end_time || defaults.end_time || '19:00';
    id('eventSubject').value = existing?.subject || 'Toán';
    id('eventNotes').value = existing?.note || '';
    selectColor(existing?.color || '#2563eb');
    toggleRepeatModeUI();
    id('modalTitleText').innerHTML = existing
      ? '<i class="fa-solid fa-pen-to-square" style="color:#F59E0B;"></i> Sửa lịch dạy'
      : '<i class="fa-solid fa-circle-plus" style="color:#10B981;"></i> Thêm lịch dạy';
    id('btnDeleteEvent').style.display = existing ? 'inline-block' : 'none';
    id('eventModalOverlay').classList.add('active');
    id('eventModalOverlay').style.display = 'flex';
  }

  function closeEventModal() {
    id('eventModalOverlay').classList.remove('active');
    id('eventModalOverlay').style.display = 'none';
  }

  async function reload() {
    data = await request('dashboard');
    renderSheetTable();
    calendar?.refetchEvents();
  }

  initSwatches();
  renderSheetTable();

  const calEl = id('calendar');
  calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    locale: 'vi',
    firstDay: 1,
    height: '100%',
    editable: true,
    selectable: true,
    headerToolbar: false,
    events: (info, success) => {
      const evs = buildEvents(info.start, info.end);
      updateLegendAndStatus(evs);
      success(evs);
    },
    datesSet: info => {
      const mid = new Date((info.start.getTime() + info.end.getTime()) / 2);
      const titleEl = id('calendarHeaderTitle');
      if (titleEl) {
        titleEl.innerHTML = `<span class="cal-title-main">Tháng ${mid.getMonth() + 1}</span><span class="cal-title-year">${mid.getFullYear()}</span>`;
      }
    },
    select: info => openEventModal(null, {
      mode: calendar.view.type === 'dayGridMonth' ? 'once' : 'weekly',
      weekday: fcWeekday(info.start),
      date: isoLocal(info.start),
      start_time: calendar.view.type === 'dayGridMonth' ? '17:30' : hhmm(info.start),
      end_time: calendar.view.type === 'dayGridMonth' ? '19:00' : hhmm(info.end),
    }),
    eventClick: showDetailPopover,
    eventDrop: async info => {
      const sc = info.event.extendedProps.schedule;
      const start = info.event.start;
      const end = info.event.end || new Date(start.getTime() + 90 * 60000);
      try {
        await request(`schedules/${sc.id}`, 'PATCH', {
          weekday: sc.date ? null : fcWeekday(start),
          date: sc.date ? isoLocal(start) : null,
          start_time: hhmm(start),
          end_time: hhmm(end),
        });
        await reload();
        notice('Đã cập nhật lịch dạy.');
      } catch (err) {
        info.revert();
        notice(err.message, true);
      }
    },
    eventResize: async info => {
      const sc = info.event.extendedProps.schedule;
      try {
        await request(`schedules/${sc.id}`, 'PATCH', {
          start_time: hhmm(info.event.start),
          end_time: hhmm(info.event.end),
        });
        await reload();
        notice('Đã đổi thời lượng buổi học.');
      } catch (err) {
        info.revert();
        notice(err.message, true);
      }
    },
  });
  calendar.render();

  function syncViewIndicator(pill) {
    const indicator = id('calViewIndicator');
    if (!indicator || !pill) return;
    indicator.style.left = pill.offsetLeft + 'px';
    indicator.style.width = pill.offsetWidth + 'px';
  }

  function setView(viewName, pillId) {
    calendar.changeView(viewName);
    for (const pid of ['viewPillMonth', 'viewPillWeek', 'viewPillDay']) {
      id(pid)?.classList.toggle('active', pid === pillId);
    }
    syncViewIndicator(id(pillId));
  }

  syncViewIndicator(id('viewPillMonth'));
  window.addEventListener('resize', () => syncViewIndicator(document.querySelector('.cal-view-pill.active')));

  Lab.on('eventRepeatMode', 'change', toggleRepeatModeUI);
  Lab.on('btnCalModalClose', 'click', closeEventModal);
  Lab.on('btnCancelEvent', 'click', closeEventModal);
  id('eventModalOverlay')?.addEventListener('click', ev => { if (ev.target === id('eventModalOverlay')) closeEventModal(); });

  Lab.on('eventForm', 'submit', async ev => {
    ev.preventDefault();
    const sid = id('eventScheduleId').value;
    const mode = id('eventRepeatMode').value;
    const body = {
      student_id: id('eventStudent').value || null,
      weekday: mode === 'weekly' ? Number(id('eventDayOfWeek').value) : null,
      date: mode === 'once' ? id('eventSpecificDate').value : null,
      start_time: id('eventStartTime').value,
      end_time: id('eventEndTime').value,
      subject: id('eventSubject').value,
      note: id('eventNotes').value,
      color: id('eventColor').value,
    };
    await request(sid ? `schedules/${sid}` : 'schedules', sid ? 'PATCH' : 'POST', body);
    closeEventModal();
    await reload();
    notice(sid ? 'Đã cập nhật lịch dạy.' : 'Đã thêm lịch dạy mới.');
  });

  Lab.on('btnDeleteEvent', 'click', async () => {
    const sid = id('eventScheduleId').value;
    if (!sid) return;
    await request(`schedules/${sid}`, 'DELETE');
    closeEventModal();
    await reload();
    notice('Đã xóa lịch dạy.');
  });

  Lab.on('popoverBackdrop', 'click', closeDetailPopover);
  Lab.on('btnDetailClose', 'click', closeDetailPopover);
  Lab.on('btnDetailEdit', 'click', () => { if (activeSchedule) openEventModal(activeSchedule); });
  Lab.on('btnDetailDelete', 'click', async () => {
    if (!activeSchedule) return;
    await request(`schedules/${activeSchedule.id}`, 'DELETE');
    closeDetailPopover();
    await reload();
    notice('Đã xóa lịch dạy.');
  });
  document.addEventListener('click', ev => {
    const pop = id('eventDetailPopover');
    if (pop?.classList.contains('visible') && !pop.contains(ev.target) && !ev.target.closest('.fc-event')) {
      closeDetailPopover();
    }
  });

  const toggleSheet = () => id('sheetPanel')?.classList.toggle('open');
  Lab.on('scheduleList', 'click', toggleSheet);
  Lab.on('btnCloseSheetHeader', 'click', toggleSheet);
  Lab.on('btnCloseSheetChevron', 'click', toggleSheet);

  Lab.on('btnCalPrev', 'click', () => calendar.prev());
  Lab.on('btnCalNext', 'click', () => calendar.next());
  Lab.on('btnCalToday', 'click', () => calendar.today());
  Lab.on('viewPillMonth', 'click', () => setView('dayGridMonth', 'viewPillMonth'));
  Lab.on('viewPillWeek', 'click', () => setView('timeGridWeek', 'viewPillWeek'));
  Lab.on('viewPillDay', 'click', () => setView('timeGridDay', 'viewPillDay'));

  Lab.commands({
    openAddEventModal: () => openEventModal(null),
  });
})().catch(err => Lab.notice(err.message, true));
