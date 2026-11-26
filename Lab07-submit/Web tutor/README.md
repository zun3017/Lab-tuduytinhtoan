#  Lab07

Website quản lý gia sư, học sinh và bài tập, chạy bằng Python Flask và SQLite.

## Cài đặt và chạy

Cần Python 3.9 trở lên, pip và trình duyệt hiện đại. Mở terminal tại thư mục chứa app.py.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
```

Điền khóa Google Cloud Translation Basic v2 vào .env.

```dotenv
GOOGLE_TRANSLATE_API_KEY=khoa_google_cloud_translation_cua_ban
```

Bật Cloud Translation API và cấu hình thanh toán cho dự án Google Cloud của khóa đó. Sau đó chạy ứng dụng.

```powershell
.\.venv\Scripts\python.exe app.py run
```

Truy cập http://127.0.0.1:5000. SQLite và dữ liệu mẫu tự tạo ở lần chạy đầu. Mọi thay đổi dữ liệu được lưu trong instance/lab07.sqlite3. Khởi động lại máy chủ sau khi thay khóa.

Trên macOS/Linux, dùng python3 và .venv/bin/python thay cho đường dẫn Python Windows. Sao chép .env.example thành .env bằng lệnh cp.

## Tài khoản và mã thử

| Cổng | Mã | PIN |
| --- | --- | --- |
| Gia sư | GS0701 | 741963 |
| Quản trị | QT0701 | 963852 |
| PH/HS | HS0701 hoặc 0000701001 | Không yêu cầu |
| Bài tập | BT-SAO-07 | Không yêu cầu |

## Tích hợp Google Translate API

Chỉ PH/HS và Bài tập sau đăng nhập có bộ chọn Language. Trình duyệt gửi chữ đang hiển thị đến POST /api/translate/ui, gồm nội dung bài học và nhận xét lấy từ database. Máy chủ gọi https://translation.googleapis.com/language/translate/v2 bằng khóa trong .env, gom tối đa 128 đoạn mỗi lô. Bản dịch được cache trong SQLite theo nội dung và ngôn ngữ. Nội dung thay đổi được dịch lại.

Hỗ trợ tiếng Việt, Anh, Nhật và Hàn. Theo dõi nội dung phát sinh sau khi đổi tháng, mở hộp thoại hoặc cập nhật dữ liệu. Dịch cả nhãn và chú thích biểu đồ. Tệp đính kèm giữ nguyên. Khi dịch lỗi, trang trở về nội dung gốc và hiển thị thông báo.

