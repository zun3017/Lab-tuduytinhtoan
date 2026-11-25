
let calendar = null;
let revision = 0;
let pending = 0;
let needsReload = false;
let writeQueue = Promise.resolve();

async function readCalendar() {
    const response = await fetch('/api/demo/calendar');
    if (!response.ok) throw new Error('Chưa tải được lịch thực hành.');
    const state = await response.json();
    revision = state.revision;
    tutorScheduleSheetData = state.rows;
}

function showCalendarError(error) {
    needsReload = true;
    const status = document.getElementById('calendarStatus');
    status.textContent = error.message + ' ';
    const retry = document.createElement('button');
    retry.textContent = 'Tải lại lịch';
    retry.onclick = () => location.reload();
    status.appendChild(retry);
    document.querySelector('.calendar-wrapper').inert = true;
}

function saveCalendar() {
    if (needsReload) return;
    const rows = JSON.parse(JSON.stringify(tutorScheduleSheetData));
    const status = document.getElementById('calendarStatus');
    status.textContent = 'Đang lưu…';
    renderSheetTable();
    pending++;
    writeQueue = writeQueue.then(async () => {
        if (needsReload) return;
        const response = await fetch('/api/demo/calendar', {
            method: 'PUT', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({revision, rows})
        });
        if (!response.ok) throw new Error(response.status === 409
            ? 'Lịch đã thay đổi ở cửa sổ khác.' : 'Chưa lưu được thay đổi.');
        revision = (await response.json()).revision;
    }).catch(showCalendarError).finally(() => {
        pending--;
        if (!pending && !needsReload) status.textContent = 'Đã lưu vào SQLite.';
    });
}

window.addEventListener('beforeunload', event => {
    if (pending) { event.preventDefault(); event.returnValue = ''; }
});
function escapeHtml(v) {
    if (v === null || v === undefined) return '';
    return String(v).replace(/[&<>"'`]/g, function(ch) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '`': '&#96;' }[ch];
    });
}

let tutorScheduleSheetData = [];
const dayMap = {
    "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6, "sun": 0
};
const revDayMap = {
    1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 0: "sun"
};
const allDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function getStartOfWeek(d) {
    let date = new Date(d);
    let day = date.getDay();
    let diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
}

