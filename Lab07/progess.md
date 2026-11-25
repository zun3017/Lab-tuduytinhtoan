# Tiến độ ZunTutor Lab07

Ngày làm việc 25/11/2026. Thư mục triển khai là `Lab07`. Mã ZunTutor gốc chỉ dùng để đối chiếu. Tệp này phân biệt những thay đổi đã có trên đĩa với những luồng đã chạy kiểm thử.

## Đã hoàn thành

- **Backend Flask & SQLite (`server/`)**:
  - Đã hoàn thiện `server/domain.py` kết nối với `server/domain_store.py`, `server/schema.sql`, `server/seed.py`, `server/db.py`, `server/demo.py` và `server/translation.py`.
  - Hỗ trợ đầy đủ đăng nhập/đăng xuất/đăng ký gia sư/khôi phục PIN/truy cập mã bài tập, phân quyền 3 vai trò (`admin`, `tutor`, `student`) + chế độ `homework`, lưu tệp đính kèm và avatar dưới dạng BLOB (`GET /api/files/<id>`), giao dịch học phí nguyên tử (`PUT /api/lessons/payment`), hóa đơn (`GET /api/invoices/<id>`), lịch dạy và quản trị gia sư/trung tâm/cài đặt.
  - Đã khởi tạo cơ sở dữ liệu làm việc bằng `.\.venv\Scripts\python.exe app.py init-db --database instance\lab07.sqlite3`.
- **Giao diện các cổng theo vai trò (`public/js/`)**:
  - Đã hoàn thiện `public/js/tutor.js`, `public/js/calendar.js` và `public/js/admin.js` nối với các trang `tutor-dashboard.html`, `tutor-calendar.html` và `admin-dashboard.html` bên cạnh `api.js`, `login.js`, `homework.js`, `student.js`, `invoice.js`, `demo-calendar.js`, `homepage.js`, `navigation.js`.
  - Tất cả tài nguyên tĩnh (`Chart.js`, `FullCalendar`, `html2canvas`, `Cropper.js`, `Font Awesome`, `Inter`) phục vụ cục bộ từ `public/vendor/`.
- **Kiểm thử tự động (`tests/`)**:
  - Chạy `.\.venv\Scripts\python.exe -m unittest discover -s tests -v`: **18/18 ca đạt (`OK`)** trên `test_app.py`, `test_demo_calendar.py`, `test_domain_flows.py`, `test_domain_scope.py`, `test_portal_assets.py` và `test_translation.py`.
- **Kiểm thử trình duyệt thực tế (`Playwright + Microsoft Edge`)**:
  - Đã khởi động Flask với SQLite mới, kiểm tra trực tiếp trên trình duyệt: trang chủ desktop (1440×900) và mobile (390×844), thông báo thiếu khóa Google Dịch, cổng Gia sư (tạo bài tập và kiểm tra tồn tại sau khi khởi động lại server), Lịch dạy FullCalendar, Phiếu học tập/Hóa đơn, cổng Học sinh, cổng Nộp bài tập, cổng Quản trị viên và Lịch thực hành.
  - Xác nhận 0 lỗi JS/console ngoài HTTP `503` chủ đích khi thử dịch lúc chưa có API key và 0 yêu cầu mạng ra ngoài `127.0.0.1`.
  - Đã lưu ảnh minh chứng trong `docs/evidence/` (`home-desktop.png`, `home-mobile.png`, `tutor-dashboard.png`, `tutor-tuition.png`, `tutor-calendar.png`, `preview-invoice.png`, `student-dashboard.png`, `homework.png`, `admin-dashboard.png`, `demo-calendar.png`).
- **Tài liệu bàn giao**:
  - Đã tạo `README.md`, bảng đối chiếu chức năng `docs/feature-parity.md`, kịch bản quay demo 90–120 giây `docs/demo-script.md`, báo cáo `docs/report.md` và xuất PDF `docs/report.pdf` (đã kiểm tra trực quan 5 trang).

## Điều kiện còn thiếu

- Biến `GOOGLE_TRANSLATE_API_KEY` trong tệp `.env` của `Lab07` hiện chưa có giá trị (`len=0`).
- **Chưa xác minh cuộc gọi Google thật**. Các kiểm thử hiện tại đã xác nhận toàn bộ luồng logic, chia lô 128 mục, tái sử dụng cache SQLite, báo lỗi thiếu khóa (`503 missing_key`) và mô phỏng phản hồi lỗi của Google.
- **Việc cần làm khi có khóa thật**: Điền `GOOGLE_TRANSLATE_API_KEY` vào `Lab07/.env`, xóa cache cũ nếu cần bằng cách tạo DB mới (`init-db`), chạy `app.py run`, chuyển lần lượt `vi → en → ja → ko → en → vi` trên `index.html`, ghi nhận log `cache=miss source=google` và `cache=hit source=sqlite`, rồi quay video demo theo `docs/demo-script.md`.
