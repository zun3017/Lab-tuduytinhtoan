'use strict';

async function displayInvoice() {
    const query = new URLSearchParams(location.search);
    const data = await Lab.request('dashboard');
    const role = data.user.role;
    Lab.id('backLink').href = '/' + (Lab.roles[role] || 'tutor-login') + '.html';
    const studentId = query.get('id') || (role === 'student' ? data.user.id : data.students[0]?.id);
    if (!studentId || !/^\d+$/.test(String(studentId))) throw new Error('Chưa chọn học sinh để xem hóa đơn.');
    const month = query.get('month') || '';
    const bill = await Lab.request('invoices/' + studentId + (month ? '?month=' + encodeURIComponent(month) : ''));
    const {student, lessons, assignments = [], submissions = []} = bill;
    const absent = lessons.filter(l => /nghỉ|vắng/i.test(l.status));
    const makeup = lessons.filter(l => /bù/i.test(l.status));
    const turnedIn = new Set(submissions.map(s => s.assignment_id));
    const missing = assignments.filter(a => !turnedIn.has(a.id));
    const late = assignments.filter(a => a.due_date && submissions.some(s =>
        s.assignment_id === a.id && s.submitted_at.slice(0,10) > a.due_date));
    Lab.text('invStudentName', student.name);
    Lab.text('invMonthDisplay', month ? 'Kỳ học ' + month.split('-').reverse().join('/') : 'Tất cả kỳ học');
    Lab.text('invAttP', lessons.length - absent.length);
    Lab.text('invAttA', absent.length);
    Lab.text('invAttB', makeup.length);
    Lab.text('invAbsentDates', absent.length ? 'Ngày nghỉ · ' + absent.map(l => Lab.date(l.date)).join(', ') : '');
    Lab.text('invHwDone', assignments.length - missing.length);
    Lab.text('invHwMiss', missing.length);
    Lab.text('invHwLate', late.length);
    Lab.text('invHwMissDates', missing.length ? 'Chưa nộp · ' + missing.map(a => a.title).join(', ') : '');
    Lab.text('invFeeUnitLabel', 'Đã thanh toán');
    Lab.text('invFeeUnitValue', Lab.money(bill.paid));
    Lab.text('invFeeCalcText', 'Còn phải thu');
    Lab.text('invFeeCalcTotal', Lab.money(bill.balance));
    Lab.text('invGrandTotal', Lab.money(bill.total));
    Lab.text('invTextarea', 'Kính gửi gia đình ' + student.name + ', tổng học phí trong kỳ là '
        + Lab.money(bill.total) + '. Số tiền còn lại là ' + Lab.money(bill.balance) + '.');
    Lab.id('invoiceStatus').hidden = true;
    Lab.id('invoiceElement').hidden = false;
    Lab.id('printInvoice').disabled = false;
    Lab.id('printInvoice').onclick = () => window.print();
    const save = Lab.id('saveImage');
    save.disabled = false;
    save.onclick = Lab.guard(async () => {
        save.disabled = true;
        try {
            await document.fonts.ready;
            const canvas = await html2canvas(Lab.id('invoiceElement'), {scale: 2, logging: false});
            const link = document.createElement('a');
            link.download = 'Hoa-don-' + student.login + (month ? '-' + month : '') + '.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        } finally {
            save.disabled = false;
        }
    });
}

displayInvoice().catch(error => {
    const status = Lab.id('invoiceStatus');
    if (error.status === 401) {
        status.textContent = 'Đăng nhập để xem hóa đơn. ';
        const link = document.createElement('a');
        link.href = '/tutor-login.html?next=' + encodeURIComponent('preview-invoice.html' + location.search);
        link.textContent = 'Đăng nhập';
        status.append(link);
    } else {
        status.textContent = error.message;
    }
});