// Tạo sự kiện đưa vào FullCalendar
function generateEventsForCurrentWeek(viewStart) {
    let startOfWeek = getStartOfWeek(viewStart);
    let events = [];

    tutorScheduleSheetData.forEach((row, studentIdx) => {
        allDayKeys.forEach(dayKey => {
            let cellVal = row[dayKey];
            if (!cellVal || cellVal.trim() === '') return;

            // === Xử lý các kiểu entry ===
            // 0. Màu sắc riêng của buổi học này: [C:#RRGGBB]
            let sessionColor = '';
            let colorTagRegex = /^\[C:(#[0-9A-Fa-f]{6})\]/;
            let colorTagMatch = cellVal.match(colorTagRegex);
            if (colorTagMatch) {
                sessionColor = colorTagMatch[1];
                cellVal = cellVal.replace(colorTagRegex, '').trim();
            }

            // 1. SKIP marker: "HH:MM - HH:MM SKIP DD/MM/YYYY,..."  → lịch cố định nhưng bỏ qua ngày cụ thể
            let skipDates = [];
            let rawVal = cellVal;
            if (rawVal.includes(' SKIP ')) {
                let parts = rawVal.split(' SKIP ');
                rawVal = parts[0];
                skipDates = parts[1].split(',').map(s => s.trim());
            }

            // 2. Kiểm tra tiền tố: ngày cụ thể DD/MM/YYYY (sự kiện 1 lần)
            let datePrefixRegex = /^(\d{2})\/(\d{2})\/(\d{4}):\s*/;
            let rescheduleRegex = /^RESCHEDULE (\d{2})\/(\d{2})\/(\d{4}):\s*/;

            let dateMatch     = rawVal.match(datePrefixRegex);
            let reschedMatch  = rawVal.match(rescheduleRegex);

            let isOneTime   = false;
            let isReschedule = false;
            let oneTimeDateStr = '';
            let cleanTimeStr = rawVal;

            if (reschedMatch) {
                // "Dời tuần này" — hiển bình thường, không tag
                isReschedule = true;
                oneTimeDateStr = reschedMatch[1] + '/' + reschedMatch[2] + '/' + reschedMatch[3];
                cleanTimeStr = rawVal.replace(rescheduleRegex, '');
            } else if (dateMatch) {
                isOneTime = true;
                oneTimeDateStr = dateMatch[1] + '/' + dateMatch[2] + '/' + dateMatch[3];
                cleanTimeStr = rawVal.replace(datePrefixRegex, '');
            }

            let timeRegex = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;
            let match = cleanTimeStr.match(timeRegex);
            if (!match) return;

            let startHour = match[1];
            let startMin  = match[2];
            let endHour   = match[3];
            let endMin    = match[4];

            let notes = cleanTimeStr.replace(timeRegex, '').trim().replace(/[\(\)]/g, '').trim();

            // Xác định ngày cụ thể
            let dateStr = '';

            if (isOneTime || isReschedule) {
                let dateParts = oneTimeDateStr.split('/');
                dateStr = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
                let evDate  = new Date(dateStr);
                let weekEnd = new Date(startOfWeek);
                weekEnd.setDate(startOfWeek.getDate() + 7);
                if (evDate < startOfWeek || evDate >= weekEnd) return;
            } else {
                // Lịch lặp lại: tính ngày trong tuần
                let dayOffset = dayMap[dayKey] - 1;
                if (dayMap[dayKey] === 0) dayOffset = 6;
                let eventDate = new Date(startOfWeek);
                eventDate.setDate(startOfWeek.getDate() + dayOffset);

                let ey = eventDate.getFullYear();
                let em = (eventDate.getMonth() + 1).toString().padStart(2, '0');
                let ed = eventDate.getDate().toString().padStart(2, '0');
                dateStr = ey + '-' + em + '-' + ed;

                // Kiểm tra SKIP: nếu ngày này bị dời thì bỏ qua
                let skipCheck = ed + '/' + em + '/' + ey;
                if (skipDates.includes(skipCheck)) return;
            }

            // Tìm cột gốc có lịch lặp lại (có SKIP chứa ngày này) — chỉ dùng cho RESCHEDULE
            let originalRecurringKey = null;
            if (isReschedule) {
                for (let dk of allDayKeys) {
                    if (dk === dayKey) continue;
                    let dkVal = row[dk] || '';
                    if (!dkVal.match(/^(\d{2}\/|RESCHEDULE)/) && dkVal.includes(' SKIP ')) {
                        let skipPart = dkVal.split(' SKIP ')[1];
                        if (skipPart.split(',').map(s => s.trim()).includes(oneTimeDateStr)) {
                            originalRecurringKey = dk;
                            break;
                        }
                    }
                }
            }

            let eventType = isReschedule ? 'rs' : (isOneTime ? 'ot' : 'rp');

            let studentDefaultColor = row.color || '#8E4DFF';
            let eventColor = sessionColor || studentDefaultColor;
            // Tính màu nền và viền
            let bgColor   = eventColor + '4D';  // 4D = ~30% opacity hex
            let bdColor   = eventColor + '99';  // 99 = ~60% opacity
            let bdLColor  = eventColor;         // solid cho left border

            events.push({
                id: studentIdx + '_' + dayKey + '_' + eventType,
                title: row.studentName
                    + (notes ? (' (' + notes + ')') : '')
                    + (isOneTime ? ' [1 Lần]' : ''),
                start: dateStr + 'T' + startHour.padStart(2, '0') + ':' + startMin,
                end:   dateStr + 'T' + endHour.padStart(2, '0')   + ':' + endMin,
                backgroundColor: bgColor,
                borderColor: bdColor,
                textColor: '#FFFFFF',
                classNames: [isOneTime ? 'event-status-onetime' : 'event-status-recurring'],
                extendedProps: {
                    studentIndex: studentIdx,
                    studentName: row.studentName,
                    dayKey: dayKey,
                    startTime: startHour.padStart(2, '0') + ':' + startMin,
                    endTime:   endHour.padStart(2, '0')   + ':' + endMin,
                    notes: notes,
                    isOneTime: isOneTime,
                    isReschedule: isReschedule,
                    originalRecurringKey: originalRecurringKey,
                    oneTimeDateStr: oneTimeDateStr,
                    date: dateStr,
                    eventColor: eventColor,      // màu đang áp dụng cho event này
                    sessionColor: sessionColor,  // màu override của buổi này (rỗng = dung màu học sinh)
                    studentColor: studentDefaultColor // màu mặc định của học sinh
                }
            });
        });
    });
    return events;
}

function loadStudentOptions() {
    let select = document.getElementById("eventStudent");
    select.innerHTML = '<option value="">Chọn học sinh...</option>';
    tutorScheduleSheetData.forEach((row, idx) => {
        let opt = document.createElement("option");
        opt.value = idx;
        opt.innerText = row.studentName;
        select.appendChild(opt);
    });
}

// Đổ dữ liệu thật ra bảng mô phỏng ở cuối trang
function renderSheetTable() {
    let tbody = document.getElementById("sheetDataTableBody");
    if (!tbody) return;
    tbody.innerHTML = "";
    tutorScheduleSheetData.forEach(row => {
        let tr = document.createElement("tr");

        // Tên học sinh
        let html = `<td style="font-weight: 700; color: #FFF; text-align: left; background: rgba(255,255,255,0.01);">${escapeHtml(row.studentName)}</td>`;

        // 7 Thứ trong tuần
        allDayKeys.forEach(dayKey => {
            let val = row[dayKey];
            if (!val || val.trim() === "") {
                html += `<td class="cell-empty">-</td>`;
            } else if (val.includes("/")) {
                html += `<td class="cell-onetime" title="${escapeHtml(val)}">${escapeHtml(val)}</td>`;
            } else {
                html += `<td class="cell-active" title="${escapeHtml(val)}">${escapeHtml(val)}</td>`;
            }
        });

        tr.innerHTML = html;
        tbody.appendChild(tr);
    });
}

// Hiện/Ẩn các ô chọn ngày học theo Chế độ lặp
function toggleRepeatUI() {
    let mode = document.getElementById("eventRepeatMode").value;
    let daySelect = document.getElementById("daySelectGroup");
    let specificDate = document.getElementById("specificDateGroup");
    let dayCheckbox = document.getElementById("dayCheckboxGroup");

    if (mode === "none") {
        daySelect.style.display = "none";
        specificDate.style.display = "block";
        dayCheckbox.style.display = "none";
    } else if (mode === "weekly") {
        daySelect.style.display = "block";
        specificDate.style.display = "none";
        dayCheckbox.style.display = "none";
    } else if (mode === "daily") {
        daySelect.style.display = "none";
        specificDate.style.display = "none";
        dayCheckbox.style.display = "none";
    } else if (mode === "custom") {
        daySelect.style.display = "none";
        specificDate.style.display = "none";
        dayCheckbox.style.display = "block";
    }
}

// Khởi tạo lịch
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await readCalendar();
    } catch (error) {
        showCalendarError(error);
        return;
    }
    loadStudentOptions();
    renderSheetTable();
    initColorPickerSwatches();

    // Đăng ký sự kiện đổi học sinh -> tự chọn màu mặc định của học sinh đó
    document.getElementById("eventStudent").addEventListener("change", function() {
        let val = this.value;
        if (val !== "") {
            let studentColor = tutorScheduleSheetData[val].color || '#8E4DFF';
            setColorScope('student');
            selectPresetColor(studentColor);
        } else {
            selectPresetColor('');
        }
    });

    var calendarEl = document.getElementById('calendar');
    const initialViewType = 'dayGridMonth';

    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: initialViewType,
        locale: 'vi',
        firstDay: 1, // Bắt đầu tuần từ Thứ Hai
        height: '100%', // Chiếm 100% .calendar-wrapper - chỉ 1 thanh cuộn bên trong
        timeZone: 'local',
        slotMinTime: "00:00:00",
        slotMaxTime: "24:00:00",
        slotDuration: '00:30:00',   // Chia ô 30 phút - đúng chuẩn Google Calendar
        scrollTime: '07:00:00',      // Tự động cuộn xuống 7 giờ sáng khi mở lịch
        allDaySlot: false,
        editable: true,
        selectable: true,
        selectMirror: true,          // Hiển thị khối sự kiện ảo xem trước khi kéo thả chọn vùng thời gian
        selectLongPressDelay: 350,   // Nhấn giữ 350ms trên điện thoại rồi kéo để chọn vùng thời gian
        eventLongPressDelay: 350,    // Nhấn giữ 350ms trên điện thoại để bắt đầu kéo thả di chuyển sự kiện
        nowIndicator: true, // Kích hoạt đường chỉ giờ hiện tại màu đỏ giống Google Calendar
        eventDidMount: function(info) {
            let props = info.event.extendedProps;
            let evColor = props.eventColor;
            if (evColor) {
                info.el.style.setProperty('border-left', '4px solid ' + evColor, 'important');

                // Kỹ thuật che dòng kẻ: Sử dụng nền phụ đè lên (solid #0F0A30) làm lớp dưới cùng 
                // và phủ lớp màu của ca học có độ trong suốt 30% (#4D) ở trên.
                // Việc này giúp thẻ có màu bán trong suốt đẹp như cũ nhưng hoàn toàn che đi các dòng kẻ lưới bên dưới!
                let solidBg = '#0F0A30'; 
                info.el.style.setProperty('background', 'linear-gradient(0deg, ' + evColor + '4D, ' + evColor + '4D), ' + solidBg, 'important');
                info.el.style.setProperty('border-color', evColor + '99', 'important');

                // Màu chữ mặc định là trắng sáng trên nền tối
                let textC = '#FFFFFF';
                info.el.style.setProperty('color', textC, 'important');

                let titleEl = info.el.querySelector('.fc-event-title');
                if (titleEl) titleEl.style.setProperty('color', textC, 'important');
                let timeEl = info.el.querySelector('.fc-event-time');
                if (timeEl) timeEl.style.setProperty('color', textC, 'important');
            }
        },
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'timeGridWeek,timeGridDay' // Bỏ Danh Sách - chỉ giữ Lịch Tuần và Lịch Ngày
        },
        buttonText: {
            today: 'Hôm nay',
            week: 'Lịch tuần',
            day: 'Lịch ngày',
            list: 'Danh sách'
        },
        events: function(info, successCallback, failureCallback) {
            let events = generateEventsForCurrentWeek(info.start);
            successCallback(events);
        },

        eventClick: function(info) {
            showEventDetail(info.event, info);
        },

        select: function(info) {
            // Dùng local Date getters - tránh lỗi múi giờ UTC+7
            let start = info.start;
            let end = info.end;
            let dayKey = revDayMap[start.getDay()];

            let dd = start.getDate().toString().padStart(2, '0');
            let mm = (start.getMonth() + 1).toString().padStart(2, '0');
            let yyyy = start.getFullYear();
            let dateStr = yyyy + "-" + mm + "-" + dd;

            let startT = start.getHours().toString().padStart(2,'0') + ':' + start.getMinutes().toString().padStart(2,'0');
            let endT   = end.getHours().toString().padStart(2,'0')   + ':' + end.getMinutes().toString().padStart(2,'0');
            openCreateEventModal(dayKey, dateStr, startT, endT);
        },

        eventDrop: function(info) {
            let start = info.event.start;
            let end   = info.event.end;
            const props = info.event.extendedProps;

            let newDayKey = revDayMap[start.getDay()];
            let newStart  = start.getHours().toString().padStart(2,'0') + ':' + start.getMinutes().toString().padStart(2,'0');
            let newEnd    = end.getHours().toString().padStart(2,'0')   + ':' + end.getMinutes().toString().padStart(2,'0');

            if (!props.isOneTime) {
                // Sự kiện lặp lại hàng tuần → hỏi người dùng
                info.revert(); // Hoàn tác vị trí trước khi hiển thị dialog
                pendingChange = {
                    type: 'drop',
                    props: props,
                    newDayKey: newDayKey,
                    newStart: newStart,
                    newEnd: newEnd,
                    start: start
                };
                showRecurrenceDialog('Muốn di chuyển ca dạy của <b>' + escapeHtml(props.studentName) + '</b> sang ' + escapeHtml(newDayKey.toUpperCase()) + '?');
                return;
            }

            // Sự kiện 1 lần: cập nhật trực tiếp
            applyDrop(props, newDayKey, newStart, newEnd, start, true);
        },

        eventResize: function(info) {
            let end    = info.event.end;
            let newEnd = end.getHours().toString().padStart(2,'0') + ':' + end.getMinutes().toString().padStart(2,'0');
            const props = info.event.extendedProps;

            if (!props.isOneTime) {
                info.revert();
                pendingChange = {
                    type: 'resize',
                    props: props,
                    newEnd: newEnd
                };
                showRecurrenceDialog('Muốn đổi giờ kết thúc ca dạy của <b>' + escapeHtml(props.studentName) + '</b> thành ' + escapeHtml(newEnd) + '?');
                return;
            }

            applyResize(props, newEnd);
        }
    });

    calendar.render();
});

