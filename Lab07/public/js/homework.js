'use strict';
(() => {
  const { id, html, text, escape: e, request, live, date } = Lab;
  id('maInput').placeholder = 'Nhập mã bài tập của bạn...';

  let state = null;
  let editing = null;
  let donutChart = null;
  let barChart = null;
  const assignTitle = aid => state.assignments.find(a => a.id === aid)?.title || 'Bài tập';

  function updateFileBadge() {
    const input = id('hwFileInputDesktop');
    const list = [...input.files];
    id('fileQueueContainer').style.display = list.length ? 'block' : 'none';
    text('fileQueueCount', list.length + ' tệp');
    text('fileQueueList', list.map(file => file.name).join(' · '));
  }

  for (const picker of document.querySelectorAll('[data-pick-file]')) {
    const field = id(picker.dataset.pickFile);
    picker.onclick = () => field.click();
    field.onchange = () => {
      const desktop = id('hwFileInputDesktop');
      const combined = new DataTransfer();
      for (const file of [...desktop.files, ...field.files]) combined.items.add(file);
      desktop.files = combined.files;
      field.value = '';
      updateFileBadge();
    };
  }
  Lab.commands({clearSelectedFile: () => { id('hwFileInputDesktop').value=''; updateFileBadge(); }});

  function hwDonutLeg(color, label, count) {
      return '<div class="hw-donut-leg-item">' +
          '<span class="hw-donut-leg-dot" style="background:' + color + ';"></span>' +
          '<span>' + label + '</span>' +
          '<span class="hw-donut-leg-count">' + count + '</span>' +
          '</div>';
  }

  function drawHomeworkCharts(stats, subList) {
    const {onTime,late,overdue,pending,pct} = stats;
      // --- DONUT CHART ---
      var pctEl = document.getElementById('hwDonutPct');
      var legEl = document.getElementById('hwDonutLegend');
      if (pctEl) pctEl.textContent = stats.total > 0 ? (pct + '%') : '-';
      if (legEl) {
          legEl.innerHTML =
              hwDonutLeg('#10B981', 'Đúng hạn', onTime) +
              hwDonutLeg('#F59E0B', 'Nộp trễ', late) +
              hwDonutLeg('#EF4444', 'Quá hạn chưa nộp', overdue) +
              (pending > 0 ? hwDonutLeg('#94A3B8', 'Còn hạn', pending) : '');
      }

      var donutCtx = document.getElementById('hwDonutChart');
      if (donutCtx && typeof Chart !== 'undefined') {
          if (donutChart) donutChart.destroy();
          var allZero = (onTime === 0 && late === 0 && overdue === 0 && pending === 0);
          var dData = allZero ? [0, 0, 0, 1] : [onTime, late, overdue, pending];
          var dColors = allZero ? ['#10B981', '#F59E0B', '#EF4444', '#E2E8F0'] : ['#10B981', '#F59E0B', '#EF4444', '#CBD5E1'];
          donutChart = new Chart(donutCtx, {
              type: 'doughnut',
              data: {
                  datasets: [{
                      data: dData,
                      backgroundColor: dColors,
                      borderWidth: 0,
                      hoverOffset: 4
                  }]
              },
              options: {
                  cutout: '70%',
                  responsive: false,
                  plugins: {
                      legend: { display: false },
                      tooltip: {
                          callbacks: {
                              label: function(c) {
                                  var L = ['Đúng hạn', 'Nộp trễ', 'Quá hạn chưa nộp', 'Còn hạn'];
                                  return ' ' + (c.chart.data.labels[c.dataIndex] || '') + ': ' + c.raw + ' ' + window.translatePortalText('bài');
                              }
                          }
                      }
                  }
              }
          });
      }

      // --- LINE CHART: Bài nộp theo từng tuần TRONG THÁNG HIỆN TẠI (Thứ 2 → Chủ nhật, cắt theo ranh giới tháng) ---
      var weekLabels = [];
      var weekStarts = [];
      var nowM = new Date();
      var mFirst = new Date(nowM.getFullYear(), nowM.getMonth(), 1);
      var mNext = new Date(nowM.getFullYear(), nowM.getMonth() + 1, 1);
      var cursor = new Date(mFirst);
      while (cursor < mNext) {
          var wEnd = new Date(cursor);
          wEnd.setDate(cursor.getDate() + (6 - ((cursor.getDay() + 6) % 7))); // tới Chủ nhật
          if (wEnd >= mNext) wEnd = new Date(mNext.getTime() - 86400000);
          weekStarts.push(cursor.getTime());
          weekLabels.push(cursor.getDate() + '–' + wEnd.getDate() + '/' + (nowM.getMonth() + 1));
          cursor = new Date(wEnd); cursor.setDate(wEnd.getDate() + 1);
      }
      var weekData = weekStarts.map(function() { return 0; });
      var rangeEnd = mNext.getTime();
      subList.forEach(function(sub) {
          var ts = new Date(sub.submitted_at.replace(' ', 'T')).getTime();
          if (!ts || isNaN(ts) || ts < weekStarts[0] || ts >= rangeEnd) return;
          for (var k = weekStarts.length - 1; k >= 0; k--) {
              if (ts >= weekStarts[k]) { weekData[k]++; break; }
          }
      });

      var barCtx = document.getElementById('hwBarChart');
      if (barCtx && typeof Chart !== 'undefined') {
          if (barChart) barChart.destroy();
          barChart = new Chart(barCtx, {
              type: 'line',
              data: {
                  labels: weekLabels,
                  datasets: [{
                      label: 'Bài đã nộp',
                      data: weekData,
                      borderColor: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.12)',
                      fill: true,
                      tension: 0.38,
                      borderWidth: 3,
                      pointRadius: 5,
                      pointHoverRadius: 7,
                      pointBackgroundColor: '#3B82F6',
                      pointBorderColor: '#FFFFFF',
                      pointBorderWidth: 2
                  }]
              },
              options: {
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                      legend: { display: false },
                      tooltip: {
                          backgroundColor: '#1E293B',
                          titleColor: '#FFFFFF',
                          bodyColor: '#CBD5E1',
                          padding: 10,
                          cornerRadius: 8,
                          callbacks: {
                              label: function(c) { return ' ' + c.raw + ' ' + window.translatePortalText('bài đã nộp'); }
                          }
                      }
                  },
                  scales: {
                      x: {
                          grid: { display: false },
                          ticks: { color: '#64748B', font: { family: 'Inter', size: 11, weight: '600' } }
                      },
                      y: {
                          beginAtZero: true,
                          suggestedMax: Math.max.apply(null, weekData) < 3 ? 3 : undefined,
                          ticks: { stepSize: 1, precision: 0, color: '#94A3B8', font: { family: 'Inter', size: 11 } },
                          grid: { color: 'rgba(226, 232, 240, 0.6)' }
                      }
                  }
              }
          });
      }
  }


  function render() {
    const assigns = live(state.assignments);
    const subs = live(state.submissions).slice().sort((a, b) => b.id - a.id);
    const student = state.students.find(s => s.id === state.user.id) || state.user;
    id('mainScreen').hidden = true;
    id('homeworkDashboard').style.display = 'block';
    text('hwStudentName', student.name);
    id('hwStudentInput').value = student.name;
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

    const overdue = assigns.filter(a=>!submittedAssignIds.has(a.id) && a.due_date && a.due_date < Lab.iso()).length;
    const lateAssignments = assigns.filter(a=> {
      const attempts = subs.filter(sub=>sub.assignment_id===a.id);
      return a.due_date && attempts.length && attempts.every(sub=>sub.submitted_at.slice(0,10)>a.due_date);
    }).length;
    drawHomeworkCharts({total:assigns.length,onTime:done-lateAssignments,late:lateAssignments,overdue,
      pending:missing-overdue,pct:assigns.length ? Math.round(100*done/assigns.length) : 0},subs);

    html('workChoice', assigns.map(a => `<option value="${a.id}">${e(a.title)}</option>`).join(''));
    id('btnSubmitHomework').disabled = !assigns.length;

    renderAssignedHomeworkList();
    renderHomeworkList();
    document.dispatchEvent(new Event("lab:portal-ready"));
  }

  const assignedHwLimit=5, hwDisplayLimit=5;
  const escapeHtml=e;
  function fileButtons(file, suffix, assignment) {
    const key=Number(file.id), label=suffix ? ' · '+e(suffix) : '';
    const view='<button type="button" class="btn-view-assigned" data-command="viewFile" data-key="'+key+'"><i class="fa-solid '+(assignment?'fa-eye':'fa-file-lines')+'"></i> '+(assignment?'Xem đề':'Xem bài nộp')+label+'</button>';
    return assignment ? view+' <a class="btn-download-assigned" href="/api/files/'+key+'?download=1"><i class="fa-solid fa-download"></i> Tải bài</a>' : view;
  }
  function closePreview(){
    id('previewSubmissionModal').style.display='none';
    id('submissionPreviewIframe').removeAttribute('src');
  }
  Lab.commands({
    assignedPage:key=>renderAssignedHomeworkList(key==='all'),
    historyPage:key=>renderHomeworkList(key==='all'),
    accordion:key=>toggleHwAccordion(Number(key)),
    viewFile:(key,button)=>{
      text("submissionPreviewTitle",button.textContent.trim());
      const url='/api/files/'+Number(key);
      id('submissionPreviewIframe').src=url;
      id('submissionPreviewIframe').style.display='block';
      id('submissionPreviewNewTabBtn').href=url;
      id('previewSubmissionModal').style.display='flex';
    },
    closeSubmissionPreviewModal:closePreview
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape')closePreview();});
function renderAssignedHomeworkList(showAll) {
    var assignedCard = document.getElementById('hwAssignedCard');
    var assignedContainer = document.getElementById('hwAssignedListContainer');
    if (!assignedContainer || !assignedCard) return;

    assignedContainer.innerHTML = "";
    assignedCard.style.display = 'block';

    const sortedList = live(state.assignments).sort((a,b)=>b.release_date.localeCompare(a.release_date)||b.id-a.id);
    if (sortedList.length) {
        var totalCount = sortedList.length;
        var limit = showAll ? totalCount : assignedHwLimit;
        var visibleList = sortedList.slice(0, limit);
        var cardsHtml = "";

        const completed = new Set(live(state.submissions).map(s=>s.assignment_id));
        visibleList.forEach(function(hw) {
            const submittedForThis = completed.has(hw.id);
            var cardHtml = "";
            cardHtml += '<div class="hw-assigned-card ' + (submittedForThis ? 'submitted' : 'not-submitted') + '">';
            cardHtml += '  <div class="hw-assigned-left">';
            cardHtml += '    <div class="hw-assigned-icon ' + (submittedForThis ? 'icon-done' : 'icon-todo') + '">';
            cardHtml += '      <i class="fa-solid ' + (submittedForThis ? 'fa-circle-check' : 'fa-book-open') + '"></i>';
            cardHtml += '    </div>';
            cardHtml += '    <div class="hw-assigned-info">';
            cardHtml += '      <div class="hw-assigned-title">' + escapeHtml(hw.title || 'Bài tập') + '</div>';
            var dueDate = hw.due_date ? date(hw.due_date) : '';
            var metaHtml = '';
            if (hw.release_date) {
                metaHtml += '<span style="color:#64748B; font-weight:500;"><i class="fa-regular fa-calendar-days"></i> Giao: ' + escapeHtml(date(hw.release_date)) + '</span>';
            }
            if (dueDate) {
                metaHtml += '<span style="color:#D97706; font-weight:600;"><i class="fa-regular fa-clock"></i> Hạn: ' + escapeHtml(dueDate) + '</span>';
            }
            if (metaHtml) {
                cardHtml += '      <div class="hw-assigned-deadline" style="display:flex; gap:12px; flex-wrap:wrap;">' + metaHtml + '</div>';
            }
            if (hw.description) {
                cardHtml += '      <div class="hw-assigned-desc">' + escapeHtml(hw.description) + '</div>';
            }
            cardHtml += '    </div>';
            cardHtml += '  </div>';
            cardHtml += '  <div class="hw-assigned-right">';

            if (submittedForThis) {
                cardHtml += '    <span class="hw-status-badge badge-done">';
                cardHtml += '      <i class="fa-solid fa-circle-check"></i> Đã nộp';
                cardHtml += '    </span>';
            } else {
                cardHtml += '    <button type="button" data-command="choose" data-key="' + hw.id + '" class="btn-submit-assigned">';
                cardHtml += '      <i class="fa-solid fa-paper-plane"></i> Nộp bài';
                cardHtml += '    </button>';
            }

            for (const file of hw.files || []) {
                cardHtml += fileButtons(file, hw.files.length>1 ? file.name : '', true);
            }
            cardHtml += '  </div>';
            cardHtml += '</div>';

            cardsHtml += cardHtml;
        });

        // Nút Xem thêm / Thu gọn
        if (totalCount > assignedHwLimit) {
            var remaining = totalCount - assignedHwLimit;
            if (!showAll) {
                cardsHtml +=
                    '<div style="text-align:center; margin-top:10px;">' +
                    '<button data-command="assignedPage" data-key="all" style="background:#EFF6FF; border:1px solid #BFDBFE; color:#2563EB; padding:8px 20px; border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; width:100%; display:inline-flex; justify-content:center; align-items:center; gap:6px;">' +
                    '<i class="fa-solid fa-chevron-down"></i> Xem thêm ' + remaining + ' bài cũ hơn' +
                    '</button></div>';
            } else {
                cardsHtml +=
                    '<div style="text-align:center; margin-top:10px;">' +
                    '<button data-command="assignedPage" style="background:#EFF6FF; border:1px solid #BFDBFE; color:#64748B; padding:8px 20px; border-radius:10px; cursor:pointer; font-size:13px; font-weight:600; width:100%; display:inline-flex; justify-content:center; align-items:center; gap:6px;">' +
                    '<i class="fa-solid fa-chevron-up"></i> Thu gọn' +
                    '</button></div>';
            }
        }
        assignedContainer.innerHTML = cardsHtml;
    } else {
        assignedContainer.innerHTML = '<div style="text-align: center; color: #64748B; padding: 24px; font-size: 13.5px;"><i class="fa-solid fa-circle-info" style="color:#3B82F6; margin-right:6px;"></i> Hiện chưa có bài tập nào được giao từ Gia sư.</div>';
    }
}

// 3. Render danh sách các file bài tập đã nộp

function renderHomeworkList(showAll) {
    var body = document.getElementById('homeworkListBody');
    var mobileContainer = document.getElementById('homeworkMobileList');
    body.innerHTML = "";
    if (mobileContainer) mobileContainer.innerHTML = "";

    const sortedList=live(state.submissions).sort((a,b)=>b.submitted_at.localeCompare(a.submitted_at)||b.id-a.id);
    if (sortedList.length) {
        var totalCount = sortedList.length;
        var limit = showAll ? totalCount : hwDisplayLimit;
        var visibleList = sortedList.slice(0, limit);

        var mobileHtml = "";
        var desktopRowsHtml = "";
        visibleList.forEach(function(item, idx) {
            const displayTime = e(date(item.submitted_at)+' '+item.submitted_at.slice(11,16));
            const title = assignTitle(item.assignment_id);
            const viewBtn = (item.files || []).map(file=>fileButtons(file,item.files.length>1 ? file.name : '',false)).join(' ');
            const submissionDetail = [viewBtn, e(item.content || '')].filter(Boolean).join('<br>') || 'Không có file';

            var rowHtml = "<tr>";
            rowHtml += "<td style='color:#64748B; font-weight:500;'>" + displayTime + "</td>";
            rowHtml += "<td><strong style='color:#1E293B;'>" + escapeHtml(title) + "</strong></td>";
            rowHtml += "<td>" + submissionDetail + "</td>";

            var statusStr = item.status || "Active";
            var rawScore = (item.score !== undefined && item.score !== null) ? String(item.score).trim() : "";
            var isGraded = rawScore !== "" && rawScore !== "-" && rawScore !== "null" && rawScore !== "undefined";
            var scoreVal = isGraded ? rawScore : null;
            var statusBadge = "";
            if (statusStr === "Deleted") {
                statusBadge = "<span class='sub-status-chip' style='background:#FEF2F2; color:#DC2626; font-weight:700;'><i class='fa-solid fa-trash-can'></i> Thùng rác</span>";
            } else if (scoreVal) {
                var scoreText = escapeHtml(scoreVal + (scoreVal.endsWith('đ') || scoreVal.endsWith(' điểm') ? '' : 'đ'));
                statusBadge = "<span class='sub-status-chip sub-on-time' style='font-weight:700;'><i class='fa-solid fa-star'></i> " + scoreText + "</span>";
            } else {
                statusBadge = "<span class='sub-status-chip sub-default'><i class='fa-solid fa-circle-check' style='margin-right:4px;'></i>Đã nộp</span>";
            }
            if (item.comment && item.comment.trim() !== "") {
                statusBadge += "<div style='color:#2563EB; font-style:italic; font-size:11.5px; margin-top:4px;' title='Nhận xét của Giáo viên'><i class='fa-solid fa-comment-dots'></i> " + escapeHtml(item.comment) + "</div>";
            }
            rowHtml += "<td>" + statusBadge + "</td>";

            var isRowLocked = item.score != null;
            var rowKey = item.id;

            rowHtml += "<td style='text-align: center; vertical-align: middle;'>";
            var actionsHtml = "";
            var mobileActionsHtml = "";

            if (isRowLocked) {
                actionsHtml = '<span class="lock-badge"><i class="fa-solid fa-lock"></i> Khóa sửa/xóa</span>';
                mobileActionsHtml = '<span class="lock-badge"><i class="fa-solid fa-lock"></i> Khóa sửa/xóa</span>';
            } else {
                actionsHtml = '<button data-command="edit" data-key="' + rowKey + '" class="action-btn-hw btn-edit" style="padding: 5px 12px; margin-right: 6px;"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>';
                actionsHtml += '<button data-command="remove" data-key="' + rowKey + '" class="action-btn-hw btn-delete" style="padding: 5px 12px;"><i class="fa-solid fa-trash-can"></i> Xóa</button>';

                mobileActionsHtml = '<div style="display: flex; gap: 8px;">';
                mobileActionsHtml += '  <button data-command="edit" data-key="' + rowKey + '" class="hw-btn-edit" style="flex: 1; justify-content: center;"><i class="fa-solid fa-pen-to-square"></i> Sửa</button>';
                mobileActionsHtml += '  <button data-command="remove" data-key="' + rowKey + '" class="hw-btn-del" style="flex: 1; justify-content: center;"><i class="fa-solid fa-trash-can"></i> Xóa</button>';
                mobileActionsHtml += '</div>';
            }
            rowHtml += actionsHtml + "</td>";
            rowHtml += "</tr>";
            desktopRowsHtml += rowHtml;

            // Mobile Accordion Card
            var headerStatusBadge = "";
            if (statusStr === "Deleted") {
                headerStatusBadge = "<span class='sub-status-chip' style='background:#FEF2F2; color:#DC2626; font-weight:700;'><i class='fa-solid fa-trash-can'></i> Thùng rác</span>";
            } else if (scoreVal) {
                var scoreText = escapeHtml(scoreVal + (scoreVal.endsWith('đ') || scoreVal.endsWith(' điểm') ? '' : 'đ'));
                headerStatusBadge = "<span style='color:var(--color-primary, #3B82F6); font-size:12.5px; font-weight:700; display:inline-flex; align-items:center; gap:4px;'><i class='fa-solid fa-star'></i> " + scoreText + "</span>";
            } else {
                headerStatusBadge = "<span style='color:#8B5CF6; font-size:12.5px; font-weight:600; display:inline-flex; align-items:center; gap:5px;'><i class='fa-regular fa-clock'></i> Chưa chấm</span>";
            }

            mobileHtml += "<div class='accordion-item' id='hw-item-" + idx + "'>";
            mobileHtml += "  <div class='accordion-header' data-command='accordion' data-key='" + idx + "'>";
            mobileHtml += "    <div class='accordion-header-title'>";
            mobileHtml += "      <span>" + escapeHtml(title) + "</span>";
            mobileHtml += "      <span class='accordion-header-date'>" + displayTime + "</span>";
            mobileHtml += "    </div>";
            mobileHtml += "    <div class='accordion-header-status'>";
            mobileHtml += "      " + headerStatusBadge;
            mobileHtml += "      <i class='fa-solid fa-chevron-down' id='hw-chevron-" + idx + "'></i>";
            mobileHtml += "    </div>";
            mobileHtml += "  </div>";
            mobileHtml += "  <div class='accordion-body' id='hw-accordion-body-" + idx + "' style='display: none;'>";
            mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Thời gian nộp</span><span class='accordion-body-val'>" + displayTime + "</span></div>";
            mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Xem bài làm</span><span class='accordion-body-val'>" + submissionDetail + "</span></div>";
            mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Trạng thái / Điểm</span><span class='accordion-body-val'>" + statusBadge + "</span></div>";
            if (item.comment && item.comment.trim() !== "") {
                mobileHtml += "    <div class='accordion-body-row'><span class='accordion-body-label'>Nhận xét của Giáo viên</span><span class='accordion-body-val' style='color:#2563EB; font-style:italic; font-size:12.5px;'>" + escapeHtml(item.comment) + "</span></div>";
            }
            mobileHtml += "    <div class='accordion-body-row' style='border-bottom:none; padding-bottom:0; padding-top:10px;'><span class='accordion-body-label'>Thao tác</span><span class='accordion-body-val' style='margin-top:4px;'>" + mobileActionsHtml + "</span></div>";
            mobileHtml += "  </div>";
            mobileHtml += "</div>";
        });

        // Nút Xem thêm / Thu gọn
        if (totalCount > hwDisplayLimit) {
            var remaining = totalCount - hwDisplayLimit;
            if (!showAll) {
                // Thêm dòng Xem thêm vào bảng desktop
                desktopRowsHtml += "<tr><td colspan='5' style='text-align:center; padding:12px;'>"
                    + "<button type='button' data-command='historyPage' data-key='all' class=\"btn-load-more-hw\" style=\"width:auto; min-width:280px; margin:0 auto;\">"
                    + "<i class='fa-solid fa-chevron-down'></i> Xem thêm " + remaining + " bài nộp cũ hơn"
                    + "</button></td></tr>";
                // Thêm nút Xem thêm vào mobile
                mobileHtml += "<div style='text-align:center; padding:10px 0;'>"
                    + "<button type='button' data-command='historyPage' data-key='all' class=\"btn-load-more-hw\">"
                    + "<i class='fa-solid fa-chevron-down'></i> Xem thêm " + remaining + " bài nộp cũ hơn"
                    + "</button></div>";
            } else {
                // Nút Thu gọn
                desktopRowsHtml += "<tr><td colspan='5' style='text-align:center; padding:12px;'>"
                    + "<button type='button' data-command='historyPage' class=\"btn-collapse-hw\" style=\"width:auto; min-width:200px; margin:0 auto;\">"
                    + "<i class='fa-solid fa-chevron-up'></i> Thu gọn"
                    + "</button></td></tr>";
                mobileHtml += "<div style='text-align:center; padding:10px 0;'>"
                    + "<button type='button' data-command='historyPage' class=\"btn-collapse-hw\">"
                    + "<i class='fa-solid fa-chevron-up'></i> Thu gọn"
                    + "</button></div>";
            }
        }

        body.innerHTML = desktopRowsHtml;
        if (mobileContainer) mobileContainer.innerHTML = mobileHtml;
    } else {
        body.innerHTML = "<tr><td colspan='5' style='text-align:center; color:#64748B; padding:24px;'>Chưa có file bài tập nào được nộp cho mã này.</td></tr>";
        if (mobileContainer) {
            mobileContainer.innerHTML = "<div style='text-align:center; color:#64748B; padding: 24px; font-size:13px;'>Chưa có file bài tập nào được nộp cho mã này.</div>";
        }
    }

    // Đồng bộ KPI & Biểu đồ khi danh sách thay đổi
}

function toggleHwAccordion(idx) {
    var body = document.getElementById('hw-accordion-body-' + idx);
    if (!body) return;
    var item = body.closest('.accordion-item');
    if (body.style.display === 'flex' || body.style.display === 'block') {
        body.style.display = 'none';
        if (item) item.classList.remove('active');
    } else {
        body.style.display = 'block';
        if (item) item.classList.add('active');
    }
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
    await request('homework/access','POST',{code});
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
