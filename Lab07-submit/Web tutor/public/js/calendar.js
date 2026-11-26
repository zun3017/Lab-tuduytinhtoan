        let calendar = null;
        window.calendar = null;

        // Helper định dạng tiền (200.000). tutor.js có hàm này nhưng trang lịch KHÔNG nạp tutor.js,
        // thiếu hàm khiến bấm vào ngày để thêm ca dạy bị lỗi "formatNumberWithDots is not defined".
        if (typeof window.formatNumberWithDots !== 'function') {
            window.formatNumberWithDots = function(val) {
                if (val === undefined || val === null || val === '') return '';
                var rawVal = String(val).replace(/\D/g, '');
                if (!rawVal) return '';
                if (rawVal.length > 1) rawVal = rawVal.replace(/^0+/, '') || '0';
                return rawVal.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
            };
        }
        var formatNumberWithDots = window.formatNumberWithDots;
        if (typeof window.formatCurrencyInput !== 'function') {
            window.formatCurrencyInput = function(input) {
                if (!input) return;
                input.value = window.formatNumberWithDots(input.value);
            };
        }


        const PRESET_COLORS = [
            '#8E4DFF', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1',
            '#D4E7B5', '#DFD6F2', '#F9D5CA', '#BDD7EE', '#FDE8B3', '#6D675E',
            '#4D9EFF', '#00D2FC', '#4DFFC3', '#4CAF50', '#AEEA00', '#FFD23F'
        ];
        function showSyncToast(state) {
            let toast = document.getElementById('syncToast');
            if (!toast) return;
            toast.className = 'sync-toast ' + state;
            if (state === 'pending') {
                toast.innerHTML = '<i class="fa-solid fa-rotate fa-spin"></i> Đang đồng bộ...';
                toast.style.display = 'flex';
            } else if (state === 'success') {
                toast.innerHTML = '<i class="fa-solid fa-circle-check"></i> Đã lưu';
                toast.style.display = 'flex';
                setTimeout(function() { toast.style.display = 'none'; }, 2000);
            } else if (state === 'error') {
                toast.innerHTML = '<i class="fa-solid fa-circle-xmark"></i> Lỗi đồng bộ!';
                toast.style.display = 'flex';
                setTimeout(function() { toast.style.display = 'none'; }, 4000);
            }
        }

        function showWebConfirm(message, onConfirm) {
            document.getElementById('confirmMessageText').innerHTML = message;
            let modal = document.getElementById('customConfirmModal');
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            document.getElementById('btnConfirmCancelWeb').onclick = function() {
                modal.style.display = 'none';
                modal.classList.remove('active');
            };
            
            document.getElementById('btnConfirmOkWeb').onclick = function() {
                modal.style.display = 'none';
                modal.classList.remove('active');
                if (onConfirm) onConfirm();
            };
        }

        function showWebAlert(message, type = 'info') {
            document.getElementById('alertMessageText').innerHTML = message;
            let iconEl = document.getElementById('alertIcon');
            if (type === 'error') {
                iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark" style="color: #EF4444;"></i>';
            } else if (type === 'success') {
                iconEl.innerHTML = '<i class="fa-solid fa-circle-check" style="color: #10B981;"></i>';
            } else {
                iconEl.innerHTML = '<i class="fa-solid fa-circle-info" style="color: #8E4DFF;"></i>';
            }
            
            let modal = document.getElementById('customAlertModal');
            modal.style.display = 'flex';
            modal.classList.add('active');
            
            document.getElementById('btnAlertOkWeb').onclick = function() {
                modal.style.display = 'none';
                modal.classList.remove('active');
            };
        }

        const dayMap = {
            "mon": 1, "tue": 2, "wed": 3, "thu": 4, "fri": 5, "sat": 6, "sun": 0
        };
        const revDayMap = {
            1: "mon", 2: "tue", 3: "wed", 4: "thu", 5: "fri", 6: "sat", 0: "sun"
        };
        const allDayKeys = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

        function getStartOfWeek(d) {
            let date = new Date(d);
            date.setHours(0, 0, 0, 0);
            let day = date.getDay();
            let diff = date.getDate() - day + (day === 0 ? -6 : 1);
            return new Date(date.setDate(diff));
        }

        // === HELPER NGÀY & CA HỌC (an toàn múi giờ, hỗ trợ ô nhiều ca) ===
        // "YYYY-MM-DD" -> Date theo giờ địa phương (tránh lệch ngày do new Date("YYYY-MM-DD") hiểu là UTC)
        function parseYMDLocal(str) {
            if (str instanceof Date) return new Date(str.getFullYear(), str.getMonth(), str.getDate());
            let m = String(str || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
            if (!m) return new Date(NaN);
            return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
        }
        // Date -> "DD/MM/YYYY"
        function fmtDMY(d) {
            return d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getFullYear();
        }
        // Tách 1 ca: { color: '[C:#xxx] ' | '', body, skips: [] }
        function splitSlotParts(slot) {
            let s = String(slot || '').trim();
            let color = '';
            let cm = s.match(/^\[C:#[0-9A-Fa-f]{6}\]\s*/);
            if (cm) { color = cm[0].trim() + ' '; s = s.slice(cm[0].length); }
            let skips = [];
            if (s.includes(' SKIP ')) {
                let p = s.split(' SKIP ');
                s = p[0];
                skips = p[1].split(',').map(x => x.trim()).filter(Boolean);
            }
            return { color: color, body: s.trim(), skips: skips };
        }
        function joinSlotParts(parts) {
            return parts.color + parts.body + (parts.skips.length ? ' SKIP ' + parts.skips.join(',') : '');
        }
        function cellToSlots(cell) {
            return String(cell || '').split('|').map(s => s.trim()).filter(s => s !== '');
        }
        // Tìm ca lặp lại trong ô có SKIP chứa ngày dateDMY -> trả về index hoặc -1
        function findSlotWithSkip(cell, dateDMY) {
            let slots = cellToSlots(cell);
            for (let i = 0; i < slots.length; i++) {
                if (/^(\[C:#[0-9A-Fa-f]{6}\]\s*)?(\d{2}\/|RESCHEDULE)/.test(slots[i])) continue;
                if (splitSlotParts(slots[i]).skips.includes(dateDMY)) return i;
            }
            return -1;
        }

        // Tạo sự kiện đưa vào FullCalendar
        function generateEventsForCurrentWeek(viewStart) {
            let startOfWeek = getStartOfWeek(viewStart);
            let events = [];

            tutorScheduleSheetData.forEach((row, studentIdx) => {
                allDayKeys.forEach(dayKey => {
                    let cellVal = row[dayKey];
                    if (!cellVal || cellVal.trim() === '') return;

                    // Hỗ trợ nhiều ca học trong ngày (phân tách bởi ký tự '|')
                    let subSlots = cellVal.split('|').map(s => s.trim()).filter(s => s !== '');
                    subSlots.forEach((slotVal, subIdx) => {
                        // === Xử lý các kiểu entry ===
                        // 0. Màu sắc riêng của buổi học này: [C:#RRGGBB]
                        let sessionColor = '';
                        let colorTagRegex = /^\[C:(#[0-9A-Fa-f]{6})\]/;
                        let colorTagMatch = slotVal.match(colorTagRegex);
                        if (colorTagMatch) {
                            sessionColor = colorTagMatch[1];
                            slotVal = slotVal.replace(colorTagRegex, '').trim();
                        }

                        // 1. SKIP marker: "HH:MM - HH:MM SKIP DD/MM/YYYY,..."  → lịch cố định nhưng bỏ qua ngày cụ thể
                        let skipDates = [];
                        let rawVal = slotVal;
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

                        let isCancelled = /\[CANCELLED\]|\[HỦY\]|\[HUY\]/i.test(rawVal) || (notes && /đã hủy|báo nghỉ|nghỉ học/i.test(notes));
                        let status = isCancelled ? 'cancelled' : 'active';

                        // Xác định ngày cụ thể
                        let dateStr = '';

                        if (isOneTime || isReschedule) {
                            let dateParts = oneTimeDateStr.split('/');
                            dateStr = dateParts[2] + '-' + dateParts[1] + '-' + dateParts[0];
                            let evDate  = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]), 0, 0, 0);
                            let weekEnd = new Date(startOfWeek);
                            weekEnd.setDate(startOfWeek.getDate() + 7);
                            if (evDate < startOfWeek || evDate >= weekEnd) return;
                            if (skipDates.includes(oneTimeDateStr)) return;
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
                                if (findSlotWithSkip(row[dk], oneTimeDateStr) !== -1) {
                                    originalRecurringKey = dk;
                                    break;
                                }
                            }
                        }  // end if (isReschedule)

                        let eventType = isReschedule ? 'rs' : (isOneTime ? 'ot' : 'rp');

                        let studentDefaultColor = row.color || '#8E4DFF';
                        let eventColor = sessionColor || studentDefaultColor;
                        // Tính màu nền và viền
                        let bgColor   = eventColor + '4D';  // 4D = ~30% opacity hex
                        let bdColor   = eventColor + '99';  // 99 = ~60% opacity
                        
                        events.push({
                            id: studentIdx + '_' + dayKey + '_' + eventType + '_' + subIdx,
                            title: fixVietnameseMojibake(row.studentName)
                                + (notes ? (' (' + notes + ')') : '')
                                + (isOneTime ? ' [1 Lần]' : ''),
                            start: dateStr + 'T' + startHour.padStart(2, '0') + ':' + startMin,
                            end:   dateStr + 'T' + endHour.padStart(2, '0')   + ':' + endMin,
                            backgroundColor: bgColor,
                            borderColor: bdColor,
                            textColor: '#FFFFFF',
                            classNames: [isOneTime ? 'event-status-onetime' : 'event-status-recurring'],
                            extendedProps: {
                                status: status,
                                studentIndex: studentIdx,
                                subIndex: subIdx,
                                studentName: row.studentName,
                                subject: row.subject || row.studentName,
                                fee: row.fee ?? 500000,
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
            });

            return events;
        }

        // Lấy danh sách sự kiện theo khoảng thời gian hiển thị (hỗ trợ Month view và Week/Day view)
        function getEventsForCalendarRange(info, viewType) {
            let events = [];
            if (viewType !== 'dayGridMonth') {
                events = generateEventsForCurrentWeek(info.start);
            } else {
                let cur = getStartOfWeek(new Date(info.start));
                let endLimit = new Date(info.end);
                let seen = new Set();
                while (cur < endLimit) {
                    let weekEvents = generateEventsForCurrentWeek(cur);
                    weekEvents.forEach(ev => {
                        let uniqueKey = ev.id + '_' + ev.start;
                        if (!seen.has(uniqueKey)) {
                            seen.add(uniqueKey);
                            let evClone = Object.assign({}, ev);
                            evClone.id = uniqueKey;
                            events.push(evClone);
                        }
                    });
                    cur.setDate(cur.getDate() + 7);
                }
            }

            if (window.hideCancelledSessions) {
                events = events.filter(ev => !(ev.extendedProps && ev.extendedProps.status === 'cancelled'));
            }
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
            // Thêm tùy chọn Khác...
            let optOther = document.createElement("option");
            optOther.value = "other";
            optOther.innerText = "Khác...";
            select.appendChild(optOther);
        }


        // Đổ dữ liệu thật ra bảng mô phỏng ở cuối trang
        function renderSheetTable() {
            let tbody = document.getElementById("sheetDataTableBody");
            if (!tbody) return;
            tbody.innerHTML = "";
            if (!tutorScheduleSheetData || tutorScheduleSheetData.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted, #8E95BE); padding: 25px; font-weight: 500;">Chưa có học sinh nào trong thời khóa biểu</td></tr>';
                return;
            }
            tutorScheduleSheetData.forEach(row => {
                let tr = document.createElement("tr");
                
                // Tên học sinh
                let html = `<td class="cell-student">${escapeHtml(row.studentName)}</td>`;
                
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

        // ==========================================
        // CUSTOM CALENDAR HEADER CONTROLS (TASK 10.2)
        // ==========================================
        window.hideCancelledSessions = false;

        function toggleHideCancelledSessions() {
            window.hideCancelledSessions = !window.hideCancelledSessions;
            let btn = document.getElementById('btnToggleHideCancelled');
            if (btn) {
                if (window.hideCancelledSessions) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
            if (calendar) {
                calendar.refetchEvents();
                if (calendar.view && calendar.view.type === 'dayGridMonth') {
                    setTimeout(function() {
                        updateMonthBottomBar(calendar.view);
                    }, 50);
                }
            }
        }

        function getISOWeekNum(d) {
            let t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            let dayNum = t.getUTCDay() || 7;
            t.setUTCDate(t.getUTCDate() + 4 - dayNum);
            let yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
            return Math.ceil((((t - yearStart) / 86400000) + 1) / 7);
        }

        // Đếm số buổi (không tính đã hủy) + số học sinh trong khoảng đang xem
        function countSessionsInView(view) {
            try {
                let evs = getEventsForCalendarRange({ start: view.currentStart, end: view.currentEnd }, view.type);
                let s = view.currentStart, e = view.currentEnd;
                let names = new Set(), n = 0;
                evs.forEach(ev => {
                    let p = ev.extendedProps || {};
                    if (p.status === 'cancelled') return;
                    let d = parseYMDLocal(p.date || String(ev.start).slice(0, 10));
                    if (d < s || d >= e) return;
                    n++;
                    names.add(p.studentName);
                });
                return { sessions: n, students: names.size };
            } catch (err) { return { sessions: 0, students: 0 }; }
        }

        let _lastHeaderKey = '';
        function updateCalendarHeaderTitle(view) {
            let titleEl = document.getElementById('calendarHeaderTitle');
            if (!titleEl || !view) return;
            let subEl = document.getElementById('calendarHeaderSub');
            let pad = n => String(n).padStart(2, '0');
            let s = view.currentStart;
            let eIncl = new Date(view.currentEnd); eIncl.setDate(eIncl.getDate() - 1);
            let daysVi = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
            let main, year, icon;
            if (view.type === 'dayGridMonth') {
                main = 'Tháng ' + (s.getMonth() + 1);
                year = s.getFullYear();
                icon = 'fa-calendar';
            } else if (/Day$/.test(view.type)) {
                main = daysVi[s.getDay()] + ', ' + pad(s.getDate()) + '/' + pad(s.getMonth() + 1);
                year = s.getFullYear();
                icon = 'fa-calendar-day';
            } else {
                main = pad(s.getDate()) + '/' + pad(s.getMonth() + 1) + ' – ' + pad(eIncl.getDate()) + '/' + pad(eIncl.getMonth() + 1);
                year = eIncl.getFullYear();
                icon = 'fa-calendar-week';
            }
            let key = view.type + '|' + s.getTime();
            titleEl.innerHTML = '<i class="fa-solid ' + icon + ' cal-title-icon"></i>' +
                '<span class="cal-title-main">' + main + '</span>' +
                '<span class="cal-title-year">' + year + '</span>';
            if (key !== _lastHeaderKey) {
                let block = titleEl.parentElement;
                if (block) {
                    block.classList.remove('cal-title-anim');
                    void block.offsetWidth;
                    block.classList.add('cal-title-anim');
                }
                _lastHeaderKey = key;
            }

            // Tooltip nút trước/sau theo đúng chế độ xem
            let unit = view.type === 'dayGridMonth' ? 'Tháng' : (/Day$/.test(view.type) ? 'Ngày' : 'Tuần');
            let bPrev = document.getElementById('btnCalPrev');
            let bNext = document.getElementById('btnCalNext');
            if (bPrev) bPrev.title = unit + ' trước';
            if (bNext) bNext.title = unit + ' sau';
        }

        // Thanh trượt nổi dưới nút Tháng/Tuần/Ngày đang chọn
        function moveViewPillIndicator() {
            let wrap = document.querySelector('.cal-view-pills');
            let ind = document.getElementById('calViewIndicator');
            let active = wrap ? wrap.querySelector('.cal-view-pill.active') : null;
            if (!wrap || !ind) return;
            if (!active) { ind.style.opacity = '0'; return; }
            ind.style.opacity = '1';
            ind.style.width = active.offsetWidth + 'px';
            ind.style.transform = 'translateX(' + active.offsetLeft + 'px)';
        }
        window.addEventListener('resize', moveViewPillIndicator);
        window.addEventListener('load', moveViewPillIndicator);
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveViewPillIndicator);

        function updateActiveViewPills(viewType) {
            let pillMap = {
                'dayGridMonth': 'viewPillMonth',
                'timeGridWeek': 'viewPillWeek',
                'listWeek': 'viewPillWeek',
                'timeGridDay': 'viewPillDay',
                'listDay': 'viewPillDay'
            };
            let activeId = pillMap[viewType] || '';
            ['viewPillMonth', 'viewPillWeek', 'viewPillDay'].forEach(id => {
                let el = document.getElementById(id);
                if (el) {
                    if (id === activeId) {
                        el.classList.add('active');
                    } else {
                        el.classList.remove('active');
                    }
                }
            });
            requestAnimationFrame(moveViewPillIndicator);
        }

        // ==========================================
        // MOBILE: chế độ xem riêng cho điện thoại (≤ 768px)
        // ==========================================
        const ZT_CAL_MOBILE_VIEW_KEY = 'zt_cal_view_mobile';
        const ZT_CAL_MOBILE_VIEWS = ['listWeek', 'listDay', 'dayGridMonth'];
        function ztIsMobileCal() {
            return window.innerWidth <= 768;
        }
        function ztGetMobileInitialView() {
            let saved = null;
            try { saved = localStorage.getItem(ZT_CAL_MOBILE_VIEW_KEY); } catch(e) {}
            return ZT_CAL_MOBILE_VIEWS.indexOf(saved) !== -1 ? saved : 'listWeek';
        }
        // Áp dụng các tùy chọn phụ thuộc kích thước màn hình (kéo-thả, số ca mỗi ô tháng)
        function ztApplyResponsiveCalOptions() {
            if (!calendar) return;
            let mobile = ztIsMobileCal();
            if (calendar.getOption('editable') !== !mobile) calendar.setOption('editable', !mobile);
            let wantMax = mobile ? false : 3;
            if (calendar.getOption('dayMaxEvents') !== wantMax) calendar.setOption('dayMaxEvents', wantMax);
            document.documentElement.classList.toggle('cal-mobile', mobile);
        }

        function switchCalendarView(viewName) {
            if (!calendar) return;
            if (ztIsMobileCal()) {
                if (viewName === 'timeGridWeek') viewName = 'listWeek';
                else if (viewName === 'timeGridDay') viewName = 'listDay';
            }
            calendar.changeView(viewName);
            updateActiveViewPills(viewName);
        }

        // ==========================================
        // DANH SÁCH NGÀY LỄ QUỐC GIA VIỆT NAM (TASK 10.3)
        // ==========================================
        const VN_HOLIDAYS = {
            '1/1':   { name: 'Tết Dương lịch', full: 'Tết Dương lịch', img: 'tet-duong', tint: '#9333EA' },
            '8/3':   { name: 'Ngày Phụ nữ', full: 'Quốc tế Phụ nữ 8/3', img: 'phu-nu', tint: '#DB2777' },
            '30/4':  { name: 'Thống nhất', full: 'Giải phóng miền Nam, thống nhất đất nước', img: 'giai-phong', tint: '#DC2626' },
            '1/5':   { name: 'Lao động', full: 'Quốc tế Lao động', img: 'lao-dong', tint: '#DC2626' },
            '1/6':   { name: 'Thiếu nhi', full: 'Quốc tế Thiếu nhi', img: 'thieu-nhi', tint: '#2563EB' },
            '1/9':   { name: 'Quốc khánh', full: 'Nghỉ lễ Quốc khánh', img: 'quoc-khanh', tint: '#DC2626' },
            '2/9':   { name: 'Quốc khánh', full: 'Quốc khánh nước CHXHCN Việt Nam', img: 'quoc-khanh-2', tint: '#DC2626' },
            '20/10': { name: 'Phụ nữ VN', full: 'Ngày Phụ nữ Việt Nam', img: 'phu-nu-2', tint: '#DB2777' },
            '20/11': { name: 'Nhà giáo VN', full: 'Ngày Nhà giáo Việt Nam', img: 'nha-giao', tint: '#BE185D' },
            '24/12': { name: 'Đêm Noel', full: 'Đêm Giáng sinh', img: 'giang-sinh', tint: '#15803D' },
            '25/12': { name: 'Giáng sinh', full: 'Lễ Giáng sinh', img: 'giang-sinh-2', tint: '#15803D' }
        };
        // Ngày lễ âm lịch (key = ngày/tháng âm)
        const VN_LUNAR_HOLIDAYS = {
            '1/1':  { name: 'Mùng 1 Tết', full: 'Tết Nguyên Đán - Mùng 1', img: 'tet-nguyen-dan', tint: '#DC2626' },
            '2/1':  { name: 'Mùng 2 Tết', full: 'Tết Nguyên Đán - Mùng 2', img: 'tet-2', tint: '#DC2626' },
            '3/1':  { name: 'Mùng 3 Tết', full: 'Tết Nguyên Đán - Mùng 3', img: 'tet-3', tint: '#DC2626' },
            '10/3': { name: 'Giỗ Tổ', full: 'Giỗ Tổ Hùng Vương (10/3 âm lịch)', img: 'gio-to', tint: '#B45309' },
            '15/8': { name: 'Trung thu', full: 'Tết Trung thu (15/8 âm lịch)', img: 'trung-thu', tint: '#EA580C' }
        };

        // Chuyển đổi Dương lịch -> Âm lịch Việt Nam (thuật toán Hồ Ngọc Đức, múi giờ +7)
        const VNLunar = (function() {
            const TZ = 7, PI = Math.PI;
            function jdFromDate(dd, mm, yy) {
                let a = Math.floor((14 - mm) / 12), y = yy + 4800 - a, m = mm + 12 * a - 3;
                let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
                if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
                return jd;
            }
            function newMoon(k) {
                let T = k / 1236.85, T2 = T * T, T3 = T2 * T, dr = PI / 180;
                let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
                Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
                let M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
                let Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
                let F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
                let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
                C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr) - 0.0004 * Math.sin(dr * 3 * Mpr);
                C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
                C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
                C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
                C1 = C1 + 0.0010 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
                let deltat = T < -11
                    ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
                    : -0.000278 + 0.000265 * T + 0.000262 * T2;
                return Math.floor(Jd1 + C1 - deltat + 0.5 + TZ / 24);
            }
            function sunLong(jdn) {
                let T = (jdn - 2451545.5 - TZ / 24) / 36525, T2 = T * T, dr = PI / 180;
                let M = 357.52910 + 35999.05030 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
                let L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
                let DL = (1.914600 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
                DL += (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.000290 * Math.sin(dr * 3 * M);
                let L = (L0 + DL) * dr;
                L = L - PI * 2 * Math.floor(L / (PI * 2));
                return Math.floor(L / PI * 6);
            }
            function month11(yy) {
                let k = Math.floor((jdFromDate(31, 12, yy) - 2415021) / 29.530588853);
                let nm = newMoon(k);
                if (sunLong(nm) >= 9) nm = newMoon(k - 1);
                return nm;
            }
            function leapOffset(a11) {
                let k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5), last = 0, i = 1;
                let arc = sunLong(newMoon(k + i));
                do { last = arc; i++; arc = sunLong(newMoon(k + i)); } while (arc !== last && i < 14);
                return i - 1;
            }
            const cache = {};
            function toLunar(dd, mm, yy) {
                let ck = dd + '-' + mm + '-' + yy;
                if (cache[ck]) return cache[ck];
                let dayNumber = jdFromDate(dd, mm, yy);
                let k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
                let monthStart = newMoon(k + 1);
                if (monthStart > dayNumber) monthStart = newMoon(k);
                let a11 = month11(yy), b11 = a11, lunarYear;
                if (a11 >= monthStart) { lunarYear = yy; a11 = month11(yy - 1); }
                else { lunarYear = yy + 1; b11 = month11(yy + 1); }
                let lunarDay = dayNumber - monthStart + 1;
                let diff = Math.floor((monthStart - a11) / 29);
                let leap = 0, lunarMonth = diff + 11;
                if (b11 - a11 > 365) {
                    let lmd = leapOffset(a11);
                    if (diff >= lmd) { lunarMonth = diff + 10; if (diff === lmd) leap = 1; }
                }
                if (lunarMonth > 12) lunarMonth -= 12;
                if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
                return (cache[ck] = { day: lunarDay, month: lunarMonth, year: lunarYear, leap: leap });
            }
            return { toLunar: toLunar };
        })();

        function getVNHoliday(date) {
            let d = date.getDate(), m = date.getMonth() + 1;
            let solar = VN_HOLIDAYS[d + '/' + m];
            if (solar) return solar;
            let lu = VNLunar.toLunar(d, m, date.getFullYear());
            if (!lu.leap) return VN_LUNAR_HOLIDAYS[lu.day + '/' + lu.month] || null;
            return null;
        }

        // ==========================================
        // THANH ĐÁY LỊCH: LEGEND HỌC SINH & STATUS BAR (TASK 10.4)
        // ==========================================
        function renderStudentLegend(view) {
            let legendContainer = document.getElementById('calStudentLegendList');
            if (!legendContainer) return;
            legendContainer.innerHTML = '';
            
            let displayRows = tutorScheduleSheetData;

            // Nếu đang xem dạng tháng, lọc theo học sinh có buổi học trong tháng đó để đồng bộ chuẩn xác với thanh thống kê
            if (view && view.type === 'dayGridMonth' && typeof getEventsForCalendarRange === 'function') {
                let rangeInfo = { start: view.activeStart, end: view.activeEnd };
                let events = getEventsForCalendarRange(rangeInfo, 'dayGridMonth');
                let targetMonth = view.currentStart.getMonth();
                let targetYear = view.currentStart.getFullYear();

                let activeStudentNames = new Set();
                events.forEach(ev => {
                    let d = new Date(ev.start);
                    if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
                        if (ev.extendedProps && ev.extendedProps.studentName) {
                            activeStudentNames.add(ev.extendedProps.studentName);
                        }
                    }
                });

                if (activeStudentNames.size > 0) {
                    displayRows = tutorScheduleSheetData.filter(row => activeStudentNames.has(row.studentName));
                }
            }

            displayRows.forEach(row => {
                let studentColor = row.color || '#C05E8E';
                let item = document.createElement('div');
                item.className = 'cal-legend-item';
                item.innerHTML = `<span class="cal-legend-dot" style="background: ${escapeHtml(studentColor)};"></span>
                                  <span class="cal-legend-name">${escapeHtml(fixVietnameseMojibake(row.studentName))}</span>`;
                legendContainer.appendChild(item);
            });
        }

        function updateMonthStatusBar(view) {
            let statusEl = document.getElementById('calStatusText');
            if (!statusEl || !view) return;
            let rangeInfo = { start: view.activeStart, end: view.activeEnd };
            let events = getEventsForCalendarRange(rangeInfo, 'dayGridMonth');
            let targetMonth = view.currentStart.getMonth();
            let targetYear = view.currentStart.getFullYear();
            
            // Đếm các ca học thuộc tháng đang xem
            let monthEvents = events.filter(ev => {
                let d = new Date(ev.start);
                return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
            });

            let sessionCount = monthEvents.length;
            let studentSet = new Set();
            monthEvents.forEach(ev => {
                if (ev.extendedProps && ev.extendedProps.studentName) {
                    studentSet.add(ev.extendedProps.studentName);
                }
            });
            let studentCount = studentSet.size;

            statusEl.innerText = sessionCount + ' buổi trong tháng · ' + studentCount + ' học sinh';
        }

        function updateMonthBottomBar(view) {
            let bar = document.getElementById('calendarBottomBar');
            if (!bar || !view) return;
            if (view.type === 'dayGridMonth') {
                bar.style.display = 'flex';
                renderStudentLegend(view);
                updateMonthStatusBar(view);
            } else {
                bar.style.display = 'none';
            }
            if (calendar) {
                calendar.updateSize();
            }
        }

        // Khởi tạo lịch
        document.addEventListener('DOMContentLoaded', async function() {
            if (!await loadCalendarData()) return;
            initColorPickerSwatches();

            // Đăng ký sự kiện đổi học sinh -> tự chọn màu mặc định của học sinh đó
            document.getElementById("eventStudent").addEventListener("change", function() {
                let val = this.value;
                let customGroup = document.getElementById("customStudentNameGroup");
                if (val === "other") {
                    customGroup.style.display = "block";
                    document.getElementById("eventCustomStudentName").required = true;
                    selectPresetColor('');
                    document.getElementById("eventFee").value = formatNumberWithDots("500000");
                } else if (val !== "") {
                    customGroup.style.display = "none";
                    document.getElementById("eventCustomStudentName").required = false;
                    let stRow = tutorScheduleSheetData[val];
                    let studentColor = (stRow && stRow.color) || '#8E4DFF';
                    setColorScope('student');
                    selectPresetColor(studentColor);
                    if (stRow && stRow.fee) {
                        document.getElementById("eventFee").value = formatNumberWithDots(stRow.fee);
                    }
                } else {
                    customGroup.style.display = "none";
                    document.getElementById("eventCustomStudentName").required = false;
                    selectPresetColor('');
                }
            });

            
            // === BỘ HÀM TẠO MÀU PASTEL & TƯƠNG PHẢN CHO THẺ BUỔI HỌC (THIẾT KẾ IMAGE 2) ===
            function hexToRgb(hex) {
                if (!hex) return { r: 142, g: 77, b: 255 };
                hex = hex.replace('#', '').trim();
                if (hex.length === 3) {
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }
                if (hex.length !== 6) return { r: 142, g: 77, b: 255 };
                let num = parseInt(hex, 16);
                if (isNaN(num)) return { r: 142, g: 77, b: 255 };
                return {
                    r: (num >> 16) & 255,
                    g: (num >> 8) & 255,
                    b: num & 255
                };
            }

            function rgbToHex(r, g, b) {
                return '#' + [r, g, b].map(x => {
                    let h = Math.round(Math.max(0, Math.min(255, x))).toString(16);
                    return h.length === 1 ? '0' + h : h;
                }).join('');
            }

            
            function hexToRgbStr(hex) {
                let rgb = hexToRgb(hex);
                return rgb.r + ',' + rgb.g + ',' + rgb.b;
            }

            function darkenColor(hex, amount) {
                if (!hex || !hex.startsWith('#')) hex = '#8E4DFF';
                let rgb = hexToRgb(hex);
                let r = Math.max(0, Math.round(rgb.r * (1 - amount)));
                let g = Math.max(0, Math.round(rgb.g * (1 - amount)));
                let b = Math.max(0, Math.round(rgb.b * (1 - amount)));
                return rgbToHex(r, g, b);
            }

            function getCardThemeStyles(colorHex) {
                if (!colorHex || !colorHex.startsWith('#')) {
                    colorHex = '#8E4DFF';
                }
                let rgb = hexToRgb(colorHex);
                let isDark = getComputedStyle(document.documentElement).getPropertyValue('--is-dark-theme').trim() === '1';

                if (isDark) {
                    return {
                        bg: 'rgba(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ', 0.32)',
                        border: colorHex,
                        text: '#FFFFFF',
                        icon: '#FFFFFF'
                    };
                }

                // Nền sáng: hòa 24% vào nền trắng để tạo nền pastel mịn rõ nét, viền 75%, chữ đen đậm tương phản tuyệt đối
                let bgR = Math.round(rgb.r * 0.24 + 255 * 0.76);
                let bgG = Math.round(rgb.g * 0.24 + 255 * 0.76);
                let bgB = Math.round(rgb.b * 0.24 + 255 * 0.76);

                let bdrR = Math.round(rgb.r * 0.75 + 255 * 0.25);
                let bdrG = Math.round(rgb.g * 0.75 + 255 * 0.25);
                let bdrB = Math.round(rgb.b * 0.75 + 255 * 0.25);

                return {
                    bg: rgbToHex(bgR, bgG, bgB),
                    border: rgbToHex(bdrR, bdrG, bdrB),
                    text: 'var(--text-primary)',
                    icon: colorHex
                };
            }

            var calendarEl = document.getElementById('calendar');
            // Desktop: mặc định Tháng. Điện thoại: mặc định "Lịch trình tuần" (danh sách), nhớ chế độ xem cuối cùng
            const initialViewType = ztIsMobileCal() ? ztGetMobileInitialView() : 'dayGridMonth';
            const ZT_DAYS_VI_FULL = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

            calendar = new FullCalendar.Calendar(calendarEl, {
                initialView: initialViewType,
                windowResize: function(arg) {
                    if (!calendar || !calendar.view) return;
                    ztApplyResponsiveCalOptions();
                    const curView = calendar.view.type;
                    if (curView === 'dayGridMonth') return; // Giữ nguyên chế độ Tháng khi thay đổi kích thước cửa sổ
                    if (window.innerWidth <= 768) {
                        if (curView === 'timeGridWeek') calendar.changeView('listWeek');
                        else if (curView === 'timeGridDay') calendar.changeView('listDay');
                    } else {
                        if (curView === 'listWeek') calendar.changeView('timeGridWeek');
                        else if (curView === 'listDay') calendar.changeView('timeGridDay');
                    }
                },
                // Luôn dùng ngày thực tế (kể cả bản demo)
                locale: 'vi',
                firstDay: 1, // Bắt đầu tuần từ Thứ Hai
                height: '100%', // Chiếm 100% .calendar-wrapper - chỉ 1 thanh cuộn bên trong
                timeZone: 'local',
                dayMaxEvents: ztIsMobileCal() ? false : 3, // Desktop: tối đa 3 ca/ô + "+N buổi nữa". Mobile: hiện chấm màu
                // Tiêu đề ngày trong chế độ danh sách (tiếng Việt, không phụ thuộc gói locale)
                listDayFormat: function(a) {
                    let d = new Date(a.date.year, a.date.month, a.date.day);
                    return ZT_DAYS_VI_FULL[d.getDay()];
                },
                listDaySideFormat: function(a) {
                    return String(a.date.day).padStart(2, '0') + '/' + String(a.date.month + 1).padStart(2, '0');
                },
                noEventsContent: 'Không có buổi học nào trong khoảng thời gian này',
                allDayText: 'Cả ngày',
                moreLinkContent: function(args) {
                    return '+' + args.num + ' buổi nữa';
                },
                moreLinkClick: 'popover',
                eventDisplay: 'block',
                eventTimeFormat: {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                },
                dayHeaderContent: function(arg) {
                    const shortDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
                    let dayIdx = arg.date.getDay();
                    if (arg.view.type === 'dayGridMonth') {
                        const monthDays = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
                        return monthDays[dayIdx];
                    } else if (arg.view.type === 'timeGridWeek') {
                        let d = arg.date.getDate().toString().padStart(2, '0');
                        let m = (arg.date.getMonth() + 1).toString().padStart(2, '0');
                        let isToday = arg.isToday;
                        return {
                            html: '<div class="fc-week-header-cell ' + (isToday ? 'fc-header-today' : '') + '">' +
                                  '<div class="fc-week-header-day">' + shortDays[dayIdx] + '</div>' +
                                  '<div class="fc-week-header-date">' + d + '/' + m + '</div>' +
                                  '</div>'
                        };
                    } else if (arg.view.type.startsWith('list')) {
                        // Lịch tuần/ngày dạng danh sách: tiêu đề ngày gọn trên 1 dòng
                        let daysFullL = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                        let dl = arg.date.getDate().toString().padStart(2, '0');
                        let ml = (arg.date.getMonth() + 1).toString().padStart(2, '0');
                        return {
                            html: '<div class="zt-ld' + (arg.isToday ? ' is-today' : '') + '">' +
                                  '<span class="zt-ld-day">' + daysFullL[dayIdx] + '</span>' +
                                  '<span class="zt-ld-date">' + dl + '/' + ml + '</span>' +
                                  (arg.isToday ? '<span class="zt-ld-today">Hôm nay</span>' : '') +
                                  '</div>'
                        };
                    } else {
                        // timeGridDay
                        let daysFull = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                        let d = arg.date.getDate().toString().padStart(2, '0');
                        let m = (arg.date.getMonth() + 1).toString().padStart(2, '0');
                        let y = arg.date.getFullYear();
                        let isToday = arg.isToday;
                        return {
                            html: '<div class="fc-week-header-cell ' + (isToday ? 'fc-header-today' : '') + '">' +
                                  '<div class="fc-week-header-day">' + daysFull[dayIdx] + '</div>' +
                                  '<div class="fc-week-header-date">' + d + '/' + m + '/' + y + '</div>' +
                                  '</div>'
                        };
                    }
                },
                eventContent: function(arg) {
                    let isDark = getComputedStyle(document.documentElement).getPropertyValue('--is-dark-theme').trim() === '1';

                    if (arg.view.type === 'dayGridMonth') {
                        let props = arg.event.extendedProps || {};
                        let color = props.eventColor || props.color || '#8E4DFF';
                        if (ztIsMobileCal()) {
                            let dotTitle = fixVietnameseMojibake(props.studentName || arg.event.title || '') + (props.startTime ? ' (' + props.startTime + ')' : '');
                            let dotClr = props.status === 'cancelled' ? '#9CA3AF' : color;
                            return { html: '<span class="fc-m-dot" title="' + escapeHtml(dotTitle) + '" style="background:' + escapeHtml(dotClr) + ';"></span>' };
                        }
                        let timeStr = props.startTime || (arg.timeText || '');
                        const titleStr = fixVietnameseMojibake(props.studentName || arg.event.title || '');
                        
                        let isCancelled = props.status === 'cancelled';
                        let textDecor = isCancelled ? 'text-decoration: line-through;' : '';
                        let dotColor = isCancelled ? '#9CA3AF' : color;
                        let textClr = isCancelled ? '#9CA3AF' : (isDark ? '#FFFFFF' : 'var(--text-primary)');
                        
                        let chipBg, chipBorder;
                        if (isCancelled) {
                            chipBg = isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9';
                            chipBorder = isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1';
                        } else if (isDark) {
                            chipBg = 'rgba(' + hexToRgbStr(color) + ', 0.28)';
                            chipBorder = 'rgba(' + hexToRgbStr(color) + ', 0.65)';
                        } else {
                            chipBg = 'rgba(' + hexToRgbStr(color) + ', 0.13)';
                            chipBorder = 'rgba(' + hexToRgbStr(color) + ', 0.42)';
                        }
                        let timeClr = isCancelled ? '#9CA3AF' : (isDark ? '#FFFFFF' : color);
                        let fullTooltip = escapeHtml(titleStr + (timeStr ? ' (' + timeStr + ')' : ''));
                        
                        let html = '<div class="fc-month-chip-inner" title="' + fullTooltip + '" style="background: ' + chipBg + '; border: 1px solid ' + chipBorder + '; ' + textDecor + '">' +
                                   (timeStr ? '<span class="fc-chip-time" style="color: ' + escapeHtml(timeClr) + ';">' + escapeHtml(timeStr) + '</span>' : '') +
                                   '<span class="fc-chip-title" style="color: ' + textClr + ';">' + escapeHtml(titleStr) + '</span>' +
                                   '</div>';
                        return { html: html };
                    }

                    if (arg.view.type === 'timeGridWeek' || arg.view.type === 'timeGridDay') {
                        let props = arg.event.extendedProps || {};
                        let color = props.eventColor || props.color || '#8E4DFF';
                        
                        let timeStr = '';
                        if (props.startTime && props.endTime) {
                            timeStr = props.startTime + '-' + props.endTime;
                        } else if (arg.timeText) {
                            timeStr = arg.timeText.replace(/\s+/g, '');
                        } else {
                            let s = arg.event.start;
                            let e = arg.event.end;
                            if (s && e) {
                                let sh = s.getHours().toString().padStart(2, '0');
                                let sm = s.getMinutes().toString().padStart(2, '0');
                                let eh = e.getHours().toString().padStart(2, '0');
                                let em = e.getMinutes().toString().padStart(2, '0');
                                timeStr = sh + ':' + sm + '-' + eh + ':' + em;
                            }
                        }

                        let titleStr = fixVietnameseMojibake(props.studentName || arg.event.title || '');
                        let feeNum = props.fee || 500000;
                        let feeStr = Number(feeNum).toLocaleString('vi-VN') + ' đ';

                        let theme = getCardThemeStyles(color);
                        let isCancelled = props.status === 'cancelled';
                        let cardBg = isCancelled ? '#F3F4F6' : theme.bg;
                        let cardBorder = isCancelled ? '#D1D5DB' : theme.border;
                        let textColor = isCancelled ? '#9CA3AF' : (isDark ? '#FFFFFF' : 'var(--text-primary)');
                        let iconColor = escapeHtml(isCancelled ? '#9CA3AF' : (isDark ? '#FFFFFF' : color));
                        let textDecor = isCancelled ? 'text-decoration: line-through;' : '';

                        let repeatIconHtml = !props.isOneTime
                            ? '<span class="fc-week-card-icon" style="color: ' + iconColor + ';" title="Lịch lặp lại hàng tuần"><i class="fa-solid fa-repeat"></i></span>'
                            : '<span class="fc-week-card-icon" style="color: ' + iconColor + '; opacity: 0.65;" title="Buổi học 1 lần"><i class="fa-regular fa-clock"></i></span>';

                        let html = '<div class="fc-week-card-inner" style="background: ' + escapeHtml(cardBg) + '; border: 1px solid ' + escapeHtml(cardBorder) + '; border-left: 3.5px solid ' + escapeHtml(color) + '; color: ' + textColor + '; ' + textDecor + '">' +
                                   '<div class="fc-week-card-header">' +
                                       '<span class="fc-week-card-time" style="color: ' + textColor + '; font-weight: 700;">' + escapeHtml(timeStr) + '</span>' +
                                       repeatIconHtml +
                                   '</div>' +
                                   '<div class="fc-week-card-subject" style="color: ' + textColor + '; font-weight: 700;" title="' + escapeHtml(titleStr) + '">' + escapeHtml(titleStr) + '</div>' +
                                   '<div class="fc-week-card-fee" style="color: ' + (isDark ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)') + '; font-weight: 600;">' + escapeHtml(feeStr) + '</div>' +
                                   '</div>';
                        return { html: html };
                    }

                    if (arg.view.type.startsWith('list')) {
                        let props = arg.event.extendedProps || {};
                        let color = props.eventColor || props.color || '#8E4DFF';
                        let studentName = props.studentName || arg.event.title || 'Học sinh';
                        let subject = props.subject || '';
                        let notes = props.notes || '';
                        let feeNum = props.fee || 200000;
                        let feeStr = Number(feeNum).toLocaleString('vi-VN') + ' đ';
                        let isCancelled = props.status === 'cancelled';
                        let isOneTime = props.isOneTime;

                        // ĐIỆN THOẠI: thẻ ca học gọn gàng (cột giờ | tên + môn | học phí)
                        if (ztIsMobileCal()) {
                            let pad2 = n => String(n).padStart(2, '0');
                            let st = props.startTime || (arg.event.start ? pad2(arg.event.start.getHours()) + ':' + pad2(arg.event.start.getMinutes()) : '');
                            let en = props.endTime || (arg.event.end ? pad2(arg.event.end.getHours()) + ':' + pad2(arg.event.end.getMinutes()) : '');
                            let sub = (subject && subject !== studentName) ? subject : '';
                            if (notes) sub = sub ? (sub + ' · ' + notes) : notes;
                            let tag = isCancelled ? '<span class="zt-lc-tag cancel">Đã hủy</span>'
                                    : (isOneTime ? '<span class="zt-lc-tag once">1 lần</span>' : '');
                            let html = '<div class="zt-lc' + (isCancelled ? ' is-cancelled' : '') + '" style="--zt-ev-color:' + escapeHtml(color) + ';">' +
                                         '<div class="zt-lc-time"><b>' + escapeHtml(st) + '</b><span>' + escapeHtml(en) + '</span></div>' +
                                         '<div class="zt-lc-main">' +
                                           '<div class="zt-lc-name"><span class="zt-lc-name-text">' + escapeHtml(fixVietnameseMojibake(studentName)) + '</span>' + tag + '</div>' +
                                           (sub ? '<div class="zt-lc-sub">' + escapeHtml(sub) + '</div>' : '') +
                                         '</div>' +
                                         '<div class="zt-lc-fee">' + escapeHtml(feeStr) + '</div>' +
                                       '</div>';
                            return { html: html };
                        }

                        let textClr = isCancelled ? '#9CA3AF' : (isDark ? '#FFFFFF' : 'var(--text-primary)');
                        let textDecor = isCancelled ? 'text-decoration: line-through;' : '';

                        let badgeHtml = '';
                        if (isCancelled) {
                            badgeHtml = '<span style="font-size: 10.5px; padding: 2px 6px; border-radius: 6px; background: rgba(239, 68, 68, 0.15); color: #EF4444; font-weight: 700; margin-left: 6px;">Đã hủy</span>';
                        } else if (isOneTime) {
                            badgeHtml = '<span style="font-size: 10.5px; padding: 2px 6px; border-radius: 6px; background: rgba(245, 158, 11, 0.15); color: #F59E0B; font-weight: 700; margin-left: 6px;">1 Lần</span>';
                        }

                        let subText = subject && subject !== studentName ? subject : '';
                        if (notes) {
                            subText = subText ? (subText + ' · ' + notes) : notes;
                        }
                        let subHtml = subText ? '<div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px; font-weight: 500;">' + escapeHtml(subText) + '</div>' : '';

                        let html = '<div class="fc-list-item-content" style="display: flex; align-items: center; justify-content: space-between; gap: 10px; width: 100%; ' + textDecor + '">' +
                                   '  <div style="display: flex; flex-direction: column; min-width: 0; flex: 1;">' +
                                   '    <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">' +
                                   '      <span style="font-size: 14px; font-weight: 700; color: ' + textClr + ';">' + escapeHtml(studentName) + '</span>' +
                                   '      ' + badgeHtml +
                                   '    </div>' +
                                   '    ' + subHtml +
                                   '  </div>' +
                                   '  <div style="font-size: 12.5px; font-weight: 700; color: var(--color-primary); white-space: nowrap; margin-left: 8px;">' +
                                   '    ' + feeStr +
                                   '  </div>' +
                                   '</div>';
                        return { html: html };
                    }

                    return null;
                },
                slotMinTime: "07:00:00",
                slotMaxTime: "23:00:00",
                slotDuration: '00:30:00',   // Chia ô 30 phút
                slotLabelInterval: '01:00:00', // Chỉ hiện nhãn tròn giờ (7:00, 8:00...) đúng như Image 2
                scrollTime: '07:00:00',      // Mặc định hiển thị từ 7h sáng
                slotLabelContent: function(arg) {
                    let h = arg.date.getHours();
                    let m = arg.date.getMinutes();
                    return h + ':' + (m < 10 ? '0' : '') + m;
                },
                allDaySlot: false,
                editable: !ztIsMobileCal(),  // Điện thoại: tắt kéo-thả để tránh dời nhầm ca khi vuốt cuộn (sửa qua modal)
                selectable: true,
                selectMirror: true,          // Hiển thị khối sự kiện ảo xem trước khi kéo thả chọn vùng thời gian
                selectLongPressDelay: 350,   // Nhấn giữ 350ms trên điện thoại rồi kéo để chọn vùng thời gian
                eventLongPressDelay: 350,    // Nhấn giữ 350ms trên điện thoại để bắt đầu kéo thả di chuyển sự kiện
                nowIndicator: true, // Kích hoạt đường chỉ giờ hiện tại
                eventDidMount: function(info) {
                    let props = info.event.extendedProps || {};
                    let evColor = props.eventColor || props.color || '#8E4DFF';
                    let isDark = getComputedStyle(document.documentElement).getPropertyValue('--is-dark-theme').trim() === '1';

                    if (!info.view.type.startsWith('list')) {
                        info.el.style.setProperty('background', 'transparent', 'important');
                        info.el.style.setProperty('border', 'none', 'important');
                        info.el.style.setProperty('box-shadow', 'none', 'important');
                        info.el.style.setProperty('padding', '0', 'important');
                    }

                    if (info.view.type === 'dayGridMonth') {
                        var innerChip = info.el.querySelector('.fc-month-chip-inner');
                        if (innerChip) {
                            var chipTitle = innerChip.querySelector('.fc-chip-title');
                            var chipTime = innerChip.querySelector('.fc-chip-time');
                            if (isDark) {
                                innerChip.style.setProperty('background', 'rgba(' + hexToRgbStr(evColor) + ', 0.32)', 'important');
                                innerChip.style.setProperty('border', '1px solid ' + evColor, 'important');
                                innerChip.style.setProperty('box-shadow', '0 1px 3px rgba(0, 0, 0, 0.25)', 'important');
                                if (chipTitle) chipTitle.style.setProperty('color', '#FFFFFF', 'important');
                                if (chipTime) chipTime.style.setProperty('color', '#FFFFFF', 'important');
                            } else {
                                innerChip.style.setProperty('background', 'rgba(' + hexToRgbStr(evColor) + ', 0.22)', 'important');
                                innerChip.style.setProperty('border', '1px solid rgba(' + hexToRgbStr(evColor) + ', 0.80)', 'important');
                                innerChip.style.setProperty('box-shadow', '0 1px 3px rgba(0, 0, 0, 0.06)', 'important');
                                if (chipTitle) chipTitle.style.setProperty('color', 'var(--text-primary)', 'important');
                                if (chipTime) chipTime.style.setProperty('color', 'var(--text-primary)', 'important');
                            }
                        }
                    }

                    // Xử lý hiển thị buổi học đã hủy
                    if (props.status === 'cancelled') {
                        info.el.style.setProperty('opacity', '0.55', 'important');
                        info.el.classList.add('event-status-cancelled');
                    }

                    // Liên kết Nhật ký: ca đã được ghi buổi học => gắn dấu ✓
                    if (props.studentName && props.date && ztGetLessonLog(props.studentName, props.date)) {
                        info.el.classList.add('zt-ev-logged');
                        let host = info.el.querySelector('.zt-lc-name, .fc-chip-title, .fc-week-card-subject, .fc-list-item-content span');
                        if (host && !host.querySelector('.zt-logged-badge')) {
                            let b = document.createElement('span');
                            b.className = 'zt-logged-badge';
                            b.title = 'Đã ghi nhật ký buổi học';
                            b.innerHTML = '<i class="fa-solid fa-check"></i>';
                            host.appendChild(b);
                        }
                    }
                },
                headerToolbar: false, // Tắt headerToolbar mặc định vì đã dùng custom header
                datesSet: function(dateInfo) {
                    updateCalendarHeaderTitle(dateInfo.view);
                    updateActiveViewPills(dateInfo.view.type);
                    updateMonthBottomBar(dateInfo.view);
                    if (ztIsMobileCal() && (dateInfo.view.type === 'listWeek' || dateInfo.view.type === 'dayGridMonth')) {
                        try { localStorage.setItem(ZT_CAL_MOBILE_VIEW_KEY, dateInfo.view.type); } catch(e) {}
                    }
                },
                // Điện thoại - chế độ Tháng: chạm vào 1 ngày để xem danh sách ca của ngày đó
                dateClick: function(info) {
                    if (!ztIsMobileCal() || info.view.type !== 'dayGridMonth') return;
                    calendar.changeView('listDay', info.date);
                },
                eventsSet: function() {
                    if (calendar && calendar.view) updateCalendarHeaderTitle(calendar.view);
                },
                dayCellDidMount: function(arg) {
                    if (arg.view.type !== 'dayGridMonth') return;
                    let hol = getVNHoliday(arg.date);
                    if (!hol) return;

                    arg.el.classList.add('fc-day-holiday');
                    arg.el.style.setProperty('--holiday-tint', hol.tint);

                    // Ảnh chìm minh họa ngày lễ
                    let frame = arg.el.querySelector('.fc-daygrid-day-frame');
                    if (frame && !frame.querySelector('.fc-holiday-art-bg')) {
                        let bg = document.createElement('div');
                        bg.className = 'fc-holiday-art-bg';
                        bg.style.backgroundImage = "url('img/holidays/" + hol.img + ".jpg')";
                        frame.insertBefore(bg, frame.firstChild);
                        frame.title = hol.full;
                    }

                    let topEl = arg.el.querySelector('.fc-daygrid-day-top');
                    if (topEl && !topEl.querySelector('.fc-vn-holiday-badge')) {
                        let holEl = document.createElement('span');
                        holEl.className = 'fc-vn-holiday-badge';
                        holEl.title = hol.full;
                        holEl.innerText = hol.name;
                        topEl.appendChild(holEl);
                    }
                },
                events: function(info, successCallback, failureCallback) {
                    // Khi chuyển sang chế độ Tháng, calendar.view có thể vẫn trả về view cũ (Tuần)
                    // => chỉ sinh sự kiện cho 1 tuần. Dựa vào độ dài khoảng ngày được yêu cầu để xác định chính xác.
                    let rangeDays = (new Date(info.end) - new Date(info.start)) / 86400000;
                    let vType = rangeDays > 8
                        ? 'dayGridMonth'
                        : ((calendar && calendar.view) ? calendar.view.type : initialViewType);
                    let events = getEventsForCalendarRange(info, vType);
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
                    if (startT === '00:00' && endT === '00:00') {
                        startT = '08:00';
                        endT   = '09:30';
                    }
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
                        showRecurrenceDialog('Muốn di chuyển ca dạy của <b>' + escapeHtml(props.studentName) + '</b> sang ' + newDayKey.toUpperCase() + '?');
                        return;
                    }

                    // Sự kiện 1 lần: cập nhật trực tiếp
                    applyDrop(props, newDayKey, newStart, newEnd, start, true);
                },

                eventResize: function(info) {
                    let end    = info.event.end;
                    let newEnd = end.getHours().toString().padStart(2,'0') + ':' + end.getMinutes().toString().padStart(2,'0');
                    const props = info.event.extendedProps;

                    if (!props.isOneTime && !props.isReschedule) {
                        info.revert();
                        pendingChange = {
                            type: 'resize',
                            props: props,
                            newEnd: newEnd
                        };
                        showRecurrenceDialog('Muốn đổi giờ kết thúc ca dạy của <b>' + escapeHtml(props.studentName) + '</b> thành ' + newEnd + '?');
                        return;
                    }

                    applyResize(props, newEnd);
                }
            });

            calendar.render();
            window.calendar = calendar;
            document.documentElement.classList.toggle('cal-mobile', ztIsMobileCal());

            // Điện thoại: vuốt trái/phải trên vùng lịch để sang tuần/tháng sau/trước
            (function setupCalendarSwipe() {
                var wrap = document.querySelector('.calendar-wrapper');
                if (!wrap) return;
                var sx = 0, sy = 0, st = 0, tracking = false;
                wrap.addEventListener('touchstart', function(e) {
                    if (!ztIsMobileCal() || e.touches.length !== 1) { tracking = false; return; }
                    sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now(); tracking = true;
                }, { passive: true });
                wrap.addEventListener('touchend', function(e) {
                    if (!tracking || !calendar) return;
                    tracking = false;
                    var t = e.changedTouches && e.changedTouches[0];
                    if (!t) return;
                    var dx = t.clientX - sx, dy = t.clientY - sy;
                    // Chỉ nhận cú vuốt ngang rõ ràng, nhanh (tránh nhầm với cuộn dọc)
                    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 2 || Date.now() - st > 600) return;
                    if (document.querySelector('.modal-overlay.active, #eventDetailPopover.visible, .fc-popover')) return;
                    if (dx < 0) calendar.next(); else calendar.prev();
                }, { passive: true });
            })();

            // Đảm bảo FullCalendar luôn tự động cập nhật kích thước ngay khi iframe hiển thị hoặc thay đổi kích thước
            if (window.ResizeObserver) {
                try {
                    var calResizeObs = new ResizeObserver(function() {
                        if (calendar && typeof calendar.updateSize === 'function') {
                            calendar.updateSize();
                        }
                    });
                    if (calendarEl) calResizeObs.observe(calendarEl);
                    if (document.body) calResizeObs.observe(document.body);
                } catch(e) {}
            }

            window.addEventListener('resize', function() {
                if (calendar && typeof calendar.updateSize === 'function') {
                    calendar.updateSize();
                }
            });

            window.addEventListener('message', function(e) {
                if (e.origin !== window.location.origin) return;
                if (!e.data) return;
                var data = e.data;
                if (data === 'updateCalendarSize' || (typeof data === 'object' && data.type === 'updateCalendarSize')) {
                    if (calendar && typeof calendar.updateSize === 'function') {
                        calendar.updateSize();
                    }
                } else if (typeof data === 'object' && data.type === 'setTheme') {
                    if (typeof applyTheme === 'function') applyTheme(data.themeId);
                } else if (typeof data === 'object' && data.type === 'setCustomTheme') {
                    if (typeof applyCustomTheme === 'function') applyCustomTheme(true, data.hex);
                }
            });

            // Cho phép cuộn ngang danh sách học sinh (legend) bằng con lăn chuột
            let legendListEl = document.getElementById('calStudentLegendList');
            if (legendListEl) {
                legendListEl.addEventListener('wheel', function(e) {
                    if (e.deltaY !== 0) {
                        e.preventDefault();
                        this.scrollLeft += e.deltaY;
                    }
                }, { passive: false });
            }
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

        // --- Helper cho drop/resize ---
        function getRowForProps(props) {
            return (props.studentIndex !== undefined && tutorScheduleSheetData && tutorScheduleSheetData[props.studentIndex])
                ? tutorScheduleSheetData[props.studentIndex]
                : (Array.isArray(tutorScheduleSheetData) ? tutorScheduleSheetData.find(s => s && s.studentName && s.studentName.trim().toLowerCase() === (props.studentName || '').trim().toLowerCase()) : null);
        }
        const SLOT_TIME_RE = /(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/;
        function replaceTimeInBody(body, newStart, newEnd) {
            return SLOT_TIME_RE.test(body) ? body.replace(SLOT_TIME_RE, newStart + ' - ' + newEnd) : (newStart + ' - ' + newEnd + ' ' + body).trim();
        }
        // Bỏ tiền tố ngày "DD/MM/YYYY: " hoặc "RESCHEDULE DD/MM/YYYY: " khỏi body
        function stripDatePrefix(body) {
            return body.replace(/^RESCHEDULE \d{2}\/\d{2}\/\d{4}:\s*/, '').replace(/^\d{2}\/\d{2}\/\d{4}:\s*/, '');
        }
        function appendSlot(row, dk, val) {
            let slots = cellToSlots(row[dk]);
            slots.push(val);
            row[dk] = slots.join(' | ');
        }
        function removeSlotAt(row, dk, idx) {
            let slots = cellToSlots(row[dk]);
            if (idx >= 0 && idx < slots.length) slots.splice(idx, 1);
            row[dk] = slots.join(' | ');
        }
        // Tìm ca lặp lại gốc của 1 buổi RESCHEDULE: ưu tiên SKIP trùng đúng ngày, sau đó SKIP cùng tuần
        function findOrigForReschedule(row, rescDMY) {
            let p = rescDMY.split('/');
            let rescDate = new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
            let wkStart = getStartOfWeek(rescDate);
            let wkEnd = new Date(wkStart); wkEnd.setDate(wkStart.getDate() + 7);
            let sameWeek = null;
            for (let dk of allDayKeys) {
                let slots = cellToSlots(row[dk]);
                for (let i = 0; i < slots.length; i++) {
                    if (/^(\[C:#[0-9A-Fa-f]{6}\]\s*)?(\d{2}\/|RESCHEDULE)/.test(slots[i])) continue;
                    let skips = splitSlotParts(slots[i]).skips;
                    if (skips.includes(rescDMY)) return { dk: dk, idx: i, skipDate: rescDMY };
                    if (!sameWeek) {
                        for (let sd of skips) {
                            let q = sd.split('/');
                            let d = new Date(parseInt(q[2]), parseInt(q[1]) - 1, parseInt(q[0]));
                            if (d >= wkStart && d < wkEnd) { sameWeek = { dk: dk, idx: i, skipDate: sd }; break; }
                        }
                    }
                }
            }
            return sameWeek;
        }

        // Áp dụng di chuyển (drop) - hỗ trợ multi-slot
        function applyDrop(props, newDayKey, newStart, newEnd, start, isThisOnly) {
            let row = getRowForProps(props);
            if (!row) {
                console.warn('Không tìm thấy dữ liệu học sinh:', props.studentName);
                return;
            }
            let oldDayKey = props.dayKey;
            let newDateStr = fmtDMY(start);
            let oldSlots = cellToSlots(row[oldDayKey]);
            let parts = splitSlotParts(oldSlots[props.subIndex] || '');
            let colorPrefix = parts.color || (props.sessionColor ? ('[C:' + props.sessionColor + '] ') : '');
            let coreBody = stripDatePrefix(parts.body || (props.startTime + ' - ' + props.endTime + (props.notes ? ' (' + props.notes + ')' : '')));
            let movedBody = replaceTimeInBody(coreBody, newStart, newEnd);

            // === SỰ KIỆN ĐÃ DỜI (RESCHEDULE) ===
            if (props.isReschedule) {
                // 1. Xóa entry RESCHEDULE cũ
                removeSlotAt(row, oldDayKey, props.subIndex);
                // 2. Tìm ca lặp lại gốc (sau khi xóa để index chính xác)
                let orig = findOrigForReschedule(row, props.oneTimeDateStr);

                if (isThisOnly) {
                    let restored = false;
                    if (orig && orig.dk === newDayKey && orig.skipDate === newDateStr) {
                        let oSlots = cellToSlots(row[orig.dk]);
                        let oParts = splitSlotParts(oSlots[orig.idx]);
                        let m = oParts.body.match(SLOT_TIME_RE);
                        let oStart = m ? m[1].padStart(2, '0') + ':' + m[2] : '';
                        let oEnd   = m ? m[3].padStart(2, '0') + ':' + m[4] : '';
                        if (oStart === newStart && oEnd === newEnd) {
                            // Kéo về đúng ngày + giờ gốc → gỡ SKIP, lịch gốc hiển thị lại
                            oParts.skips = oParts.skips.filter(s => s !== orig.skipDate);
                            oSlots[orig.idx] = joinSlotParts(oParts);
                            row[orig.dk] = oSlots.join(' | ');
                            restored = true;
                        }
                    }
                    if (!restored) {
                        appendSlot(row, newDayKey, colorPrefix + 'RESCHEDULE ' + newDateStr + ': ' + movedBody);
                    }
                } else {
                    // 'Tất cả các tuần': thay lịch cố định gốc bằng lịch mới
                    if (orig) removeSlotAt(row, orig.dk, orig.idx);
                    appendSlot(row, newDayKey, colorPrefix + movedBody);
                }
                saveAndRefetch(row.studentName);
                return;
            }

            // === SỰ KIỆN 1 LẦN ===
            if (props.isOneTime) {
                removeSlotAt(row, oldDayKey, props.subIndex);
                appendSlot(row, newDayKey, colorPrefix + newDateStr + ': ' + movedBody);

            } else if (isThisOnly) {
                // "Chỉ tuần này": SKIP đúng ngày gốc của buổi này + thêm RESCHEDULE vào ngày mới
                let skipDate = fmtDMY(parseYMDLocal(props.date));
                if (!parts.skips.includes(skipDate)) parts.skips.push(skipDate);
                oldSlots[props.subIndex] = joinSlotParts(parts);
                row[oldDayKey] = oldSlots.join(' | ');
                appendSlot(row, newDayKey, colorPrefix + 'RESCHEDULE ' + newDateStr + ': ' + movedBody);

            } else {
                // "Tất cả các tuần"
                if (oldDayKey === newDayKey) {
                    // Cùng thứ: chỉ đổi giờ, giữ màu + danh sách SKIP
                    parts.body = movedBody;
                    oldSlots[props.subIndex] = joinSlotParts(parts);
                    row[oldDayKey] = oldSlots.join(' | ');
                } else {
                    // Khác thứ: xóa ca cũ, thêm ca mới (SKIP cũ không còn ý nghĩa)
                    removeSlotAt(row, oldDayKey, props.subIndex);
                    appendSlot(row, newDayKey, colorPrefix + movedBody);
                }
            }
            saveAndRefetch(row.studentName);
        }

        // Áp dụng đổi giờ kết thúc (resize)
        function applyResize(props, newEnd, isThisOnly) {
            let row = getRowForProps(props);
            if (!row) {
                console.warn('Không tìm thấy dữ liệu học sinh:', props.studentName);
                return;
            }
            let dayKey = props.dayKey;
            let slots = cellToSlots(row[dayKey]);
            let raw = slots[props.subIndex];
            if (raw === undefined) return;
            let parts = splitSlotParts(raw);

            if (!props.isOneTime && !props.isReschedule && isThisOnly) {
                // "Chỉ tuần này": SKIP buổi này + tạo RESCHEDULE cùng ngày với giờ kết thúc mới
                let dateDMY = fmtDMY(parseYMDLocal(props.date));
                if (!parts.skips.includes(dateDMY)) parts.skips.push(dateDMY);
                slots[props.subIndex] = joinSlotParts(parts);
                slots.push(parts.color + 'RESCHEDULE ' + dateDMY + ': ' + replaceTimeInBody(parts.body, props.startTime, newEnd));
            } else {
                // Ca 1 lần / ca đã dời / "tất cả các tuần": đổi giờ trong chính slot, giữ màu, tiền tố ngày và SKIP
                let prefixMatch = parts.body.match(/^(RESCHEDULE \d{2}\/\d{2}\/\d{4}:\s*|\d{2}\/\d{2}\/\d{4}:\s*)/);
                let prefix = prefixMatch ? prefixMatch[0] : '';
                parts.body = prefix + replaceTimeInBody(parts.body.slice(prefix.length), props.startTime, newEnd);
                slots[props.subIndex] = joinSlotParts(parts);
            }
            row[dayKey] = slots.join(' | ');
            saveAndRefetch(row.studentName);
        }

        // Áp dụng xoá ca dạy
        function applyDelete(props, start, isThisOnly) {
            let row = (props.studentIndex !== undefined && tutorScheduleSheetData && tutorScheduleSheetData[props.studentIndex])
                ? tutorScheduleSheetData[props.studentIndex]
                : (Array.isArray(tutorScheduleSheetData) ? tutorScheduleSheetData.find(s => s && s.studentName && s.studentName.trim().toLowerCase() === (props.studentName || '').trim().toLowerCase()) : null);
            if (!row) {
                console.warn('Không tìm thấy dữ liệu học sinh:', props.studentName);
                return;
            }
            let oldDayKey = props.dayKey;

            if (isThisOnly) {
                // Thêm SKIP chỉ cho slot này trong ngày này
                let dd   = start.getDate().toString().padStart(2, '0');
                let mm   = (start.getMonth() + 1).toString().padStart(2, '0');
                let yyyy = start.getFullYear();
                let skipDate = dd + '/' + mm + '/' + yyyy;

                let slots = (row[oldDayKey] || '').split('|').map(s => s.trim());
                let slotRaw = slots[props.subIndex] || '';
                let baseSlot = slotRaw.includes(' SKIP ') ? slotRaw.split(' SKIP ')[0] : slotRaw;
                let existSkips = slotRaw.includes(' SKIP ') ? slotRaw.split(' SKIP ')[1] : '';
                let skipList = existSkips ? existSkips.split(',').map(s => s.trim()) : [];
                if (!skipList.includes(skipDate)) skipList.push(skipDate);
                slots[props.subIndex] = baseSlot + ' SKIP ' + skipList.join(',');
                row[oldDayKey] = slots.join(' | ');
            } else {
                // Xóa toàn bộ: chỉ xóa slot này, giữ lại các slot khác
                let slots = (row[oldDayKey] || '').split('|').map(s => s.trim());
                slots.splice(props.subIndex, 1);
                row[oldDayKey] = slots.filter(s => s !== '').join(' | ');
                cleanupEmptyTrialStudent(row.studentName);
            }
            saveAndRefetch(row.studentName, null, 'full');
        }

        // === ĐIỀU KHIỂN FLOATING POPOVER CHI TIẾT SỰ KIỆN ===
        let activeFcEvent = null;

        function showEventDetail(fcEvent, jsEvent) {
            activeFcEvent = fcEvent;
            const props = (fcEvent && fcEvent.extendedProps) ? fcEvent.extendedProps : {};

            // --- Điền nội dung ---
            let titleEl = document.getElementById("detailTitle");
            if (titleEl) titleEl.innerText = props.studentName || "Chi tiết ca dạy";
            ztUpdateDetailLinks(props);

            const colorDot = document.getElementById("detailColorDot");
            let dotColor = props.eventColor || (props.isOneTime ? "#FFD23F" : "#8E4DFF");
            if (colorDot) {
                colorDot.style.backgroundColor = dotColor;
                colorDot.style.boxShadow = "0 0 7px " + dotColor + "aa";
            }

            let dateObj = parseYMDLocal(props.date);
            let daysOfWeekVi = ["Chủ Nhật","Thứ Hai","Thứ Ba","Thứ Tư","Thứ Năm","Thứ Sáu","Thứ Bảy"];
            let dayName  = isNaN(dateObj.getTime()) ? "" : daysOfWeekVi[dateObj.getDay()];
            let dayNum   = isNaN(dateObj.getTime()) ? "" : dateObj.getDate();
            let monthNum = isNaN(dateObj.getTime()) ? "" : (dateObj.getMonth() + 1);
            let dtEl = document.getElementById("detailDateTime");
            if (dtEl) {
                dtEl.innerText = (dayName ? (dayName + ", " + dayNum + " tháng " + monthNum + " · ") : "") + (props.startTime || "") + " – " + (props.endTime || "");
            }

            // Tìm studentRow một cách an toàn theo studentIndex hoặc tên học sinh
            let studentRow = (props.studentIndex !== undefined && tutorScheduleSheetData && tutorScheduleSheetData[props.studentIndex])
                ? tutorScheduleSheetData[props.studentIndex]
                : (Array.isArray(tutorScheduleSheetData) ? tutorScheduleSheetData.find(s => s && s.studentName && s.studentName.trim().toLowerCase() === (props.studentName || '').trim().toLowerCase()) : null);

            let cellVal = (studentRow && props.dayKey && studentRow[props.dayKey]) ? studentRow[props.dayKey] : "";
            let slotRawForDetail = cellToSlots(cellVal)[props.subIndex] || "";
            let recurrenceText;
            if (props.isReschedule) {
                recurrenceText = "Buổi học được dời (chỉ tuần này)";
            } else if (props.isOneTime) {
                recurrenceText = "Diễn ra một lần";
            } else {
                recurrenceText = "Hàng tuần vào " + (dayName ? dayName.toLowerCase() : (props.dayKey || ""));
                if (slotRawForDetail.includes(" SKIP ")) recurrenceText += " (Có tuần được dời)";
            }
            let recEl = document.getElementById("detailRecurrence");
            if (recEl) recEl.innerText = recurrenceText;

            const feeEl = document.getElementById("detailFee");
            if (feeEl) {
                let fVal = props.fee || (studentRow && studentRow.fee) || 500000;
                feeEl.innerText = Number(fVal).toLocaleString('vi-VN') + ' đ / buổi';
            }

            const notesContainer = document.getElementById("detailNotesContainer");
            if (notesContainer) {
                if (props.notes && props.notes.trim() !== "") {
                    let nEl = document.getElementById("detailNotes");
                    if (nEl) nEl.innerText = props.notes;
                    notesContainer.style.display = "flex";
                } else {
                    notesContainer.style.display = "none";
                }
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
                    top = elRect.top;
                } else if (elRect.left - margin - popW >= 0) {
                    left = elRect.left - margin - popW; // bên trái sự kiện
                    top = elRect.top;
                } else {
                    // Sự kiện quá rộng (chế độ Ngày): hiện ngay tại vị trí click
                    const cx = (jsEvent.jsEvent && jsEvent.jsEvent.clientX) || (elRect.left + elRect.width / 2);
                    const cy = (jsEvent.jsEvent && jsEvent.jsEvent.clientY) || elRect.top;
                    left = cx - popW / 2;
                    top = cy + 12;
                }
                // Luôn giữ trong màn hình
                left = Math.max(margin, Math.min(left, vw - popW - margin));

                // Giữ trong màn hình theo chiều dọc
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
            activeFcEvent = eventToEdit; // Khôi phục lại activeFcEvent để không bị null sau khi đóng popover
            openEditEventModal(eventToEdit);
        }


        function deleteFromDetail() {
            if (!activeFcEvent) return;
            const props = activeFcEvent.extendedProps || {};
            let studentRow = (props.studentIndex !== undefined && tutorScheduleSheetData && tutorScheduleSheetData[props.studentIndex])
                ? tutorScheduleSheetData[props.studentIndex]
                : (Array.isArray(tutorScheduleSheetData) ? tutorScheduleSheetData.find(s => s && s.studentName && s.studentName.trim().toLowerCase() === (props.studentName || '').trim().toLowerCase()) : null);
            let oldDayKey  = props.dayKey;
            let sName = (studentRow && studentRow.studentName) || props.studentName || "";

            if (props.isOneTime || props.isReschedule) {
                closeDetailModalForce();
                let confirmMsg = props.isReschedule
                    ? "Bạn có chắc chắn muốn xóa buổi học đã dời này của <b>" + escapeHtml(sName || "học sinh") + "</b> không? (Lịch cố định các tuần khác giữ nguyên)"
                    : "Bạn có chắc chắn muốn xóa ca học một lần này của <b>" + escapeHtml(sName || "học sinh") + "</b> không?";
                showWebConfirm(confirmMsg, function() {
                    if (studentRow) {
                        // Chỉ khớp slot bắt đầu bằng đúng tiền tố ngày (tránh xóa nhầm ca lặp lại có SKIP chứa ngày đó)
                        let dateEsc = String(props.oneTimeDateStr || '').replace(/\//g, '\\/');
                        let prefRe = new RegExp('^(\\[C:#[0-9A-Fa-f]{6}\\]\\s*)?' + (props.isReschedule ? 'RESCHEDULE ' : '') + dateEsc + ':');
                        let deleted = false;
                        // 1. Ưu tiên đúng subIndex trong ô oldDayKey
                        if (oldDayKey && studentRow[oldDayKey]) {
                            let slots = cellToSlots(studentRow[oldDayKey]);
                            let idx = (props.subIndex >= 0 && props.subIndex < slots.length && prefRe.test(slots[props.subIndex]))
                                ? props.subIndex
                                : slots.findIndex(s => prefRe.test(s));
                            if (idx !== -1) {
                                slots.splice(idx, 1);
                                studentRow[oldDayKey] = slots.join(" | ");
                                deleted = true;
                            }
                        }
                        // 2. Quét các thứ khác
                        if (!deleted && props.oneTimeDateStr) {
                            for (let dk of allDayKeys) {
                                let slots = cellToSlots(studentRow[dk]);
                                let idx = slots.findIndex(s => prefRe.test(s));
                                if (idx !== -1) {
                                    slots.splice(idx, 1);
                                    studentRow[dk] = slots.join(" | ");
                                    deleted = true;
                                    break;
                                }
                            }
                        }

                        // Kiểm tra nếu là học sinh tự do / học thử và không còn ca học nào:
                        cleanupEmptyTrialStudent(sName);
                    }
                    saveAndRefetch(sName, null, 'full');
                });
            } else {
                closeDetailModalForce();
                pendingChange = {
                    type: 'delete',
                    props: props,
                    start: parseYMDLocal(props.date)
                };
                showRecurrenceDialog('Bạn muốn xóa ca dạy lặp lại của <b>' + escapeHtml(sName || "") + '</b> vào ' + escapeHtml(oldDayKey ? String(oldDayKey).toUpperCase() : "") + '?', true);
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
            document.getElementById("eventSubIndex").value = "";
            document.getElementById("eventOldDay").value = "";
            
            document.getElementById("eventStudent").value = "";
            document.getElementById("eventStudent").disabled = false;
            
            // Reset ô nhập tên học sinh khác
            document.getElementById("customStudentNameGroup").style.display = "none";
            document.getElementById("eventCustomStudentName").value = "";
            document.getElementById("eventCustomStudentName").required = false;

            document.getElementById("eventRepeatMode").value = "none"; 
            document.getElementById("eventDayOfWeek").value = dayKey;
            document.getElementById("eventSpecificDate").value = dateStr;
            
            allDayKeys.forEach(key => {
                document.getElementById("check" + key.charAt(0).toUpperCase() + key.slice(1)).checked = false;
            });

            document.getElementById("eventStartTime").value = startTime;
            document.getElementById("eventEndTime").value = endTime;
            document.getElementById("eventFee").value = formatNumberWithDots("500000");
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
            const props = (fcEvent && fcEvent.extendedProps) ? fcEvent.extendedProps : {};
            let titleEl = document.getElementById("modalTitleText");
            if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen-to-square" style="color: #FFD23F;"></i> Sửa lịch dạy';
            
            let studentRow = (props.studentIndex !== undefined && tutorScheduleSheetData && tutorScheduleSheetData[props.studentIndex])
                ? tutorScheduleSheetData[props.studentIndex]
                : (Array.isArray(tutorScheduleSheetData) ? tutorScheduleSheetData.find(s => s && s.studentName && s.studentName.trim().toLowerCase() === (props.studentName || '').trim().toLowerCase()) : null);
            let studentIdx = studentRow ? tutorScheduleSheetData.indexOf(studentRow) : (props.studentIndex !== undefined ? props.studentIndex : 0);

            document.getElementById("eventStudentIndex").value = studentIdx;
            document.getElementById("eventSubIndex").value = (props.subIndex !== undefined ? props.subIndex : "");
            document.getElementById("eventOldDay").value = props.dayKey || "";
            
            document.getElementById("eventStudent").value = studentIdx;
            document.getElementById("eventStudent").disabled = true;

            // Ẩn ô nhập tên học sinh khác khi sửa lịch hiện tại
            document.getElementById("customStudentNameGroup").style.display = "none";
            document.getElementById("eventCustomStudentName").value = "";
            document.getElementById("eventCustomStudentName").required = false;

            if (props.isOneTime) {
                document.getElementById("eventRepeatMode").value = "none";
                let parts = (props.oneTimeDateStr || "").split("/");
                if (parts.length === 3) {
                    document.getElementById("eventSpecificDate").value = parts[2] + "-" + parts[1] + "-" + parts[0];
                }
            } else {
                document.getElementById("eventRepeatMode").value = "weekly";
                document.getElementById("eventDayOfWeek").value = props.dayKey || "mon";
            }
            
            allDayKeys.forEach(key => {
                let chk = document.getElementById("check" + key.charAt(0).toUpperCase() + key.slice(1));
                if (chk) chk.checked = (key === props.dayKey);
            });

            document.getElementById("eventStartTime").value = props.startTime || "";
            document.getElementById("eventEndTime").value = props.endTime || "";
            let fVal = props.fee || (studentRow && studentRow.fee) || 500000;
            document.getElementById("eventFee").value = formatNumberWithDots(fVal);
            document.getElementById("eventNotes").value = props.notes || "";

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

        // Phím Esc: đóng hộp thoại đang mở (ưu tiên lớp trên cùng)
        document.addEventListener('keydown', function(e) {
            if (e.key !== 'Escape') return;
            let rec = document.getElementById('recurrenceDialogOverlay');
            let modal = document.getElementById('eventModalOverlay');
            if (rec && rec.classList.contains('active')) { cancelRecurrenceChange(); return; }
            if (modal && modal.classList.contains('active')) { closeModalForce(); return; }
            if (activeFcEvent) closeDetailModalForce();
        });

        // Lưu dữ liệu vào thời khóa biểu (Giữ cấu trúc các ô lịch của giao diện)
        function saveEvent(e) {
            e.preventDefault();

            if (savingCalendar) return;
            let studentIdx = document.getElementById("eventStudentIndex").value;
            let subIdxStr  = document.getElementById("eventSubIndex").value;
            let oldDayKey = document.getElementById("eventOldDay").value;
            
            let repeatMode = document.getElementById("eventRepeatMode").value;
            let startTime = document.getElementById("eventStartTime").value;
            let endTime = document.getElementById("eventEndTime").value;
            let notes = document.getElementById("eventNotes").value.trim().replace(/\|/g, '｜').replace(/ SKIP /g, ' skip ');

            if (endTime <= startTime) return showWebAlert('Giờ kết thúc phải sau giờ bắt đầu.');
            if (repeatMode === 'none' && !document.getElementById('eventSpecificDate').value)
                return showWebAlert('Vui lòng chọn ngày dạy.');
            if (repeatMode === 'custom' && !document.querySelector('.day-checkbox-grid input:checked'))
                return showWebAlert('Vui lòng chọn ít nhất một ngày trong tuần.');
            let timeVal = startTime + ' - ' + endTime;
            
            let targetStudentIdx;
            let studentSelectValue = document.getElementById("eventStudent").value;
            
            if (studentIdx === "") {
                if (studentSelectValue === "other") {
                    let customName = document.getElementById("eventCustomStudentName").value.trim();
                    if (!customName) {
                        showToast("Vui lòng nhập tên học sinh mới!", "warning");
                        return;
                    }
                    
                    // Kiểm tra xem đã có học sinh này trong tutorScheduleSheetData chưa
                    let existingIdx = tutorScheduleSheetData.findIndex(r => r.studentName.toLowerCase() === customName.toLowerCase());
                    if (existingIdx !== -1) {
                        targetStudentIdx = existingIdx;
                    } else {
                        // Thêm hàng giả lập mới
                        let newRow = {
                            studentName: customName,
                            color: "#8E4DFF",
                            mon: "", tue: "", wed: "", thu: "", fri: "", sat: "", sun: ""
                        };
                        tutorScheduleSheetData.push(newRow);
                        targetStudentIdx = tutorScheduleSheetData.length - 1;
                        loadStudentOptions();
                    }
                } else {
                    targetStudentIdx = parseInt(studentSelectValue);
                }
            } else {
                targetStudentIdx = parseInt(studentIdx);
            }
            
            if (isNaN(targetStudentIdx) || !tutorScheduleSheetData[targetStudentIdx]) return;
            let row = tutorScheduleSheetData[targetStudentIdx];

            let feeInputVal = parseInt(String(document.getElementById("eventFee").value).replace(/\D/g, ''), 10);
            if (!isNaN(feeInputVal) && feeInputVal >= 0) {
                row.fee = feeInputVal;
            }

            // Đọc màu sắc và scope được chọn
            let selectedColor = document.getElementById("eventColor").value;
            let scope = document.getElementById("colorScope").value;

            if (scope === "student" && selectedColor) {
                row.color = selectedColor;
                
            }

            let colorPrefix = (scope === "session" && selectedColor) ? ("[C:" + selectedColor + "] ") : "";

            // === Hàm helper: cập nhật 1 slot cụ thể trong ô multi-slot ===
            // Khi SỬA: chỉ thay tại chỗ nếu cùng ô với slot cũ; khác ô thì append (slot cũ được xóa riêng)
            let isEditing = (studentIdx !== "" && subIdxStr !== "");
            let editIdx = isEditing ? parseInt(subIdxStr) : -1;
            let oldSlotConsumed = false;
            let replacedInPlace = false;
            function updateSlotInCell(dayKey, newSlotVal, keepSkips) {
                let slots = cellToSlots(row[dayKey]);
                if (isEditing && !oldSlotConsumed && dayKey === oldDayKey && editIdx >= 0 && editIdx < slots.length) {
                    if (keepSkips) {
                        let oldParts = splitSlotParts(slots[editIdx]);
                        if (!/^(\d{2}\/|RESCHEDULE)/.test(oldParts.body) && oldParts.skips.length) {
                            let newParts = splitSlotParts(newSlotVal);
                            newParts.skips = oldParts.skips;
                            newSlotVal = joinSlotParts(newParts);
                        }
                    }
                    slots[editIdx] = newSlotVal;
                    oldSlotConsumed = true;
                    replacedInPlace = true;
                } else {
                    slots.push(newSlotVal);
                }
                row[dayKey] = slots.join(" | ");
            }
            function removeOldSlot() {
                if (isEditing && !oldSlotConsumed && oldDayKey) {
                    let slots = cellToSlots(row[oldDayKey]);
                    if (editIdx >= 0 && editIdx < slots.length) slots.splice(editIdx, 1);
                    row[oldDayKey] = slots.join(" | ");
                    oldSlotConsumed = true;
                }
            }

            if (repeatMode === "none") {
                let specDate = document.getElementById("eventSpecificDate").value; 
                if (specDate) {
                    let dParts = specDate.split("-");
                    let datePrefix = dParts[2] + "/" + dParts[1] + "/" + dParts[0] + ": ";
                    
                    let finalVal = colorPrefix + datePrefix + timeVal;
                    if (notes !== "") finalVal += " (" + notes + ")";

                    let tempDate = parseYMDLocal(specDate);
                    let targetDayKey = revDayMap[tempDate.getDay()];

                    // Nếu đổi ngày (khác ô), xóa slot cũ khỏi ô cũ
                    if (oldDayKey !== targetDayKey) removeOldSlot();
                    updateSlotInCell(targetDayKey, finalVal);
                }
            }
            else if (repeatMode === "weekly") {
                // Lặp hàng tuần
                let finalVal = colorPrefix + timeVal;
                if (notes !== "") finalVal += " (" + notes + ")";
                let dayKey = document.getElementById("eventDayOfWeek").value;
                // Nếu đổi sang ngày khác, xóa slot cũ khỏi ô cũ
                if (oldDayKey !== dayKey) removeOldSlot();
                updateSlotInCell(dayKey, finalVal, true);
            } 
            else if (repeatMode === "daily") {
                // Lặp hàng ngày: thêm ca vào tất cả các ngày (giữ nguyên các ca khác)
                let finalVal = colorPrefix + timeVal;
                if (notes !== "") finalVal += " (" + notes + ")";
                allDayKeys.forEach(key => updateSlotInCell(key, finalVal, true));
                removeOldSlot();
            } 
            else if (repeatMode === "custom") {
                // Tùy chỉnh
                let finalVal = colorPrefix + timeVal;
                if (notes !== "") finalVal += " (" + notes + ")";
                allDayKeys.forEach(key => {
                    let isChecked = document.getElementById("check" + key.charAt(0).toUpperCase() + key.slice(1)).checked;
                    if (isChecked) updateSlotInCell(key, finalVal, true);
                });
                // Ngày cũ không được chọn → xóa slot cũ
                removeOldSlot();
            }

            // Xác định mode và target day key sau khi cập nhật data
            let isNewEvent = (studentIdx === "");
            let finalTargetKey = oldDayKey; // fallback
            if (repeatMode === "none") {
                let specDate2 = document.getElementById("eventSpecificDate").value;
                if (specDate2) finalTargetKey = revDayMap[parseYMDLocal(specDate2).getDay()];
            } else if (repeatMode === "weekly") {
                finalTargetKey = document.getElementById("eventDayOfWeek").value;
            }

            // subIdx: giữ nguyên nếu thay tại chỗ, ngược lại là index cuối sau khi append
            let newSubIdx = (replacedInPlace && finalTargetKey === oldDayKey)
                ? editIdx
                : cellToSlots(row[finalTargetKey]).length - 1;

            let _oldFcEvent = isNewEvent ? null : activeFcEvent;
            let _mode = isNewEvent ? 'add' : 'replace';
            if (repeatMode === 'daily' || repeatMode === 'custom') _mode = 'full'; // thêm nhiều ngày

            saveAndRefetch(row.studentName, function() {
                closeModalForce();
            }, _mode, { studentIdx: targetStudentIdx, dayKey: finalTargetKey, subIdx: newSubIdx }, _oldFcEvent);
        }

        // Xóa ca học cố định hoặc một lần (hỗ trợ multi-slot)
        function deleteEvent() {
            let studentIdx = parseInt(document.getElementById("eventStudentIndex").value);
            let subIdxStr  = document.getElementById("eventSubIndex").value;
            let oldDayKey = document.getElementById("eventOldDay").value;
            let repeatMode = document.getElementById("eventRepeatMode").value;
            let specDate = document.getElementById("eventSpecificDate").value;

            if (!isNaN(studentIdx) && tutorScheduleSheetData && tutorScheduleSheetData[studentIdx]) {
                let row = tutorScheduleSheetData[studentIdx];
                let sName = row.studentName;
                showWebConfirm("Bạn có chắc chắn muốn xóa ca học này của <b>" + escapeHtml(sName) + "</b> không?", function() {
                    let deleted = false;
                    // Nếu là ca một lần (có ngày cụ thể)
                    if (repeatMode === "none" && specDate) {
                        let parts = specDate.split("-");
                        if (parts.length === 3) {
                            let dateStrVN = parts[2] + "/" + parts[1] + "/" + parts[0];
                            allDayKeys.forEach(dk => {
                                let val = row[dk] || "";
                                if (val.includes(dateStrVN)) {
                                    let slots = val.split("|").map(s => s.trim()).filter(s => !s.includes(dateStrVN));
                                    row[dk] = slots.join(" | ");
                                    deleted = true;
                                }
                            });
                        }
                    }
                    if (!deleted && oldDayKey && oldDayKey !== "") {
                        let existing = row[oldDayKey] || "";
                        if (subIdxStr !== "" && !isNaN(parseInt(subIdxStr))) {
                            let slots = existing.split("|").map(s => s.trim());
                            let idx = parseInt(subIdxStr);
                            if (idx >= 0 && idx < slots.length) {
                                slots.splice(idx, 1);
                                row[oldDayKey] = slots.filter(s => s !== "").join(" | ");
                            } else {
                                row[oldDayKey] = "";
                            }
                        } else {
                            row[oldDayKey] = "";
                        }
                    }
                    
                    cleanupEmptyTrialStudent(sName);

                    closeModalForce();
                    saveAndRefetch(sName, null, 'full');
                });
            }
        }

        // PRESET_COLORS đã được khai báo ở đầu script, giữ fallback nếu chưa có
        if (typeof PRESET_COLORS === 'undefined') {
            window.PRESET_COLORS = [
                '#8E4DFF', '#10B981', '#F59E0B', '#3B82F6', '#EC4899', '#6366F1',
                '#D4E7B5', '#DFD6F2', '#F9D5CA', '#BDD7EE', '#FDE8B3', '#6D675E',
                '#4D9EFF', '#00D2FC', '#4DFFC3', '#4CAF50', '#AEEA00', '#FFD23F'
            ];
        }

        function initColorPickerSwatches() {
            let container = document.getElementById("colorSwatches");
            if (!container) return;
            container.innerHTML = "";
            PRESET_COLORS.forEach(color => {
                let swatch = document.createElement("button");
                swatch.type = 'button';
                swatch.setAttribute('aria-label', 'Màu ' + color);
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



/* The original calendar groups slots into one row per student. Each displayed
   slot maps to a scoped SQLite schedule ID. The REST API stores real dates,
   weekdays and times so that the dashboard can read the same schedules. */
const escapeHtml = Lab.escape;
const fixVietnameseMojibake = value => String(value ?? '');
const showToast = (message, type) => showWebAlert(escapeHtml(message), type);
const embeddedCalendar = window.parent !== window || /^(1)$/.test(new URLSearchParams(location.search).get('embed'));
let tutorScheduleSheetData = [];
let dashboardData;
let storedSlots = new Map();
let savingCalendar = false;

function applyTheme(name) {
    Lab.theme(name || 'theme-azure-mist-minimal');
    document.documentElement.classList.toggle('is-embedded-calendar', embeddedCalendar);
    document.body.classList.toggle('is-embedded-calendar', embeddedCalendar);
}

function applyCustomTheme(silent, color) {
    if (/^#[0-9a-f]{6}$/i.test(color)) {
        document.documentElement.style.setProperty('--color-primary', color);
    }
}

function openThemeSwitcher() { document.getElementById('themeSwitcherPanel').style.display='block'; }
function closeThemeSwitcher() { document.getElementById('themeSwitcherPanel').style.display='none'; }

function slotKey(row, day, raw) {
    return JSON.stringify([day,raw,row.color,row.fee]);
}

function calendarRow(name, id, color, fee) {
    return {studentName:name, studentId:id, color, fee, ...Object.fromEntries(allDayKeys.map(k=>[k,'']))};
}

function readSlot(sc, row) {
    const lines = (sc.note || '').split('\n');
    const skip = lines.find(l => /^Nghỉ ngày: [\d/, ]+$/.test(l));
    const color = lines.find(l => /^Màu học sinh: #[\da-fA-F]{6}$/.test(l));
    const fee = lines.find(l => /^Học phí theo lịch: \d+ đ$/.test(l));
    const moved = lines.includes('Buổi đã dời lịch.');
    if (color) row.color = color.slice(-7);
    if (fee) row.fee = Number(fee.match(/\d+/)[0]);
    const notes = lines.filter(l => l!==skip && l!==color && l!==fee && l!=='Buổi đã dời lịch.').join(' ').replace(/\|/g,'｜');
    const prefix = sc.date ? (moved?'RESCHEDULE ':'') + Lab.date(sc.date) + ': ' : '';
    const suffix = skip ? ' SKIP ' + skip.slice('Nghỉ ngày: '.length) : '';
    const stamp = (sc.color && sc.color!==row.color) ? '[C:'+sc.color+'] ' : '';
    return stamp + prefix + sc.start_time + ' - ' + sc.end_time + (notes ? ' (' + notes + ')' : '') + suffix;
}

async function loadCalendarData() {
    try {
        dashboardData = await Lab.dashboard(['tutor','admin']);
        if (!dashboardData) return false;
        applyTheme(dashboardData.user.theme);
        const students = Lab.live(dashboardData.students);
        const slots = Lab.live(dashboardData.schedules);
        const roster = new Map();
        for (const [index,student] of students.entries()) {
            const sameName = students.some(other=>other.id!==student.id && other.name===student.name);
            const name = sameName ? student.name+' ('+student.login+')' : student.name;
            const firstSlot = slots.find(s=>s.student_id===student.id);
            roster.set(student.id,calendarRow(name,student.id,firstSlot?.color || PRESET_COLORS[index % PRESET_COLORS.length],student.tuition));
        }
        const rowSlots = new Map();
        for (const sc of slots) {
            const key = sc.student_id || 'trial:'+sc.tutor_id+':'+(sc.subject||'Ca dạy chung');
            if (sc.student_id && !roster.has(key)) continue;
            if (!roster.has(key)) roster.set(key,calendarRow(sc.subject||'Ca dạy chung',null,sc.color,0));
            const r = roster.get(key);
            r.tutorId = sc.tutor_id;
            r.subject = sc.student_id ? (sc.subject || 'Gia sư 1-1') : 'Học thử';
            const day = sc.date ? revDayMap[parseYMDLocal(sc.date).getDay()] : allDayKeys[sc.weekday-1];
            if (!day) continue;
            const raw = readSlot(sc,r);
            r[day] = r[day] ? r[day]+' | '+raw : raw;
            if (!rowSlots.has(r.studentName)) rowSlots.set(r.studentName,[]);
            rowSlots.get(r.studentName).push({id:sc.id,day,raw,subject:sc.subject});
        }
        tutorScheduleSheetData = [...roster.values()];
        storedSlots = new Map(tutorScheduleSheetData.map(r=>[r.studentName,(rowSlots.get(r.studentName)||[]).map(s=>({
            ...s,key:slotKey(r,s.day,s.raw)
        }))]));
        loadStudentOptions();
        renderSheetTable();
        if (calendar) { calendar.refetchEvents(); updateMonthBottomBar(calendar.view); }
        return true;
    } catch (err) {
        showWebAlert(escapeHtml(err.message),'error');
        return false;
    }
}

function fieldsForSlot(row, day, raw, existing) {
    const {body,color,skips} = splitSlotParts(raw);
    const parts = body.match(/^(?:(RESCHEDULE )?(\d{2}\/\d{2}\/\d{4}):\s*)?(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\s*(.*)$/);
    if (!parts || parts[3].padStart(5,'0') >= parts[4].padStart(5,'0')) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.');
    const [,moved,dmy,start,end,note] = parts;
    const notes = [note.replace(/^\((.*)\)$/,'$1')];
    if (skips.length) notes.push('Nghỉ ngày: '+skips.join(','));
    if (moved) notes.push('Buổi đã dời lịch.');
    const ownColor = color.match(/#[\da-f]{6}/i)?.[0];
    if (ownColor) notes.push('Màu học sinh: '+row.color);
    const tuition = dashboardData.students.find(s=>s.id===row.studentId)?.tuition || 0;
    if (row.fee !== tuition) notes.push('Học phí theo lịch: '+row.fee+' đ');
    return {
        student_id:row.studentId || null, tutor_id:row.tutorId || (dashboardData.user.role==='admin' ? Lab.live(dashboardData.tutors)[0]?.id : dashboardData.user.id),
        weekday:dmy?null:allDayKeys.indexOf(day)+1, date:dmy?dmy.split('/').reverse().join('-'):null,
        start_time:start.padStart(5,'0'),end_time:end.padStart(5,'0'),
        subject:row.studentId ? (existing?.subject || row.subject || 'Gia sư 1-1') : row.studentName,
        color:ownColor || row.color || PRESET_COLORS[0],
        note:notes.filter(Boolean).join('\n')
    };
}

async function saveAndRefetch(studentName, done) {
    if (savingCalendar) return;
    savingCalendar = true;
    const row = tutorScheduleSheetData.find(r=>r.studentName===studentName);
    const previous = [...(storedSlots.get(studentName) || [])];
    const changes = [];
    try {
        showSyncToast('pending');
        if (row) {
            for (const day of allDayKeys) {
                for (const raw of cellToSlots(row[day])) {
                    const key = slotKey(row,day,raw);
                    const match = previous.findIndex(s=>s.key===key);
                    if (match>=0) previous.splice(match,1);
                    else changes.push({day,raw});
                }
            }
        }
        // Validate every new slot before issuing any writes.
        const operations = changes.map((c,i)=>({
            id:previous[i]?.id, fields:fieldsForSlot(row,c.day,c.raw,previous[i])
        }));
        for (const op of operations) {
            await Lab.request(op.id?'schedules/'+op.id:'schedules',op.id?'PATCH':'POST',op.fields);
        }
        for (const stale of previous.slice(changes.length)) await Lab.request('schedules/'+stale.id,'DELETE');
        if (done) done();
        showSyncToast('success');
        if (embeddedCalendar) window.parent.postMessage({type:'tutorScheduleUpdated'},location.origin);
    } catch (err) {
        showSyncToast('error');
        showWebAlert(escapeHtml(err.message),'error');
    } finally {
        await loadCalendarData();
        savingCalendar = false;
    }
}

function cleanupEmptyTrialStudent(studentName) {
    const row = tutorScheduleSheetData.find(r=>r.studentName===studentName);
    if (!row || row.studentId || allDayKeys.some(day=>cellToSlots(row[day]).length)) return;
    tutorScheduleSheetData = tutorScheduleSheetData.filter(r=>r!==row);
}

function ztGetLessonLog(name, date) {
    const row = tutorScheduleSheetData.find(r=>r.studentName===name);
    return row && Lab.live(dashboardData.lessons).find(l=>l.student_id===row.studentId && l.date===date);
}

function ztUpdateDetailLinks(props) {
    const r=tutorScheduleSheetData[props.studentIndex];
    const box=document.getElementById('detailLinkActions');
    box.style.display=r?.studentId?'':'none';
    if (!r?.studentId) return;
    const log=ztGetLessonLog(r.studentName,props.date);
    Lab.text('detailLessonStatus',log?'Đã ghi nhật ký · '+log.status:'Chưa ghi nhật ký buổi này');
    document.querySelector('#btnDetailLesson span').textContent=log?'Xem nhật ký':'Ghi buổi học';
}

function openTutorTab(tab) {
    const props = activeFcEvent?.extendedProps;
    const studentId = props && tutorScheduleSheetData[props.studentIndex]?.studentId;
    if (!studentId) return;
    const params = new URLSearchParams({tab,student:String(studentId),date:props.date});
    (embeddedCalendar?parent:window).location.assign('/tutor-dashboard.html?'+params.toString());
}
function ztDetailOpenStudent() { openTutorTab('students'); }
function ztDetailOpenLesson() { openTutorTab('diary'); }
window.ztReloadScheduleFromServer = loadCalendarData;