// --- ĐIỀU KHIỂN FORM HỘP THOẠI MODAL ---

// === XỬ LÝ SỰ KIỆN LẶP LẠI - RECURRENCE DIALOG ===
let pendingChange = null;
let recurrenceChoice = 'this'; // 'this' | 'all'

        function showRecurrenceDialog(descHtml, isDelete = false) {
    document.getElementById('recurrenceDialogDesc').innerHTML = descHtml;

    if (isDelete) {
        document.getElementById('recurrenceDialogTitle').innerHTML = '<i class="fa-solid fa-trash-can" style="color:#EF4444;margin-right:8px;"></i>Xóa ca dạy lặp lại';
        document.getElementById('recOptThisTitle').innerText = 'Chỉ ca học tuần này';
        document.getElementById('recOptThisDesc').innerText = 'Chỉ xoá ca học tuần này, các tuần khác giữ nguyên lịch.';
        document.getElementById('recOptAllTitle').innerText = 'Tất cả các tuần';
        document.getElementById('recOptAllDesc').innerText = 'Xoá hoàn toàn lịch cố định này ở tất cả các tuần.';
    } else {
        document.getElementById('recurrenceDialogTitle').innerHTML = '<i class="fa-solid fa-rotate" style="color:#8E4DFF;margin-right:8px;"></i>Chỉnh sửa sự kiện lặp lại';
        document.getElementById('recOptThisTitle').innerText = 'Chỉ sự kiện này';
        document.getElementById('recOptThisDesc').innerText = 'Chỉ thay đổi ca học tuần này, các tuần khác giữ nguyên lịch cũ.';
        document.getElementById('recOptAllTitle').innerText = 'Tất cả các tuần';
        document.getElementById('recOptAllDesc').innerText = 'Cập nhật lịch cố định — áp dụng cho mọi tuần từ đây trở đi.';
    }

    selectRecOption('this'); // Mặc định chọn "Chỉ tuần này"
    document.getElementById('recurrenceDialogOverlay').classList.add('active');
}

