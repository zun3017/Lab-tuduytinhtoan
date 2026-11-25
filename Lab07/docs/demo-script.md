# Kịch bản quay demo ZunTutor Lab07 (90–120 giây)

## Chuẩn bị trước khi quay

1. Đảm bảo đã điền `GOOGLE_TRANSLATE_API_KEY` hợp lệ vào tệp `Lab07/.env` (giữ `.env` ngoài màn hình quay).
2. Khởi tạo lại một cơ sở dữ liệu sạch chưa có cache bản dịch để bước 2 gọi Google Cloud Translation thật:

```powershell
Remove-Item instance\lab07.sqlite3 -ErrorAction SilentlyContinue
.\.venv\Scripts\python.exe app.py init-db
.\.venv\Scripts\python.exe app.py run
```

3. Mở trình duyệt tới `http://127.0.0.1:5000/index.html` và mở sẵn cửa sổ terminal hiển thị log Flask (đã lọc khóa bí mật).

## Phân cảnh chi tiết

- **0:00 – 0:20 | Giới thiệu trang chủ & bộ chọn 🌐 Ngôn ngữ**
  - Mở `http://127.0.0.1:5000/index.html` ở giao diện tiếng Việt.
  - Chỉ nút **🌐 Ngôn ngữ VI** trên thanh điều hướng góc phải header, nhấn mở danh sách 4 ngôn ngữ (`Tiếng Việt`, `English`, `日本語`, `한국어`).
- **0:20 – 0:55 | Dịch toàn trang chủ qua Google Cloud Translation API v2 (Cache Miss)**
  - Chọn **English**, **日本語**, rồi **한국어**.
  - Giữ khung hình đủ rộng để thấy đồng thời thanh menu, tiêu đề hero, các nút CTA và cuộn xuống phần FAQ + chân trang đổi ngôn ngữ trọn vẹn.
  - Lướt nhanh sang terminal Flask để chỉ dòng log `homepage_translation target=ja cache=miss source=google ...` (không chứa API key).
- **0:55 – 1:15 | Kiểm tra Cache Hit trong SQLite & Responsive Mobile**
  - Chọn lại **English** (hoặc tải lại trang với `?lang=ja`), chỉ dòng log `homepage_translation target=en cache=hit source=sqlite ...`.
  - Quay về **Tiếng Việt** (`vi`) để thấy trang trở lại văn bản gốc ngay lập tức không gọi mạng.
  - Thu hẹp cửa sổ hoặc bật chế độ mobile trong DevTools (390×844) để trình diễn menu **🌐 Ngôn ngữ** trên di động.
- **1:15 – 1:50 | Chứng minh lưu trữ nghiệp vụ trong SQLite**
  - Mở cổng Gia sư (`tutor-login.html`), đăng nhập tài khoản mẫu `GS0701` / PIN `741963`.
  - Chuyển sang tab **Báo cáo** → nhấn **+ Giao bài tập mới**, nhập tiêu đề ngắn và lưu.
  - Tải lại trang (F5) để thấy bài tập mới vẫn hiển thị từ SQLite (và có thể mở cổng học sinh `HS0701` / `258147` tại `homework.html` để xác nhận học sinh nhận được bài ngay).
