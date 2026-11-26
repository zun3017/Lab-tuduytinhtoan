# Kịch bản video Lab07

Video hiện có tại demo.webm được quay trên ứng dụng chạy với SQLite mới. Có phụ đề trên màn hình. Chưa có khóa Cloud Translation hợp lệ, vì vậy video hiện ghi lại thông báo thiếu khóa khi thử dịch.

## Đoạn cần quay bổ sung khi có khóa hợp lệ

1. Điền GOOGLE_TRANSLATE_API_KEY trong .env, khởi động lại Flask. Giữ khóa ngoài khung hình.
2. Dùng database riêng nếu cần minh chứng lần đầu gọi dịch, ví dụ python app.py run --database instance/video-demo.sqlite3 --port 5001. Không xóa database làm việc.
3. Vào PH/HS, nhập HS0701, chọn English. Cuộn qua lời chào, biểu đồ, nhận xét và tên bài.
4. Vào Bài tập bằng BT-SAO-07, chọn English. Cho thấy tên bài từ database, mô tả và lịch sử nộp bài cùng nhận xét đã được dịch.
5. Cho thấy request POST /api/translate/ui có source=google hoặc log cache=miss source=google. Không ghi hình .env hay khóa.
6. Tải lại trang và chọn lại ngôn ngữ để cho thấy cache SQLite. Chọn tiếng Việt để phục hồi văn bản gốc.
7. Ghi rõ họ tên, mã sinh viên và khai báo AI trong phần giới thiệu hoặc cuối video.

Chỉ kết luận API Google hoạt động khi đã nhận phản hồi thành công từ Google thật. Nếu thiếu khóa hoặc hết hạn mức, giữ thông báo lỗi và ghi rõ trạng thái.