function selectRecOption(choice) {
    recurrenceChoice = choice;
    document.getElementById('recOptThis').classList.toggle('selected', choice === 'this');
    document.getElementById('recOptAll').classList.toggle('selected',  choice === 'all');
}

function cancelRecurrenceChange() {
    document.getElementById('recurrenceDialogOverlay').classList.remove('active');
    pendingChange = null;
}

function confirmRecurrenceChange() {
    document.getElementById('recurrenceDialogOverlay').classList.remove('active');
    if (!pendingChange) return;

    if (pendingChange.type === 'drop') {
        let { props, newDayKey, newStart, newEnd, start } = pendingChange;
        applyDrop(props, newDayKey, newStart, newEnd, start, recurrenceChoice === 'this');
    } else if (pendingChange.type === 'resize') {
        let { props, newEnd } = pendingChange;
        applyResize(props, newEnd, recurrenceChoice === 'this');
    } else if (pendingChange.type === 'delete') {
        let { props, start } = pendingChange;
        applyDelete(props, start, recurrenceChoice === 'this');
    }
    pendingChange = null;
}

// Áp dụng di chuyển (drop)
function applyDrop(props, newDayKey, newStart, newEnd, start, isThisOnly) {
    let row = tutorScheduleSheetData[props.studentIndex];
    let oldDayKey = props.dayKey;

    // === Xử LÝ SỰ KIỆN "ĐƠỜC DỜI" (RESCHEDULE) ===
    if (props.isReschedule) {
        let rescDate = props.oneTimeDateStr; // DD/MM/YYYY của ngày đã dời
        let origKey  = props.originalRecurringKey; // cột có lịch gốc + SKIP

        // 1. Xóa entry RESCHEDULE cũ
        row[oldDayKey] = '';

        // 2. Gỡ SKIP khỏi cột lịch gốc
        function removeSkip(dk, date) {
            if (!dk || !row[dk]) return;
            let raw = row[dk];
            if (!raw.includes(' SKIP ')) return;
            let [base, skipsPart] = raw.split(' SKIP ');
            let newSkips = skipsPart.split(',').map(s => s.trim()).filter(s => s !== date);
            row[dk] = newSkips.length > 0 ? base + ' SKIP ' + newSkips.join(',') : base;
        }
        removeSkip(origKey, rescDate);

        if (isThisOnly) {
            if (newDayKey === origKey) {
                // Dời về đúng ngày gốc → SKIP đã gỡ, lịch gốc tự hiển lại bình thường ✓
            } else {
                // Dời sang ngày khác tuần này:
                // Re-add SKIP vào cột gốc
                if (origKey && row[origKey]) {
                    let raw = row[origKey];
                    let base_r = raw.includes(' SKIP ') ? raw.split(' SKIP ')[0] : raw;
                    let existSkips_r = raw.includes(' SKIP ') ? raw.split(' SKIP ')[1] : '';
                    let skipList_r = existSkips_r ? existSkips_r.split(',').map(s => s.trim()) : [];
                    if (!skipList_r.includes(rescDate)) skipList_r.push(rescDate);
                    row[origKey] = base_r + ' SKIP ' + skipList_r.join(',');
                }
                // Tính ngày của newDayKey trong cùng tuần với rescDate
                let [resDd, resMm, resYyyy] = rescDate.split('/');
                let rescDateObj = new Date(resYyyy + '-' + resMm + '-' + resDd);
                let origDayNumJS = rescDateObj.getDay();
                let newDayNumJS  = dayMap[newDayKey];
                let newDateObj_rs = new Date(rescDateObj);
                newDateObj_rs.setDate(rescDateObj.getDate() + (newDayNumJS - origDayNumJS));
                let nDd = newDateObj_rs.getDate().toString().padStart(2,'0');
                let nMm = (newDateObj_rs.getMonth()+1).toString().padStart(2,'0');
                let nYyyy = newDateObj_rs.getFullYear();
                let newDateStr_rs = nDd + '/' + nMm + '/' + nYyyy;
                let timeVal_rs = colorPrefix + 'RESCHEDULE ' + newDateStr_rs + ': ' + newStart + ' - ' + newEnd;
                if (props.notes) timeVal_rs += ' (' + props.notes + ')';
                row[newDayKey] = timeVal_rs;
            }
        } else {
            // "Tất cả các tuần": cập nhật lịch cố định
            if (origKey && origKey !== newDayKey) row[origKey] = '';
            let timeVal_all = colorPrefix + newStart + ' - ' + newEnd;
            if (props.notes) timeVal_all += ' (' + props.notes + ')';
            row[newDayKey] = timeVal_all;
        }
        calendar.refetchEvents();
        saveCalendar();
        return;
    }

    // === Xử LÝ SỰ KIỆN THƯỜNG (́ lặp lại hoặc 1 lần thực sự) ===
    let newDd   = start.getDate().toString().padStart(2, '0');
    let newMm   = (start.getMonth() + 1).toString().padStart(2, '0');
    let newYyyy = start.getFullYear();
    let newDateStr = newDd + '/' + newMm + '/' + newYyyy;

    let oldDayNum = dayMap[oldDayKey];
    let newDayNum = start.getDay();
    let oldDate = new Date(start);
    oldDate.setDate(start.getDate() + (oldDayNum - newDayNum));
    let skipDd   = oldDate.getDate().toString().padStart(2, '0');
    let skipMm   = (oldDate.getMonth() + 1).toString().padStart(2, '0');
    let skipYyyy = oldDate.getFullYear();
    let skipDate = skipDd + '/' + skipMm + '/' + skipYyyy;

    let timeVal;
    if (props.isOneTime) {
        timeVal = colorPrefix + newDateStr + ': ' + newStart + ' - ' + newEnd;
        if (props.notes) timeVal += ' (' + props.notes + ')';
        row[oldDayKey] = '';
        row[newDayKey] = timeVal;

    } else if (isThisOnly) {
        // "Chỉ tuần này":
        //   1) Giữ lịch cũ nhưng thêm SKIP cho ngày CŨ trong tuần này
        let oldRaw    = row[oldDayKey] || '';
        let baseOld   = oldRaw.includes(' SKIP ') ? oldRaw.split(' SKIP ')[0] : oldRaw;
        let existSkips = oldRaw.includes(' SKIP ') ? oldRaw.split(' SKIP ')[1] : '';
        let skipList  = existSkips ? existSkips.split(',').map(s => s.trim()) : [];
        if (!skipList.includes(skipDate)) skipList.push(skipDate);
        row[oldDayKey] = baseOld + ' SKIP ' + skipList.join(',');

        //   2) Ghi entry dời = RESCHEDULE vào ngày MỚI (hiển bình thường, không tag [1 Lần])
        timeVal = colorPrefix + 'RESCHEDULE ' + newDateStr + ': ' + newStart + ' - ' + newEnd;
        if (props.notes) timeVal += ' (' + props.notes + ')';
        row[newDayKey] = timeVal;

    } else {
        // "Tất cả các tuần": cập nhật lịch cố định
        row[oldDayKey] = '';
        timeVal = newStart + ' - ' + newEnd;
        if (props.notes) timeVal += ' (' + props.notes + ')';
        row[newDayKey] = timeVal;
    }
    calendar.refetchEvents();
    saveCalendar();
}

