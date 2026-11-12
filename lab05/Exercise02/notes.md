# Ghi chú Ex2 

- **Module 0 — Setup:** chuẩn bị môi trường và API key; bài thực hành đã đổi sang Gemini, dùng `GOOGLE_API_KEY` trong `.env`.
- **Module 1 — Introduction:** graph gồm state, node và edge; chain chạy theo trình tự, router chọn nhánh, agent lặp giữa model và tool. Checkpointer giúp lưu hội thoại.
- **Module 2 — State and Memory:** schema định nghĩa trạng thái, reducer quy định cách gộp cập nhật; trim/filter và tóm tắt giúp quản lý lịch sử dài.
- **Module 3 — Human-in-the-Loop:** streaming nhận kết quả từng phần; breakpoint cho phép dừng, xem hoặc sửa state rồi tiếp tục. Time travel hỗ trợ quay về checkpoint và thử nhánh khác.
- **Module 4 — Building Your Assistant:** parallelization chạy các nhánh song song; subgraph chia tác vụ; map-reduce xử lý từng phần rồi tổng hợp. Áp dụng vào trợ lý nghiên cứu.
- **Module 5 — Long-Term Memory:** phân biệt state của từng hội thoại với thông tin lưu qua nhiều hội thoại; store quản lý bộ nhớ, profile và collection là hai cách tổ chức thông tin.
- **Module 6 — Deployment:** triển khai graph thành dịch vụ, dùng SDK kết nối và quản lý assistant, thread, run; tìm hiểu cách xử lý tin nhắn mới khi run đang chạy.


