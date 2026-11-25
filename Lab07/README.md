# ZunTutor Lab07 — Hướng dẫn cài đặt và sử dụng

**ZunTutor Lab07** là phiên bản chạy độc lập hoàn toàn trên máy cục bộ (`127.0.0.1`) bằng **Python (Flask)** và **SQLite**, giữ nguyên giao diện và đầy đủ các luồng nghiệp vụ của ZunTutor (Phụ huynh/Học sinh, Nộp bài tập, Gia sư, Lịch dạy, Hóa đơn, Quản trị viên), đồng thời tích hợp **Google Cloud Translation Basic v2** để chuyển đổi ngôn ngữ toàn trang chủ (`vi`, `en`, `ja`, `ko`) và lưu cache bản dịch trong SQLite.

---

## Mục lục

1. [Cấu trúc dự án](#1-cấu-trúc-dự-án)
2. [Cài đặt & Khởi chạy trên Windows](#2-cài-đặt--khởi-chạy-trên-windows)
3. [Tài khoản mẫu (dữ liệu hư cấu)](#3-tài-khoản-mẫu-dữ-liệu-hư-cấu)
4. [Hướng dẫn sử dụng từng phân hệ](#4-hướng-dẫn-sử-dụng-từng-phân-hệ)
5. [Cấu hình Google Cloud Translation API v2](#5-cấu-hình-google-cloud-translation-api-v2)
6. [Kiểm thử & Khắc phục sự cố](#6-kiểm-thử--khắc-phục-sự-cố)
7. [Tài liệu tham khảo kèm theo](#7-tài-liệu-tham-khảo-kèm-theo)

---

## 1. Cấu trúc dự án

```text
Lab07/
├── app.py                  # Điểm vào chạy máy chủ Flask hoặc khởi tạo SQLite
├── requirements.txt        # Thư viện Python (Flask, python-dotenv)
├── .env.example            # Mẫu biến môi trường (copy thành .env để điền API key)
├── server/                 # Toàn bộ logic phía máy chủ (trình duyệt không truy cập trực tiếp)
│   ├── __init__.py         # Cấu hình Flask, session, CSP, chặn cross-origin
│   ├── db.py               # Kết nối SQLite (PRAGMA foreign_keys=ON) & lệnh init-db
│   ├── schema.sql          # Lược đồ các bảng nghiệp vụ & view
│   ├── seed.py             # Bộ sinh dữ liệu mẫu hư cấu (idempotent)
│   ├── domain_store.py     # Bộ lọc phạm vi dữ liệu theo vai trò & kiểm tra đầu vào
│   ├── domain.py           # REST API đăng nhập, CRUD, tệp BLOB, học phí, hóa đơn, quản trị
│   ├── demo.py             # API lịch thực hành cô lập theo phiên khách
│   ├── translation.py      # API dịch trang chủ qua Google Translate v2 + cache SQLite
│   └── translation.sql     # Bảng homepage_translations
├── public/                 # Giao diện tĩnh và JS gọi API cục bộ
│   ├── index.html          # Trang chủ + bộ chọn 🌐 Ngôn ngữ
│   ├── student-login.html / student-dashboard.html
│   ├── homework.html
│   ├── tutor-login.html / tutor-dashboard.html / tutor-calendar.html
│   ├── admin-dashboard.html
│   ├── demo-calendar.html
│   ├── preview-invoice.html
│   ├── js/                 # JavaScript điều khiển từng trang
│   ├── css/                # Giao diện & 36 theme
│   └── vendor/             # Thư viện cục bộ (Chart.js, FullCalendar, html2canvas, Font Awesome, Inter)
├── instance/               # Nơi lưu file SQLite làm việc (tạo tự động, bỏ qua trong Git)
├── tests/                  # Bộ kiểm thử tự động unittest
└── docs/                   # Bảng đối chiếu, báo cáo MD/PDF, kịch bản demo & ảnh minh chứng
```

---

## 2. Cài đặt & Khởi chạy trên Windows

### Yêu cầu
- Windows với Python 3.9+ (trong thư mục `Lab07` đã có sẵn môi trường ảo `.venv` cài `Flask` và `python-dotenv`).
- Trình duyệt hiện đại (Microsoft Edge hoặc Google Chrome).

### Bước 1: Chuẩn bị môi trường (nếu chưa có `.venv` hoặc `.env`)

```powershell
# Nếu chưa có .venv:
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# Nếu chưa có .env:
Copy-Item .env.example .env
```

### Bước 2: Khởi tạo cơ sở dữ liệu SQLite

```powershell
.\.venv\Scripts\python.exe app.py init-db
```

- Mặc định lệnh trên tạo tệp `instance/lab07.sqlite3` từ `server/schema.sql` và nạp dữ liệu mẫu từ `server/seed.py`.
- Chạy lại `init-db` nhiều lần **không ghi đè** và **không tạo trùng** dữ liệu bạn đã chỉnh sửa.
- Nếu muốn tạo một cơ sở dữ liệu sạch ở đường dẫn khác:
  ```powershell
  .\.venv\Scripts\python.exe app.py init-db --database instance\demo-sach.sqlite3
  ```

### Bước 3: Khởi động ứng dụng

```powershell
.\.venv\Scripts\python.exe app.py run
```

Mở trình duyệt và truy cập: **`http://127.0.0.1:5000`** (hoặc `http://localhost:5000`).

> **Tùy chọn tham số:** Có thể đổi cổng hoặc file DB khi chạy:
> ```powershell
> .\.venv\Scripts\python.exe app.py run --port 5050 --database instance\lab07.sqlite3
> ```

### Bước 4: Đăng nhập bằng tài khoản mẫu

Sau khi mở `http://127.0.0.1:5000`, chọn cổng tương ứng trên thanh điều hướng và đăng nhập bằng một trong các tài khoản hư cấu được tạo sẵn sau `init-db`:

| Vai trò | Họ tên | Mã đăng nhập | Mật khẩu / PIN | Cổng đăng nhập | Phạm vi dữ liệu mẫu |
|---|---|---|---|---|---|
| **Quản trị viên** (`admin`) | Đỗ Nguyên Khôi | `QT0701` | `963852` | `tutor-login.html` | Toàn hệ thống (gia sư, trung tâm, cài đặt) |
| **Gia sư 1** (`tutor`) | Lâm Nhật Quỳnh | `GS0701` | `741963` | `tutor-login.html` | Lớp *Toán · Quỹ đạo xanh* (2 học sinh: `HS0701`, `HS0702`) |
| **Gia sư 2** (`tutor`) | Vũ Hạ Đan | `GS0702` | `684219` | `tutor-login.html` | Lớp *Khoa học · Mầm pha lê* (1 học sinh: `HS0703`) |
| **Học sinh 1** (`student`) | Phạm Hải Miên | `HS0701` | `258147` | `student-login.html` hoặc `homework.html` | Mã bài tập riêng: `BT-SAO-07` |
| **Học sinh 2** (`student`) | Mai Khánh Tường | `HS0702` | `369258` | `student-login.html` hoặc `homework.html` | Mã bài tập riêng: `BT-QUE-07` |
| **Học sinh 3** (`student`) | Hồ Ngọc Lam | `HS0703` | `486291` | `student-login.html` hoặc `homework.html` | Mã bài tập riêng: `BT-LAM-07` |

---

## 3. Tài khoản mẫu (dữ liệu hư cấu)

- Để đăng nhập **Quản trị viên** hoặc **Gia sư**, vào mục **GIA SƯ** (`tutor-login.html`) trên thanh điều hướng.
- Để đăng nhập **Phụ huynh / Học sinh**, vào mục **PH/HS** (`student-login.html`).
- Để vào nhanh **Cổng Bài Tập**, vào mục **BÀI TẬP** (`homework.html`) — có thể nhập `Mã học sinh` + `Mã PIN`, hoặc chỉ nhập `Mã bài tập` (`BT-SAO-07`, `BT-QUE-07`, `BT-LAM-07`) và để trống ô PIN.

---

## 4. Hướng dẫn sử dụng từng phân hệ

### 4.1. Trang chủ & Đổi ngôn ngữ (`index.html`)

- Mở `http://127.0.0.1:5000/index.html` để truy cập nhanh 3 cổng chính, xem chỉ số minh họa, câu hỏi thường gặp (FAQ) và liên kết **Xem lịch dạy mẫu** ở chân trang.
- **Đổi ngôn ngữ toàn trang chủ**:
  1. Nhấn nút **🌐 Ngôn ngữ** ở thanh điều hướng trên cùng (hỗ trợ cả desktop, mobile và bàn phím: `ArrowDown`, `ArrowUp`, `Home`, `End`, `Escape`).
  2. Chọn một trong 4 ngôn ngữ: **Tiếng Việt** (`vi`), **English** (`en`), **日本語** (`ja`), **한국어** (`ko`).
  3. Lần đầu chọn ngôn ngữ mới, Flask gọi Google Cloud Translation API v2 theo từng lô tối đa 128 mục, dịch toàn bộ văn bản trang chủ và lưu vào bảng `homepage_translations` trong SQLite.
  4. Những lần chọn lại sau (hoặc khi mở trực tiếp `?lang=en`, `?lang=ja`, `?lang=ko`), hệ thống đọc từ cache SQLite ngay lập tức mà không gọi lại Google trừ khi văn bản gốc trên `index.html` thay đổi.
  5. Chọn **Tiếng Việt** (`vi`) để trở về nội dung gốc ngay lập tức (không cần mạng hay API key).

### 4.2. Cổng Phụ huynh / Học sinh (`student-login.html` → `student-dashboard.html`)

1. Vào mục **PH/HS** trên thanh điều hướng, nhập mã học sinh và PIN (ví dụ `HS0701` / `258147`) rồi nhấn **Tra cứu**.
2. Tại bảng điều khiển học tập, bạn có thể:
   - Xem thông báo chung từ hệ thống và lời nhắc riêng của gia sư.
   - Theo dõi điểm trung bình đầu giờ, điểm định kỳ và biểu đồ đường tiến bộ qua từng buổi (bấm nút chú giải để ẩn/hiện từng đường).
   - Lọc thống kê theo tháng (`Kỳ đánh giá`) để xem tỷ lệ hoàn thành BTVN, chuyên cần và nhật ký nhận xét từng buổi học.
   - Xem tổng học phí trong kỳ và bấm **Xem hóa đơn** để mở phiếu học tập chi tiết.
   - Nhập nội dung ở mục **Phản hồi từ Phụ huynh** và nhấn **Gửi phản hồi** để gửi trực tiếp cho gia sư.
   - Nhấn thẻ **BÀI TẬP** ở đầu trang để chuyển sang cổng nộp bài mà không cần đăng nhập lại.

### 4.3. Cổng Nộp Bài Tập (`homework.html`)

Có **2 chế độ đăng nhập** ngay trên cùng biểu mẫu:
- **Đăng nhập đầy đủ bằng tài khoản học sinh**: Nhập Mã học sinh + Mã PIN (ví dụ `HS0701` / `258147`).
- **Truy cập nhanh chỉ bằng Mã bài tập**: Chỉ nhập Mã bài tập (ví dụ `BT-SAO-07`) và để trống ô PIN. Ở chế độ này, hệ thống chỉ cho phép xem bài được giao và nộp/sửa bài chưa chấm — mọi dữ liệu riêng tư như điểm trên lớp, học phí và hóa đơn đều bị chặn phía máy chủ (`403`).

**Thao tác trên cổng Bài tập:**
- Xem danh sách **Bài tập được giao**, tải tệp đề bài đính kèm từ SQLite.
- Chọn bài tập ở khung **Nộp bài tập**, nhập lời giải/ghi chú và chọn một hoặc nhiều tệp bài làm, sau đó nhấn **Nộp bài**.
- Với bài nộp **chưa được chấm điểm**, bạn có thể nhấn **Sửa bài nộp** để cập nhật nội dung/thêm tệp, hoặc **Thu hồi** để xóa bài nộp. Khi gia sư đã chấm, bài nộp tự động khóa sửa và hiển thị điểm kèm lời phê.

### 4.4. Cổng Quản lý Gia sư (`tutor-login.html` → `tutor-dashboard.html`)

1. Vào mục **GIA SƯ**, đăng nhập bằng `GS0701` / `741963` (hoặc nhấn **Tạo tài khoản gia sư** để đăng ký mới; nhớ lưu lại mã khôi phục `ZT-...` để dùng cho tính năng **Quên mật khẩu / mã PIN?**).
2. Các tab điều hướng bên trái (hoặc thanh dưới cùng trên mobile):
   - **Tổng quan**: Chọn tháng xem KPI (số học sinh, buổi dạy, tổng giờ, học phí), lịch dạy hôm nay & ngày mai, biểu đồ doanh thu theo năm/khoảng tháng, biểu đồ phân bổ học phí theo học sinh và thời khóa biểu tổng hợp theo tuần.
   - **Báo cáo (Bài tập & Phản hồi)**: Nhấn **+ Giao bài tập mới** để giao bài cho từng học sinh kèm tệp đề bài (lưu BLOB trong SQLite). Khi học sinh nộp bài, nhấn **Chấm bài** để xem tệp nộp, nhập điểm (0–10) và nhận xét. Phía dưới hiển thị phản hồi từ phụ huynh/học sinh.
   - **Nhật ký buổi học**: Nhấn **+ Ghi nhật ký buổi học** để điểm danh (`Đã học`, `Học bù`, `Nghỉ phép`, `Vắng`), nhập nội dung, nhận xét, tình trạng BTVN, điểm đầu giờ/định kỳ và học phí buổi học; hỗ trợ lọc theo học sinh và tháng.
   - **Lịch dạy (`tutor-calendar.html`)**: Giao diện FullCalendar theo **Tháng / Tuần / Ngày**. Nhấp hoặc kéo chọn vùng trống để tạo lịch dạy mới (lặp hàng tuần hoặc 1 buổi cố định), kéo thả hoặc kéo giãn sự kiện để đổi lịch (tự động lưu SQLite), nhấn vào ca dạy để sửa/xóa, nhấn **Lịch tóm tắt** để xem bảng tổng hợp.
   - **Học sinh**: Thêm học sinh mới (tự sinh mã đăng nhập và mã bài tập nếu để trống), sửa hồ sơ/học phí/thông báo, chuyển học sinh vào **Thùng rác** và khôi phục khi cần.
   - **Học phí**: Chọn tháng để xem tổng thu dự kiến / đã thu / còn phải thu; bấm **Đánh dấu đã đóng** để cập nhật toàn bộ buổi học trong tháng của học sinh (giao dịch nguyên tử trong SQLite) và bấm **Xem hóa đơn** để mở `preview-invoice.html`.
   - **Thanh công cụ chân sidebar**:
     - **Giao diện**: Đổi nhanh các chủ đề màu sáng/tối (lưu vào tài khoản trong SQLite).
     - **Tài khoản**: Cập nhật họ tên, số điện thoại, đổi mật khẩu và tải lên ảnh đại diện.
     - **Cài đặt**: Tạo hoặc xóa các lớp học của gia sư.

### 4.5. Phiếu học tập & Hóa đơn (`preview-invoice.html`)

- Mở từ nút **Xem hóa đơn** trong cổng Học sinh hoặc tab Học phí của Gia sư (`preview-invoice.html?id=<student_id>&month=YYYY-MM`).
- Tự động tổng hợp số buổi học/nghỉ phép/học bù, bài tập đã nộp/thiếu/nộp trễ, số tiền đã thanh toán, còn phải thu và tổng học phí từ SQLite.
- Cho phép sửa trực tiếp lời nhắn gửi phụ huynh trước khi bấm **Tải ảnh PNG** (render cục bộ bằng `html2canvas`) hoặc **In / lưu PDF**.

### 4.6. Cổng Quản trị viên (`admin-dashboard.html`)

Đăng nhập tại `tutor-login.html` bằng tài khoản quản trị `QT0701` / `963852` để truy cập 4 tab:
- **Tổng Quan Kinh Doanh**: Theo dõi doanh thu phí duy trì web, số gia sư đang hoạt động/dùng thử/sắp hết hạn, cảnh báo gia hạn nhanh, biểu đồ doanh thu và lịch sử giao dịch (hỗ trợ **Hủy gia hạn** để hoàn tác về ngày hết hạn và trạng thái trước đó).
- **Quản Lý Gia Sư**: Tìm kiếm, lọc theo trạng thái hoặc trung tâm, thêm gia sư mới, chỉnh sửa gói/hạn sử dụng, **Gia hạn**, **Khóa / Mở khóa** tài khoản, chuyển vào **Thùng rác Gia sư** và khôi phục.
- **Trung Tâm Giới Thiệu**: Thêm/sửa/xóa trung tâm đối tác và thống kê doanh thu thực thu từ các gia sư thuộc trung tâm.
- **Cài Đặt Hệ Thống**: Cập nhật thông báo chạy chữ hiển thị ở cổng học sinh (`marquee`) và thông tin liên hệ giả lập (`contact`).

### 4.7. Lịch thực hành mẫu (`demo-calendar.html`)

- Truy cập từ liên kết **Xem lịch dạy mẫu** ở chân trang chủ (không cần đăng nhập).
- Mỗi trình duyệt/phiên khách có một thời khóa biểu thực hành riêng lưu trong SQLite (`demo_calendars`) và kiểm tra xung đột phiên bản (`revision`) khi lưu.

---

## 5. Cấu hình Google Cloud Translation API v2

Để bật tính năng dịch thật cho trang chủ `index.html`:

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/), chọn hoặc tạo một Project.
2. Bật **Billing** cho Project (Google Cloud Translation API yêu cầu tài khoản có gắn phương thức thanh toán; Google có hạn mức miễn phí hàng tháng theo chính sách hiện hành).
3. Vào **APIs & Services → Library**, tìm **Cloud Translation API** và nhấn **Enable**.
4. Vào **APIs & Services → Credentials → Create Credentials → API key**.
   - Khuyến nghị nhấn vào khóa vừa tạo → mục **API restrictions** → chọn **Restrict key** → chỉ tích **Cloud Translation API**.
5. Mở tệp `.env` trong thư mục `Lab07` và dán khóa vào biến:
   ```env
   GOOGLE_TRANSLATE_API_KEY=AIza...khoa-cua-ban...
   ```
6. Khởi động lại máy chủ (`.\.venv\Scripts\python.exe app.py run`).

**Lưu ý bảo mật:**
- Không bao giờ đưa tệp `.env` hoặc API key vào Git, mã JavaScript, HTML, log hoặc ảnh/video quay màn hình.
- Nếu chưa cấu hình khóa, nút dịch vẫn hoạt động an toàn: giao diện hiển thị thông báo hướng dẫn điền khóa vào `.env` và giữ nguyên tiếng Việt; toàn bộ các tính năng SQLite khác vẫn chạy bình thường.

---

## 6. Kiểm thử & Khắc phục sự cố

### Chạy bộ kiểm thử tự động

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

### Một số tình huống thường gặp

- **Nút dịch báo *"Chưa cấu hình khóa Google Dịch..."* (`503 missing_key`)**: Kiểm tra lại file `Lab07/.env` đã có dòng `GOOGLE_TRANSLATE_API_KEY=...` hợp lệ chưa, sau đó khởi động lại `app.py run`.
- **Nút dịch báo *"Google chưa cấp quyền dịch"* (`502 google_denied`)**: Kiểm tra Project trên Google Cloud đã bật **Cloud Translation API**, đã gắn **Billing**, và API key chưa bị giới hạn sai dịch vụ hoặc giới hạn HTTP referrer (lưu ý Flask gọi trực tiếp từ backend chứ không phải từ trình duyệt).
- **Nút dịch báo *"Đã hết hạn mức dịch"* (`429 quota`)**: Kiểm tra hạn mức sử dụng trên Google Cloud Console; các lô văn bản đã dịch trước đó vẫn được lưu trong SQLite để không phải dịch lại.
- **Muốn đưa dữ liệu về trạng thái mẫu ban đầu**: Dừng máy chủ (`Ctrl+C`), xóa `instance\lab07.sqlite3`, rồi chạy lại `.\.venv\Scripts\python.exe app.py init-db`.

---

## 7. Tài liệu tham khảo kèm theo

- Bảng đối chiếu chức năng gốc ↔ Lab07: [docs/feature-parity.md](docs/feature-parity.md)
- Báo cáo tổng hợp & minh chứng chạy thực tế: [docs/report.md](docs/report.md) · [docs/report.pdf](docs/report.pdf)
- Kịch bản quay video demo 90–120 giây: [docs/demo-script.md](docs/demo-script.md)
- Nhật ký tiến độ dự án: [progess.md](progess.md)
