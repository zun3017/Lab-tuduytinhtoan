<h1 align="center">Individual Proposal for the Course Project</h1>

# Nguyễn Trung Kiên

## Vietnamese:
#### Đồ án của tôi sẽ về một hệ thống trợ lý thông minh hỗ trợ trích xuất **quyết định**, **công việc cần làm (action items)**, **người phụ trách**, **thời hạn** và **vấn đề chưa giải quyết** từ bản ghi âm cuộc họp, đồng thời theo dõi trạng thái của các mục này xuyên suốt nhiều cuộc họp.

#### Cách hoạt động

### Bước 1: Chuyển ghi âm thành văn bản có cấu trúc

Hệ thống nhận đầu vào là bản ghi âm cuộc họp và chuyển thành văn bản bằng mô hình nhận dạng giọng nói (ASR). Bên cạnh nội dung, hệ thống giữ lại:

- Mốc thời gian (timestamp) của từng câu, để có thể truy ngược bằng chứng.
- Phân tách người nói (speaker diarization), nhằm xác định ai đã đưa ra quyết định hoặc nhận việc.
- Ngày diễn ra cuộc họp, lấy từ metadata của bản ghi hoặc người dùng cung cấp, làm mốc cho bước suy luận thời gian.

Các đoạn có độ tin cậy thấp của ASR hoặc không xác định được người nói sẽ được đánh dấu để xử lý riêng ở bước sau.

### Bước 2: Trích xuất thông tin từ nội dung cuộc họp

Hệ thống phân đoạn transcript theo chủ đề và áp dụng kỹ thuật trích xuất thông tin (information extraction) để tìm bốn loại thực thể chính:

- **Quyết định (Decision)**: một kết luận đã được thống nhất, ví dụ việc chọn phương án A thay vì B.
- **Công việc (Action item)**: một hành động cụ thể cần thực hiện trong tương lai.
- **Người phụ trách (Owner)**: người được giao hoặc tự nhận công việc, được liên kết với người nói thông qua diarization và các cụm như "tôi sẽ làm", "giao cho Minh".
- **Vấn đề chưa giải quyết (Open issue)**: câu hỏi hoặc rủi ro được nêu nhưng chưa có kết luận.

Mô hình ngôn ngữ lớn được điều khiển bằng một schema JSON cố định, buộc đầu ra theo đúng cấu trúc và kèm trích dẫn câu gốc để kiểm chứng.

### Bước 3: Suy luận thời gian (Temporal reasoning)

Các mốc thời hạn trong cuộc họp hiếm khi ở dạng tuyệt đối. Hệ thống chuẩn hóa các biểu thức như "thứ Sáu tuần sau", "cuối tháng này" hoặc "sau khi có số liệu Q3" thành ngày cụ thể dựa trên ngày họp:

- Biểu thức tương đối có thể quy đổi xác định sẽ được tính bằng quy tắc lịch, không để mô hình tự tính.
- Biểu thức phụ thuộc sự kiện (ví dụ "sau khi xong bản thiết kế") được giữ dưới dạng điều kiện, kèm sự kiện tham chiếu.
- Biểu thức mơ hồ như "sớm" hoặc "tuần tới" được gắn cờ để người dùng xác nhận thay vì đoán.

### Bước 4: Theo dõi trạng thái qua nhiều cuộc họp (State tracking)

Đây là phần cốt lõi giúp hệ thống khác với một công cụ tóm tắt đơn lẻ. Mỗi công việc và vấn đề được quản lý như một đối tượng có vòng đời:

- Các trạng thái cơ bản: *mở (open)*, *đang thực hiện (in progress)*, *hoàn thành (done)*, *quá hạn (overdue)*, *đã hủy (dropped)*.
- Khi một cuộc họp mới nhắc lại công việc cũ, hệ thống so khớp bằng độ tương đồng ngữ nghĩa và người phụ trách để cập nhật thay vì tạo bản ghi trùng.
- Khi có mâu thuẫn, ví dụ hai người cùng nhận một việc hoặc thời hạn bị dời, hệ thống ghi nhận cả hai phiên bản kèm ngày họp tương ứng và đề nghị xác nhận.
- Các vấn đề chưa giải quyết được chuyển sang cuộc họp kế tiếp cho đến khi có quyết định đóng.

### Bước 5: Sinh đầu ra theo hai dạng

Từ dữ liệu đã có trạng thái, hệ thống xuất kết quả theo yêu cầu của người dùng:

- **Track list**: bảng công việc gồm nội dung, người phụ trách, thời hạn, trạng thái hiện tại, cuộc họp nguồn và timestamp để đối chiếu.
- **Note**: biên bản tóm tắt cuộc họp, gồm quyết định, công việc mới, thay đổi so với lần trước và các vấn đề còn mở.

Mọi mục trong cả hai dạng đều có liên kết tới đoạn ghi âm gốc, giúp người dùng kiểm tra nhanh khi có nghi ngờ.