// Áp dụng đổi giờ kết thúc (resize)
function applyResize(props, newEnd, isThisOnly) {
    let row    = tutorScheduleSheetData[props.studentIndex];
    let dayKey = props.dayKey;
    let timeVal;
    if (isThisOnly) {
        // Giữ lịch lặp lại — hiện tại chưa hỗ trợ override giờ trong cùng ngày
        // Báo cho người dùng biết
        alert('Lưu ý: Thay đổi giờ kết thúc cho "Chỉ tuần này" trong cùng một ngày chưa được hỗ trợ. Sẽ được cập nhật tất cả các tuần.');
        isThisOnly = false;
    }
    if (props.isOneTime) {
        timeVal = props.oneTimeDateStr + ': ' + props.startTime + ' - ' + newEnd;
    } else {
        timeVal = props.startTime + ' - ' + newEnd;
    }
    if (props.notes) timeVal += ' (' + props.notes + ')';
    row[dayKey] = timeVal;
    calendar.refetchEvents();
    saveCalendar();
}

// Áp dụng xoá ca dạy
function applyDelete(props, start, isThisOnly) {
    let row = tutorScheduleSheetData[props.studentIndex];
    let oldDayKey = props.dayKey;

    if (isThisOnly) {
        // Thêm SKIP cho ngày cụ thể tuần này
        let dd   = start.getDate().toString().padStart(2, '0');
        let mm   = (start.getMonth() + 1).toString().padStart(2, '0');
        let yyyy = start.getFullYear();
        let skipDate = dd + '/' + mm + '/' + yyyy;

        let oldRaw    = row[oldDayKey] || '';
        let baseOld   = oldRaw.includes(' SKIP ') ? oldRaw.split(' SKIP ')[0] : oldRaw;
        let existSkips = oldRaw.includes(' SKIP ') ? oldRaw.split(' SKIP ')[1] : '';
        let skipList  = existSkips ? existSkips.split(',').map(s => s.trim()) : [];
        if (!skipList.includes(skipDate)) skipList.push(skipDate);
        row[oldDayKey] = baseOld + ' SKIP ' + skipList.join(',');
    } else {
        // Xoá tất cả các tuần
        row[oldDayKey] = '';
    }
    calendar.refetchEvents();
    saveCalendar();
}

