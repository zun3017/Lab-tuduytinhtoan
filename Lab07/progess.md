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

## Cập nhật giao diện sau khi đối chiếu bản gốc

- Đã đối chiếu theo nội dung tệp. Cả 8 stylesheet dùng khi chạy và nguồn Tailwind trong tools/tw-input.css đều trùng từng byte với ZunTutor gốc. 10 trang HTML lấy bố cục từ mã nguồn gốc, có điều chỉnh để dùng dữ liệu và tài nguyên cục bộ.
- Đã khôi phục các vùng đăng nhập, thiết lập quản trị, vùng chọn tệp trên điện thoại, hộp thoại gia sư và lịch. Hóa đơn dùng lại kiểu chữ Plus Jakarta Sans. Đã sửa hai thẻ textarea đóng sai khiến trình duyệt nuốt phần còn lại của bảng điều khiển gia sư.
- Đã chạy 19 ca unittest, tất cả đạt. Đã mở 10 trang trên Chromium ở 1440 px và 390 px với SQLite tạm, dùng đúng phiên đăng nhập cho từng vai trò. Cả 20 lượt tải trang đều không ghi nhận ngoại lệ JavaScript hoặc thông báo lỗi từ ứng dụng.
- Ảnh chụp mới của bảng điều khiển nằm tại docs/evidence/tutor-dashboard-restored.png. Một số hộp thoại và các thao tác với dữ liệu dùng bộ điều khiển riêng của Lab07. Chưa xác nhận giao diện trùng từng pixel hoặc đã bấm qua mọi hộp thoại. Cuộc gọi Google thật vẫn chờ khóa.
- Lịch tháng gia sư: đã bỏ phần nối ghi chú sau tên học sinh. Đã chạy kiểm tra hàm hiển thị với ca 17:30 của Mai Khánh Tường.
- Biểu đồ doanh thu gia sư đã dùng lại cấu hình biểu đồ đường của ZunTutor gốc, gồm nền chuyển sắc và số tiền trên từng điểm. Đã xác minh bằng Chromium cho cả ba kỳ 3, 6 và 12 tháng.

## 26/11/2026 · Đối chiếu giao diện sau khi nạp dữ liệu

- Trang học sinh đã dùng lại hàm dựng thẻ chào, thông báo, biểu đồ điểm, hai biểu đồ tròn, so sánh đầu/cuối kỳ, bảng nhật ký desktop và thẻ mở rộng mobile của nguồn ZunTutor. Bộ chuyển dữ liệu đọc từ API Lab07.
- Cổng bài tập đã dùng lại biểu đồ đường cho số bài nộp theo tuần và biểu đồ tròn phân loại hạn nộp. Cổng quản trị đã khôi phục cấu hình biểu đồ sáu tháng. Cổng gia sư dùng lại bảng chọn theme, dropdown, bố cục thẻ học sinh và mẫu báo cáo tiến độ của nguồn gốc.
- Đã kiểm tra thực tế 10 trang ở 1440 px và 390 px với DB tạm. Đã thử chọn theme, chọn tháng học phí, mở hộp thoại quản trị, lọc báo cáo sang khoảng không có dữ liệu rồi khôi phục, xuất ảnh PNG thành công. 19/19 kiểm thử tự động đạt.
- Minh chứng: docs/evidence/student-dashboard-1440.png, docs/evidence/student-dashboard-390.png và docs/evidence/tutor-report-restored.png. Chưa so sánh từng pixel hoặc kiểm thử mọi trạng thái hộp thoại của tất cả các trang.

## 26/11/2026 · PH/HS và Bài tập

- Đã bỏ ô PIN ở hai cổng. PH/HS tra cứu bằng mã học sinh hoặc số điện thoại phụ huynh. Cổng Bài tập dùng mã bài tập riêng.
- Đã gỡ thẻ “Tổng kết học phí kỳ học” trong ảnh 2 khỏi bảng điều khiển học sinh.
- Đã đưa mẫu “Bài tập được giao” và “Lịch sử nộp bài” từ ZunTutor vào trang Bài tập, nối các nút với dữ liệu Lab07. Bài chưa nộp có nút Nộp bài, bài đã nộp có nhãn trạng thái. Lịch sử dùng bảng trên máy tính và từng mục mở rộng trên điện thoại.
- Đã kiểm tra hai cổng từ phiên mới bằng Chromium ở 1440 px và 390 px, gồm tra cứu bằng mã và điện thoại, xem đề, mở lịch sử trên điện thoại và kiểm tra giới hạn truy cập hóa đơn bằng mã bài tập. Cả 19 kiểm thử tự động đều đạt. Ảnh đối chiếu tại docs/evidence/homework-lists-restored.png.
- Ba chỉnh sửa trong yêu cầu này đã hoàn tất. Chưa đối chiếu từng pixel của toàn bộ website.

- Đã bỏ bộ chọn ngôn ngữ bị chèn thêm vào góc phải lịch gia sư. Đã kiểm tra bằng Chromium khi mở mục Lịch dạy từ bảng điều khiển: khung lịch không còn nút trùng và menu ngôn ngữ chính mở bình thường.

- Đã tích hợp TranslateAPI (translateapi.ai), khóa lưu trong .env, ưu tiên khi có TRANSLATEAPI_KEY. Đã gọi thật dịch “Xin chào” sang tiếng Anh và nhận “Hello.”. Kết quả dịch được lưu SQLite theo từng mục để tái sử dụng. Lần đầu dịch toàn bộ giao diện có thể lâu do gọi từng mục. Chưa xác minh bản dịch toàn trang.

