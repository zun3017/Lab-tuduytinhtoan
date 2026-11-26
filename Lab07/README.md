# ZunTutor Lab07

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

Có thể chạy các chức năng quản lý khi chưa cấu hình khóa. Chọn ngôn ngữ khác tiếng Việt sẽ cần khóa hợp lệ và kết nối Internet. Khóa Gemini dùng thử không được dùng làm khóa Cloud Translation.

## Cấu trúc mã nguồn

- app.py là điểm chạy ứng dụng.
- server/ chứa API, kiểm tra quyền, SQLite, dữ liệu mẫu và tích hợp Google Translation.
- public/ chứa HTML, CSS, JavaScript và thư viện giao diện.
- requirements.txt chứa thư viện Python.
- .env.example là mẫu cấu hình.
- docs/ chứa tài liệu bài nộp.
- progess.md ghi lịch sử chỉnh sửa.

## Chuẩn bị nộp

Gửi app.py, server/, public/, requirements.txt, .env.example, README.md và tài liệu theo yêu cầu môn học. Người chạy tự tạo .env và điền khóa của mình. Thư mục .venv là môi trường cục bộ có thể tạo lại bằng lệnh cài đặt ở trên. SQLite tự khởi tạo nên có thể chạy từ mã nguồn trên máy mới.

## Khai báo sử dụng AI

Đã sử dụng AI hỗ trợ chuyển giao diện ZunTutor sang Flask/SQLite, tích hợp dịch API, rà soát lỗi và soạn hướng dẫn. Sinh viên cần rà soát và giải thích phần đóng góp khi nộp bài.

## Tài liệu theo đề Lab07
Báo cáo tại docs/report.md và docs/report.pdf. Video hiện trạng tại docs/demo.webm. Lịch sử Git thực tế tại docs/git-history.md. Đối chiếu yêu cầu và phần còn chờ tại docs/feature-parity.md. Video hiện tại chưa minh chứng Google dịch thành công vì thiếu khóa; xem docs/demo-script.md để quay bổ sung.
