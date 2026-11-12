# Ghi chú Ex3 

- **Introduction:** thiết kế các vòng lặp giúp agent thực hiện công việc, kiểm tra kết quả, tự chạy theo sự kiện và cải thiện qua nhiều lần chạy.
- **Overview of Loop Engineering:** bốn vòng lặp gồm Agent, Verification, Event-Driven và Learning; mỗi vòng giải quyết một nhiệm vụ khác nhau.
- **Deep Agent Primer:** Deep Agents cung cấp công cụ làm việc với file; `AGENTS.md` chứa chỉ dẫn chung, skills cung cấp hướng dẫn chuyên biệt khi cần.
- **Agent Loop:** model chọn hành động → gọi tool → quan sát kết quả → tiếp tục hoặc kết thúc; cần giới hạn số vòng chạy.
- **Verification Loop:** evaluator kiểm tra đầu ra theo rubric, gửi phản hồi để agent sửa phần chưa đạt.
- **Event-Driven Loop:** sự kiện như tài liệu cập nhật hoặc ticket mới tự kích hoạt agent và bước kiểm tra, thay vì phải chạy thủ công.
- **Learning loop (Hill-Climbing):** xem trace của nhiều lần chạy, tìm lỗi lặp lại, sửa harness/chỉ dẫn và đánh giá lại trên cùng dữ liệu.
- **Ví dụ xuyên suốt:** agent đọc yêu cầu phần mềm, phân tích thông tin đã xác nhận, điểm mơ hồ, giả định và câu hỏi cần làm rõ.