## 3. Kết quả đầu ra

Hệ thống cung cấp cho người dùng:

- Danh sách quyết định, công việc, người phụ trách, thời hạn và vấn đề chưa giải quyết được trích xuất từ một hoặc nhiều cuộc họp.
- Track list theo dõi trạng thái xuyên suốt các cuộc họp, có đánh dấu công việc quá hạn.
- Ghi chú (note) tóm tắt từng cuộc họp, kèm phần so sánh với cuộc họp trước.
- Trích dẫn timestamp cho từng mục để kiểm chứng.
- Cảnh báo khi thiếu người phụ trách, thời hạn mơ hồ, hoặc có mâu thuẫn giữa các cuộc họp.

## 4. Nguyên tắc thiết kế

Hệ thống kết hợp **mô hình nhận dạng giọng nói và phân tách người nói** để có văn bản đáng tin cậy, **mô hình ngôn ngữ lớn với schema đầu ra cố định** để trích xuất thông tin, **quy tắc xác định cho suy luận thời gian và máy trạng thái (state machine)** để đảm bảo kết quả có thể kiểm thử, và **cơ chế xác nhận của người dùng** cho các trường hợp không chắc chắn. Việc đánh giá được thực hiện bằng bộ dữ liệu cuộc họp đã gán nhãn, với các chỉ số precision và recall cho từng loại thực thể, độ chính xác của ngày suy ra và độ chính xác của trạng thái theo thời gian.

---

## English:
#### My project will be about an intelligent assistant that extracts **decisions**, **action items**, **owners**, **deadlines**, and **unresolved issues** from meeting voice recordings, and tracks the state of these items across multiple meetings.

#### How it works

### Step 1: Converting voice recordings into structured text

The system takes a meeting recording as input and transcribes it using an automatic speech recognition (ASR) model. Alongside the text, it preserves:

- Timestamps for each utterance, so every extracted item can be traced back to its source.
- Speaker diarization, to determine who made a decision or accepted a task.
- The meeting date, taken from recording metadata or provided by the user, as the anchor for temporal reasoning.

Segments with low ASR confidence or unidentified speakers are flagged for separate handling in later steps.

### Step 2: Information extraction from meeting content

The system segments the transcript by topic and applies information extraction to identify four main entity types:

- **Decision**: an agreed conclusion, such as choosing option A over option B.
- **Action item**: a concrete future task.
- **Owner**: the person assigned to or volunteering for a task, linked to speakers through diarization and phrases like "I'll handle it" or "assign this to Minh."
- **Open issue**: a question or risk raised without a resolution.

A large language model is constrained by a fixed JSON schema, which enforces the output structure and requires a verbatim source quote for each item to support verification.

### Step 3: Temporal reasoning

Deadlines in meetings are rarely absolute. The system normalizes expressions such as "next Friday," "end of this month," or "after the design is finalized" into concrete dates relative to the meeting date:

- Relative expressions with a deterministic interpretation are computed by calendar rules, not by the language model.
- Event-dependent expressions (for example, "after the design is done") are stored as conditions that reference the triggering event.
- Vague expressions such as "soon" or "next week" are flagged for the user to confirm rather than guessed.

### Step 4: State tracking across meetings

This is the core component that distinguishes the system from a single-meeting summarizer. Each action item and issue is managed as an object with a lifecycle:

- Basic states: *open*, *in progress*, *done*, *overdue*, and *dropped*.
- When a new meeting revisits an existing task, the system matches it using semantic similarity and owner identity, updating the existing record instead of creating a duplicate.
- When conflicts arise, such as two people claiming the same task or a deadline being moved, the system records both versions with their meeting dates and asks for confirmation.
- Unresolved issues carry forward to subsequent meetings until they are explicitly closed.

### Step 5: Generating output in two formats

From the tracked state, the system produces results according to the user's request:

- **Track list**: a table of task content, owner, deadline, current status, source meeting, and timestamp for verification.
- **Note**: a meeting summary covering decisions, new action items, changes from the previous meeting, and open issues.

Every item in both formats links back to the corresponding part of the recording, allowing quick verification.

## 3. Output

The system provides users with:

- A list of decisions, action items, owners, deadlines, and unresolved issues extracted from one or more meetings.
- A cross-meeting track list showing the current status of each item, with overdue tasks highlighted.
- Meeting notes summarizing each session, including a comparison with the previous meeting.
- Timestamp citations for every extracted item.
- Warnings for missing owners, ambiguous deadlines, or conflicts between meetings.

## 4. Design principles

The system combines **speech recognition with speaker diarization** to produce reliable text, **a large language model with a fixed output schema** for information extraction, **deterministic rules for temporal normalization and a state machine** to keep results testable, and **user confirmation** for uncertain cases. Evaluation uses a labeled set of meeting recordings, measuring precision and recall per entity type, accuracy of inferred dates, and correctness of state transitions over time.