// === ĐIỀU KHIỂN FLOATING POPOVER CHI TIẾT SỰ KIỆN ===
let activeFcEvent = null;

function showEventDetail(fcEvent, jsEvent) {
    activeFcEvent = fcEvent;
    const props = fcEvent.extendedProps;

    // --- Điền nội dung ---
    document.getElementById("detailTitle").innerText = props.studentName;

    const colorDot = document.getElementById("detailColorDot");
    let dotColor = props.eventColor || (props.isOneTime ? "#FFD23F" : "#8E4DFF");
    colorDot.style.backgroundColor = dotColor;
    colorDot.style.boxShadow = "0 0 7px " + dotColor + "aa";

    let dateObj = new Date(props.date);
    let daysOfWeekVi = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
    let dayName  = daysOfWeekVi[dateObj.getDay()];
    let dayNum   = dateObj.getDate();
    let monthNum = dateObj.getMonth() + 1;
    document.getElementById("detailDateTime").innerText =
        dayName + ", " + dayNum + " tháng " + monthNum + " · " + props.startTime + " – " + props.endTime;

    let cellVal = tutorScheduleSheetData[props.studentIndex][props.dayKey] || "";
    let recurrenceText;
    if (props.isOneTime) {
        recurrenceText = cellVal.startsWith("RESCHEDULE") ? "Được dời sang tuần này" : "Diễn ra một lần";
    } else {
        recurrenceText = "Hàng tuần vào " + dayName.toLowerCase();
        if (cellVal.includes(" SKIP ")) recurrenceText += " (Có tuần được dời)";
    }
    document.getElementById("detailRecurrence").innerText = recurrenceText;

    const notesContainer = document.getElementById("detailNotesContainer");
    if (props.notes && props.notes.trim() !== "") {
        document.getElementById("detailNotes").innerText = props.notes;
        notesContainer.style.display = "flex";
    } else {
        notesContainer.style.display = "none";
    }

    // --- Định vị popover bên cạnh sự kiện được click ---
    const pop = document.getElementById("eventDetailPopover");
    const backdrop = document.getElementById("popoverBackdrop");
    pop.classList.remove("visible");          // reset animation
    if (backdrop) backdrop.classList.remove("visible");

    if (window.innerWidth < 768) {
        // Trên mobile, không định vị toạ độ pixel (CSS bottom sheet xử lý bằng fixed bottom)
        pop.classList.add("visible");
        if (backdrop) backdrop.classList.add("visible");
    } else {
        pop.style.left = "-9999px";
        pop.style.top  = "-9999px";
        pop.classList.add("visible");             // show để đo kích thước

        const popW = pop.offsetWidth  || 310;
        const popH = pop.offsetHeight || 200;
        const margin = 10;
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Lấy rect của phần tử sự kiện được click
        const elRect = jsEvent.el.getBoundingClientRect();

        // Ưu tiên hiện bên phải, nếu không đủ thì hiện bên trái
        let left, top;
        if (elRect.right + margin + popW <= vw) {
            left = elRect.right + margin;     // bên phải sự kiện
        } else {
            left = elRect.left - margin - popW; // bên trái sự kiện
        }

        // Canh theo đỉnh của sự kiện, giữ trong màn hình theo chiều dọc
        top = elRect.top;
        if (top + popH > vh - margin) top = vh - popH - margin;
        if (top < margin) top = margin;

        pop.style.left = left + "px";
        pop.style.top  = top  + "px";
    }
}

// Đóng khi click ra ngoài popover
document.addEventListener("click", function(e) {
    const pop = document.getElementById("eventDetailPopover");
    if (pop.classList.contains("visible") && !pop.contains(e.target)) {
        // Kiểm tra không phải đang click vào sự kiện calendar (để tránh đóng ngay lập tức)
        if (!e.target.closest(".fc-event")) {
            closeDetailModalForce();
        }
    }
});