- Đã thay gửi từng đoạn sang endpoint translate/batch của TranslateAPI, tối đa 100 đoạn/lô theo tài liệu. Gửi một lô rồi kiểm tra trạng thái job. Giữ ánh xạ từng đoạn với vị trí trên giao diện và cache SQLite. Sáu kiểm thử phần dịch hiện có đạt.

- Đã giới hạn dịch API vào student-dashboard và homework sau đăng nhập. Gỡ script dịch ở các trang khác và bộ chọn trang chủ. API kiểm tra phiên, vai trò và trang; chỉ gửi danh mục của trang được chọn. Đã kiểm tra hai cổng ở 1440/390 px và kiểm tra API chưa đăng nhập bị chặn, endpoint dịch trang chủ tắt, danh mục không chứa nội dung các trang gia sư/quản trị.

- Đã sửa vị trí Language vào thanh công cụ PH/HS và đầu phần Bài tập sau đăng nhập. Đổi cơ chế từ danh mục cố định sang thu thập chữ thực tế, thuộc tính hướng dẫn, nội dung động và nhãn Chart.js. API nhận danh sách chữ đã xác thực phiên, giới hạn kích thước và cache theo hash. Nội dung người dùng được gửi đến TranslateAPI khi chọn dịch. Đã kiểm tra bằng Chromium ở desktop/mobile với API mô phỏng, gồm nội dung mới và khôi phục tiếng Việt; chưa kiểm chứng chất lượng dịch thật toàn trang.

- Đã gỡ nút Tải App, hộp hướng dẫn cài đặt và mã xử lý nút khỏi trang chủ. Đã kiểm tra cú pháp JavaScript.

- Đã sửa khung Language chỉ rộng theo nút, menu bám ngay bên dưới thay vì bung sang mép phải. Bổ sung bản dịch tiếng Anh cố định cho thuật ngữ bài tập để tránh dịch sai thành cards/payment/folder; phần nội dung còn lại vẫn dùng API. Đã kiểm tra lại luồng đổi ngôn ngữ và nội dung động với phản hồi API mô phỏng.

- Đã chuyển toàn bộ nhãn và nội dung từ database đang hiển thị sang luồng API, bỏ bảng dịch tiếng Anh cố định. Dịch cả tooltip biểu đồ. API thật đã dịch thành công lịch sử tên bài trên cổng Bài tập; ảnh docs/evidence/homework-api-en.png. Khi kiểm tra PH/HS, TranslateAPI trả HTTP 402 (cần kiểm tra số dư/hạn mức), nên chưa xác minh hoàn tất trang này. Đã xử lý 402 thành thông báo hạn mức rõ ràng.

- Đã thay khóa TranslateAPI theo yêu cầu và xác minh ứng dụng đọc đúng cấu hình từ .env.

- Đã tái hiện dịch tiếng Nhật bằng khóa mới: TranslateAPI trả HTTP 402. Sửa lỗi áp bản dịch khi nội dung mới chưa có kết quả: chỉ áp khi toàn bộ mục hiện tại đủ bản dịch. Khi API lỗi, khôi phục toàn bộ bản gốc và mã VI, báo lỗi rõ ràng để tránh trang nửa Nhật nửa Việt. Đã kiểm tra lại luồng dịch/nội dung động bằng API mô phỏng; dịch thật vẫn bị chặn bởi HTTP 402.

- Đã xác định nguyên nhân ảnh chỉ dịch một số tiêu đề: tiến trình Flask cổng 5000 chạy mã cũ, endpoint bỏ qua texts và trả danh mục cố định. Đã khởi động lại đúng tiến trình, xác minh endpoint trên localhost:5000 nhận và trả đúng nội dung truyền vào. Phiên kiểm tra API thật trước đó trả HTTP 402 với khóa mới; vẫn cần giải quyết hạn mức dịch vụ để dịch đầy đủ.

- Đã thay khóa TranslateAPI mới theo yêu cầu, xác minh cấu hình và khởi động lại Flask để nạp khóa.

- Đã thêm nhà cung cấp Gemini qua Google AI API, chọn Gemini 3.1 Flash-Lite sau khi model 2.5 trả 404. Khóa lưu trong .env, TRANSLATION_PROVIDER=gemini. Đã gọi dịch thật thành công, cache Gemini có namespace riêng. Đã nạp lại Flask cổng 5000. Luồng dịch theo lô yêu cầu JSON cùng số lượng/vị trí, có chỉ dẫn thuật ngữ giáo dục.

- Đã chuyển bản nộp sang Google Cloud Translation v2, gỡ nhà cung cấp thử nghiệm. Đã kiểm tra DB mới, đăng nhập, hợp đồng Google API mô phỏng, cache và 8 kiểm thử nghiệp vụ trước khi xóa tests. README có hướng dẫn cài mới. Google API thật cần khóa hợp lệ. Giữ ảnh minh chứng sau khi kiểm duyệt chặn xóa gộp; ZIP mã nguồn loại trừ toàn bộ tệp thử và dữ liệu cục bộ.

- Đã đối chiếu PDF đề, cập nhật báo cáo Markdown/PDF 3 trang, khai báo AI, lịch sử Git thật (915fa5e), kịch bản quay bổ sung và video demo.webm. Đã kiểm tra bố cục PDF. Video ghi rõ thiếu khóa Cloud Translation, chưa minh chứng dịch Google thật. Cần thông tin sinh viên, khóa hợp lệ và commit thay đổi hiện tại trước khi nộp.
