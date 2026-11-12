# Ghi chú 
## 1. Module 1 — LangChain

- **Gemini:** dùng `gemini-3.1-flash-lite`; cấu hình `GOOGLE_API_KEY` trong `.env`, nạp bằng `load_dotenv()`.
- **Models:** `invoke()` nhận kết quả đầy đủ, `stream()` nhận từng phần; `temperature` điều chỉnh độ ngẫu nhiên.
- **Prompting:** system prompt định hướng vai trò; few-shot đưa ví dụ; Pydantic định nghĩa cấu trúc đầu ra.
- **Tools:** dùng `@tool` tạo công cụ từ hàm Python, đưa vào `tools=[...]` để agent sử dụng.
- **Web search:** Tavily tìm thông tin bên ngoài, cần `TAVILY_API_KEY` riêng.
- **Memory:** `InMemorySaver()` lưu trạng thái trong tiến trình; cùng `thread_id` để tiếp tục hội thoại.
- **Multimodal:** gửi văn bản, ảnh, âm thanh nếu model hỗ trợ.
- **Personal Chef:** nhận nguyên liệu → tìm công thức → gợi ý món ăn.

**Lưu ý:** notebook hiện code cũ thì chọn **Revert**; lỗi thiếu `dotenv` thì kiểm tra Python trong `.venv`.

**Thực hành:** chạy từng ô, thử đổi đầu vào, lưu output và chụp ảnh minh chứng. Chưa ghi nhận kết quả chạy thực tế.

---

## 2. Module 2: Advanced Agent (Tác tử nâng cao)
- **Lesson 1: Model Context Protocol (MCP)**: Chuẩn giao tiếp kết nối LLM với các nguồn dữ liệu / công cụ bên ngoài theo chuẩn mở.
- **Lesson 2: Context and State**: Duy trì ngữ cảnh và trạng thái xuyên suốt nhiều vòng tương tác.
- **Lesson 3: Multi-Agent Systems**: Phối hợp nhiều agent chuyên biệt (Router, Supervisor, Sub-agents).
- **Lesson 4: Project - Wedding Planner**: Dự án thực tế lên kế hoạch đám cưới với nhiều sub-agents.

---

## 3. Module 3: Production-Ready Agent (Đưa Agent vào Thực tế)
- **Lesson 1: Middleware**: Can thiệp, log, kiểm tra bảo mật trước và sau khi Agent thực thi.
- **Lesson 2: Managing Long Conversations**: Quản lý lịch sử trò chuyện dài hạn, tóm tắt tự động (summarization).
- **Lesson 3: Human In The Loop (HITL)**: Cơ chế dừng chờ con người phê duyệt trước khi thực thi các tác vụ nhạy cảm (gửi mail, thanh toán).
- **Lesson 4: Dynamic Agents**: Linh hoạt thay đổi prompt và công cụ dựa trên ngữ cảnh người dùng.
- **Lesson 5: Project - Email Assistant**: Trợ lý đọc, soạn và gửi email tự động với cơ chế kiểm duyệt.