function closeDetailModalForce() {
    document.getElementById("eventDetailPopover").classList.remove("visible");
    const backdrop = document.getElementById("popoverBackdrop");
    if (backdrop) backdrop.classList.remove("visible");
    activeFcEvent = null;
}

function editFromDetail() {
    if (!activeFcEvent) return;
    const eventToEdit = activeFcEvent;
    closeDetailModalForce();
    openEditEventModal(eventToEdit);
}

function deleteFromDetail() {
    if (!activeFcEvent) return;
    const props = activeFcEvent.extendedProps;
    let studentIdx = props.studentIndex;
    let oldDayKey  = props.dayKey;

    if (props.isOneTime) {
        if (confirm("Bạn có chắc chắn muốn xóa ca học một lần này của " + props.studentName + " không?")) {
            tutorScheduleSheetData[studentIdx][oldDayKey] = "";
            calendar.refetchEvents();
            saveCalendar();
            closeDetailModalForce();
        }
    } else {
        closeDetailModalForce();
        pendingChange = {
            type: 'delete',
            props: props,
            start: new Date(props.date)
        };
        showRecurrenceDialog('Bạn muốn xóa ca dạy lặp lại của <b>' + escapeHtml(props.studentName) + '</b> vào ' + escapeHtml(oldDayKey.toUpperCase()) + '?', true);
    }
}


// Toggle bảng Sheets Simulator từ dưới lên
function toggleSheetPanel() {
    let panel = document.getElementById('sheetPanel');
    panel.classList.toggle('open');
}

function openAddEventModal() {
    let t = new Date();
    let todayStr = t.getFullYear() + '-' + (t.getMonth()+1).toString().padStart(2,'0') + '-' + t.getDate().toString().padStart(2,'0');
    openCreateEventModal("mon", todayStr, "14:00", "16:00");
}

// Tạo mới ca dạy
function openCreateEventModal(dayKey, dateStr, startTime, endTime) {
    document.getElementById("modalTitleText").innerHTML = '<i class="fa-solid fa-circle-plus" style="color: #10B981;"></i> Thêm lịch học';

    document.getElementById("eventStudentIndex").value = "";
    document.getElementById("eventOldDay").value = "";

    document.getElementById("eventStudent").value = "";
    document.getElementById("eventStudent").disabled = false;

    document.getElementById("eventRepeatMode").value = "none"; 
    document.getElementById("eventDayOfWeek").value = dayKey;
    document.getElementById("eventSpecificDate").value = dateStr;

    allDayKeys.forEach(key => {
        document.getElementById("check" + key.charAt(0).toUpperCase() + key.slice(1)).checked = false;
    });

    document.getElementById("eventStartTime").value = startTime;
    document.getElementById("eventEndTime").value = endTime;
    document.getElementById("eventNotes").value = "";

    // Reset color picker
    setColorScope('student');
    selectPresetColor('');

    toggleRepeatUI();
    document.getElementById("btnDeleteEvent").style.display = "none";
    document.getElementById("eventModalOverlay").classList.add("active");
}

// Sửa ca dạy
function openEditEventModal(fcEvent) {
    const props = fcEvent.extendedProps;
    document.getElementById("modalTitleText").innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #FFD23F;"></i> Sửa lịch dạy';

    document.getElementById("eventStudentIndex").value = props.studentIndex;
    document.getElementById("eventOldDay").value = props.dayKey;

    document.getElementById("eventStudent").value = props.studentIndex;
    document.getElementById("eventStudent").disabled = true;

    if (props.isOneTime) {
        document.getElementById("eventRepeatMode").value = "none";
        let parts = props.oneTimeDateStr.split("/");
        document.getElementById("eventSpecificDate").value = parts[2] + "-" + parts[1] + "-" + parts[0];
    } else {
        document.getElementById("eventRepeatMode").value = "weekly";
        document.getElementById("eventDayOfWeek").value = props.dayKey;
    }

    allDayKeys.forEach(key => {
        document.getElementById("check" + key.charAt(0).toUpperCase() + key.slice(1)).checked = (key === props.dayKey);
    });

    document.getElementById("eventStartTime").value = props.startTime;
    document.getElementById("eventEndTime").value = props.endTime;
    document.getElementById("eventNotes").value = props.notes;

    // Set color picker theo cấu hình của event
    if (props.sessionColor) {
        setColorScope('session');
        selectPresetColor(props.sessionColor);
    } else {
        setColorScope('student');
        selectPresetColor(props.studentColor || '#8E4DFF');
    }

    toggleRepeatUI();
    document.getElementById("btnDeleteEvent").style.display = "block";
    document.getElementById("eventModalOverlay").classList.add("active");
}

function closeEventModal(e) {
    if (e.target.id === "eventModalOverlay") closeModalForce();
}

function closeModalForce() {
    document.getElementById("eventModalOverlay").classList.remove("active");
}

// Lưu dữ liệu vào thời khóa biểu (Đẩy về cấu trúc SQLite)
function saveEvent(e) {
    e.preventDefault();

    let studentIdx = document.getElementById("eventStudentIndex").value;
    let oldDayKey = document.getElementById("eventOldDay").value;

    let repeatMode = document.getElementById("eventRepeatMode").value;
    let startTime = document.getElementById("eventStartTime").value;
    let endTime = document.getElementById("eventEndTime").value;
    let notes = document.getElementById("eventNotes").value.trim();

    let timeVal = startTime + " - " + endTime;

    let targetStudentIdx = studentIdx === "" ? parseInt(document.getElementById("eventStudent").value) : parseInt(studentIdx);
    if (isNaN(targetStudentIdx)) return;

    let row = tutorScheduleSheetData[targetStudentIdx];

    // Đọc màu sắc và scope được chọn
    let selectedColor = document.getElementById("eventColor").value;
    let scope = document.getElementById("colorScope").value;

    if (scope === "student" && selectedColor) {
        row.color = selectedColor;
    }

    let colorPrefix = (scope === "session" && selectedColor) ? ("[C:" + selectedColor + "] ") : "";

    if (repeatMode === "none") {
        // KHÔNG LẶP: Thêm tiền tố ngày DD/MM/YYYY: 
        let specDate = document.getElementById("eventSpecificDate").value; 
        if (specDate) {
            let dParts = specDate.split("-");
            let datePrefix = dParts[2] + "/" + dParts[1] + "/" + dParts[0] + ": ";

            let finalVal = colorPrefix + datePrefix + timeVal;
            if (notes !== "") finalVal += " (" + notes + ")";

            let tempDate = new Date(specDate);
            let dayOfWeekNum = tempDate.getDay();
            let targetDayKey = revDayMap[dayOfWeekNum];

            if (studentIdx !== "" && oldDayKey !== targetDayKey) {
                row[oldDayKey] = ""; 
            }
            row[targetDayKey] = finalVal;
        }
    }
    else if (repeatMode === "weekly") {
        // Lặp hàng tuần
        let finalVal = colorPrefix + timeVal;
        if (notes !== "") finalVal += " (" + notes + ")";
        let dayKey = document.getElementById("eventDayOfWeek").value;
        if (studentIdx !== "" && oldDayKey !== dayKey) {
            row[oldDayKey] = ""; 
        }
        row[dayKey] = finalVal;
    } 
    else if (repeatMode === "daily") {
        // Lặp hàng ngày
        let finalVal = colorPrefix + timeVal;
        if (notes !== "") finalVal += " (" + notes + ")";
        allDayKeys.forEach(key => {
            row[key] = finalVal;
        });
    } 
    else if (repeatMode === "custom") {
        // Tùy chỉnh
        let finalVal = colorPrefix + timeVal;
        if (notes !== "") finalVal += " (" + notes + ")";
        allDayKeys.forEach(key => {
            let isChecked = document.getElementById("check" + key.charAt(0).toUpperCase() + key.slice(1)).checked;
            if (isChecked) {
                row[key] = finalVal;
            } else {
                if (row[key].includes(startTime) || key === oldDayKey) {
                    row[key] = "";
                }
            }
        });
    }

    calendar.refetchEvents();
    saveCalendar();
    closeModalForce();
}

// Xóa ca học cố định
function deleteEvent() {
    let studentIdx = parseInt(document.getElementById("eventStudentIndex").value);
    let oldDayKey = document.getElementById("eventOldDay").value;

    if (!isNaN(studentIdx) && oldDayKey !== "") {
        if (confirm("Bạn có chắc chắn muốn xóa ca học này của " + tutorScheduleSheetData[studentIdx].studentName + " không?")) {
            tutorScheduleSheetData[studentIdx][oldDayKey] = "";
            calendar.refetchEvents();
            saveCalendar();
            closeModalForce();
        }
    }
}

// --- CHƯƠNG TRÌNH CUSTOM MÀU SẮC CHO HỌC SINH/BUỔI HỌC ---
const PRESET_COLORS = [
    '#8E4DFF', '#4D9EFF', '#00D2FC', '#4DFFC3', '#4CAF50', '#AEEA00', 
    '#FFD23F', '#FF9100', '#FF6B9D', '#FF4D4D', '#90A4AE', '#D1C4E9'
];

function initColorPickerSwatches() {
    let container = document.getElementById("colorSwatches");
    if (!container) return;
    container.innerHTML = "";
    PRESET_COLORS.forEach(color => {
        let swatch = document.createElement("div");
        swatch.className = "color-swatch";
        swatch.style.backgroundColor = color;
        swatch.dataset.color = color;
        swatch.onclick = function() {
            selectPresetColor(color);
        };
        container.appendChild(swatch);
    });
}

function selectPresetColor(color) {
    document.getElementById("eventColor").value = color;
    document.querySelectorAll(".color-swatch").forEach(s => {
        s.classList.toggle("selected", s.dataset.color === color);
    });

    let dot = document.getElementById("colorPreviewDot");
    let text = document.getElementById("colorPreviewText");
    if (color) {
        dot.style.backgroundColor = color;
        dot.style.display = "inline-block";

        let scope = document.getElementById("colorScope").value;
        let studentSelect = document.getElementById("eventStudent");
        let studentName = studentSelect.options[studentSelect.selectedIndex]?.text || "Học sinh";
        if (scope === "student") {
            text.innerText = "Áp dụng làm màu mặc định cho học sinh: " + studentName;
        } else {
            text.innerText = "Chỉ áp dụng màu cho riêng buổi học này";
        }
    } else {
        dot.style.display = "none";
        text.innerText = "Chọn màu bên trên";
    }
}

function setColorScope(scope) {
    document.getElementById("colorScope").value = scope;
    document.getElementById("colorScopeStudentBtn").classList.toggle("active", scope === "student");
    document.getElementById("colorScopeSessionBtn").classList.toggle("active", scope === "session");

    let color = document.getElementById("eventColor").value;
    if (color) {
        selectPresetColor(color);
    }
}
