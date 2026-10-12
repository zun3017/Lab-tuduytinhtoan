<h1 align="center">Individual Proposal for the Course Project</h1> 

# Nguyễn Hoàng Danh

## Vietnamese:  
#### Đồ án của tôi sẽ về một hệ thống thông minh hỗ trợ sinh viên sống trong **x** ngày với **n** số tiền cho trước.

#### Cách hoạt động

### Bước 1: Thu thập thông tin người dùng

Trợ lý tương tác với người dùng để thu thập các thông tin cần thiết, bao gồm:

- Ngân sách dành riêng cho ăn uống.
- Số ngày cần lập kế hoạch.
- Số bữa ăn dự kiến mỗi ngày.
- Chế độ ưu tiên: tiết kiệm chi phí hoặc cân bằng giữa chi phí và dinh dưỡng.
- Các yêu cầu bổ sung như thực phẩm không ăn được, khả năng nấu ăn và khu vực mua sắm.

Hệ thống lưu các thông tin này thành một hồ sơ kế hoạch để sử dụng trong quá trình tính toán và đề xuất.

### Bước 2: Phân tích ngân sách

Hệ thống tính ngân sách trung bình mỗi ngày và ước tính giới hạn chi tiêu cho từng bữa ăn. Dựa trên dữ liệu giá thực phẩm và các quy tắc đã xác định, hệ thống đánh giá tính khả thi của kế hoạch.

Nếu ngân sách quá thấp để xây dựng một kế hoạch ăn uống khả thi, hệ thống sẽ thông báo rõ giới hạn thay vì đưa ra những đề xuất không thực tế.

### Bước 3: Xây dựng kế hoạch ăn uống

Hệ thống đề xuất các món ăn hoặc tổ hợp thực phẩm phù hợp với ngân sách, số ngày và chế độ ưu tiên của người dùng. Kế hoạch được kiểm tra để bảo đảm tổng chi phí dự kiến không vượt quá ngân sách.

Người dùng có thể yêu cầu thay thế món ăn, điều chỉnh kế hoạch hoặc lựa chọn phương án tiết kiệm hơn.

### Bước 4: Tìm kiếm địa điểm mua thực phẩm

Sau khi xác định các món ăn, hệ thống truy xuất dữ liệu về nguyên liệu, giá tham khảo và địa điểm bán từ những nguồn dữ liệu được hỗ trợ. Hệ thống so sánh các lựa chọn phù hợp với ngân sách và khu vực của người dùng.

Mỗi đề xuất cần thể hiện giá tham khảo, nguồn dữ liệu và thời điểm cập nhật nếu có. Khi không có dữ liệu giá phù hợp, hệ thống sẽ thông báo thay vì tự tạo ra giá hoặc khẳng định giá rẻ nhất.

### Bước 5: Kiểm tra và điều chỉnh kế hoạch

Hệ thống tổng hợp chi phí dự kiến, ngân sách còn lại và kế hoạch ăn uống theo từng ngày. Nếu tổng chi phí vượt ngân sách hoặc dữ liệu không đủ để đưa ra kết quả đáng tin cậy, hệ thống sẽ giải thích vấn đề và đề xuất điều chỉnh.

## 3. Kết quả đầu ra

Hệ thống cung cấp cho người dùng:

- Kế hoạch ăn uống theo từng ngày.
- Danh sách món ăn và nguyên liệu cần thiết.
- Chi phí dự kiến cho từng bữa và toàn bộ kế hoạch.
- Ngân sách còn lại sau khi áp dụng kế hoạch.
- Danh sách cửa hàng hoặc nguồn mua thực phẩm phù hợp với dữ liệu hiện có.
- Cảnh báo và phương án thay thế khi ngân sách không khả thi hoặc thiếu dữ liệu.

## 4. Nguyên tắc thiết kế

Hệ thống kết hợp **thuật toán tính toán có thể kiểm thử**, **cơ sở dữ liệu thực phẩm và giá cả**, **cơ chế tìm kiếm thông tin** và **trợ lý AI** để tương tác với người dùng. Mục tiêu là tạo ra một kế hoạch có thể giải thích, kiểm tra và điều chỉnh, thay vì chỉ đưa ra những gợi ý chung chung.  

## English:   
#### My project will be about an intelligent system that supports students living for **x** days with a predetermined amount of **n** money.

#### How it works

### Step 1: Collecting user information

The assistant interacts with users to collect the necessary information, including:

- Budget allocated for food.
- Number of days to plan for.
- Expected number of meals per day.
- Preference mode: cost saving or a balance between cost and nutrition.
- Additional requirements such as foods to avoid, cooking ability, and shopping area.

The system stores this information as a planning profile for use during the calculation and recommendation process.

### Step 2: Budget analysis

The system calculates the average daily budget and estimates the spending limit for each meal. Based on food price data and predefined rules, the system evaluates the feasibility of the plan.

If the budget is too low to create a feasible meal plan, the system clearly communicates the limitation instead of making unrealistic recommendations.

### Step 3: Building a meal plan

The system suggests dishes or food combinations that match the user's budget, number of days, and preference mode. The plan is checked to ensure that the estimated total cost does not exceed the budget.

Users can request meal replacements, adjust the plan, or choose a more economical option.

### Step 4: Finding food purchasing locations

After determining the meals, the system retrieves data about ingredients, reference prices, and selling locations from supported data sources. The system compares options that fit the user's budget and location.

Each recommendation should display a reference price, data source, and update time when available. If suitable price data is unavailable, the system will notify the user instead of generating prices or claiming the lowest price.

### Step 5: Reviewing and adjusting the plan

The system summarizes the estimated costs, remaining budget, and daily meal plan. If the total cost exceeds the budget or the data is insufficient to provide reliable results, the system explains the issue and suggests adjustments.

## 3. Output

The system provides users with:

- A daily meal plan.
- A list of meals and required ingredients.
- Estimated costs for each meal and the entire plan.
- Remaining budget after applying the plan.
- A list of suitable stores or food purchasing sources based on available data.
- Warnings and alternative options when the budget is not feasible or data is insufficient.

## 4. Design principles

The system combines **testable calculation algorithms**, **a food and pricing database**, **an information retrieval mechanism**, and **an AI assistant** to interact with users. The goal is to create a plan that can be explained, verified, and adjusted, rather than simply providing generic suggestions.
---

# Lê Minh Trí

## Vietnamese:  
#### Đồ án của tôi sẽ về một Hệ thống Trợ lý Đăng ký Môn học & Quy chế Sinh viên (Smart Course Registration & Regulation Assistant) hỗ trợ sinh viên lập lộ trình học tập, kiểm tra điều kiện môn học, xếp thời khóa biểu và tra cứu quy chế đào tạo.

#### Cách hoạt động

### Bước 1: Tiếp nhận thông tin và nhu cầu của sinh viên

Trợ lý tương tác với sinh viên để thu thập các thông tin cần thiết, bao gồm:

- Danh sách các môn học mong muốn đăng ký trong học kỳ.
- Lịch rảnh, khung giờ ưu tiên và các khoảng thời gian bận.
- Lịch sử học tập, bảng điểm hiện tại và mục tiêu GPA.
- Các thắc mắc về quy chế đào tạo (học bù, tạm ngưng, điểm rèn luyện...).

### Bước 2: Phân tích điều kiện môn học và kiểm tra xung đột thời khóa biểu

Hệ thống áp dụng thuật toán duyệt đồ thị (DAG) để kiểm tra cây môn học tiên quyết và môn song hành. Sau đó, thuật toán kiểm tra ràng buộc (Constraint Checking) phân tích lịch học/lịch thi để phát hiện các điểm trùng lặp. Đồng thời, công thức toán học được sử dụng để tính toán GPA dự kiến.

### Bước 3: Tra cứu quy chế đào tạo và giải đáp thắc mắc

Đối với các thắc mắc về quy chế học tập, hệ thống truy xuất dữ liệu RAG (LangChain, Vector DB) từ file PDF Sổ tay sinh viên và Quy chế đào tạo chính thức. Hệ thống trích xuất thông tin chính xác kèm theo nguồn trích dẫn thay vì tự tạo câu trả lời.

### Bước 4: Tự động xếp lịch và đề xuất lộ trình tối ưu

Hệ thống tổng hợp dữ liệu, áp dụng AI để đề xuất thời khóa biểu tối ưu không bị xung đột lịch và gợi ý lộ trình học tập cá nhân hóa phù hợp với năng lực học tập của từng sinh viên.

## 3. Kết quả đầu ra

Hệ thống cung cấp cho người dùng:

- Lộ trình học tập cá nhân hóa và các phương án thời khóa biểu đề xuất không bị xung đột.
- Bảng kiểm tra điều kiện tiên quyết/song hành của các môn học.
- Bảng dự báo GPA theo các kịch bản điểm số.
- Câu trả lời thắc mắc quy chế chính xác kèm trích dẫn từ Sổ tay sinh viên.
- Cảnh báo khi môn học không đủ điều kiện đăng ký hoặc vượt quá giới hạn tín chỉ.

## 4. Nguyên tắc thiết kế

Hệ thống kết hợp **thuật toán đồ thị và kiểm tra ràng buộc (Graph / Constraint Checking)** để đảm bảo tính chính xác tuyệt đối trong việc kiểm tra môn tiên quyết và xếp lịch, **cơ chế tìm kiếm thông tin RAG (LangChain, Vector DB)** để tra cứu chính xác quy chế đào tạo, và **trợ lý AI** để tư vấn, hỗ trợ định hướng học tập cho sinh viên.

## English:  
#### My project will be about a Smart Course Registration & Regulation Assistant system that supports students in creating personalized study roadmaps, checking course prerequisites, arranging class schedules, and looking up academic regulations.

#### How it works

### Step 1: Collecting student input and request

The assistant interacts with the student to collect necessary information, including:

- List of desired courses for the semester.
- Preferred study hours, availability, and busy time slots.
- Academic history, current transcript, and GPA target.
- Inquiries regarding academic regulations (make-up classes, leave of absence, training points, etc.).

### Step 2: Analyzing prerequisite graph and schedule constraint checking

The system applies directed acyclic graph (DAG) algorithms to verify prerequisite and co-requisite course conditions. Next, a constraint checking algorithm detects schedule and exam conflicts, while mathematical formulas calculate projected GPAs.

### Step 3: Information retrieval for regulations and policy Q&A

For questions regarding academic policies, the system retrieves relevant information using RAG (LangChain, Vector DB) from official PDF documents like the Student Handbook and Academic Regulations. It extracts precise information with clear citations.

### Step 4: Schedule optimization and personalized roadmap recommendation

The system synthesizes data and uses AI to suggest optimal conflict-free timetables and personalized learning roadmaps tailored to each student's academic standing.

## 3. Output

The system provides users with:

- A personalized academic roadmap and conflict-free recommended timetables.
- A prerequisite and co-requisite validation report.
- GPA projections under various performance scenarios.
- Accurate regulation answers directly cited from the Student Handbook.
- Warnings when courses fail registration criteria or exceed credit limits.

## 4. Design principles

The system combines **graph algorithms and constraint checking** to guarantee absolute accuracy in prerequisite verification and scheduling, a **RAG retrieval framework (LangChain, Vector DB)** for precise policy search, and an **AI assistant** to provide personalized academic guidance.

## Phạm Tiến Đạt

### Vietnamese:
Đồ án của tôi sẽ về một **Hệ thống Thông minh Hỗ trợ Tổ chức Sự kiện & Tự động Xếp lịch Tuyển chọn (Smart Event & Casting Orchestrator)** nhằm giải quyết bài toán tối ưu hóa thời gian tổ chức sự kiện, tự động phân bổ lịch casting/phỏng vấn giữa ứng viên và ban giám khảo mà không bị trùng lịch học hay lịch cá nhân.

**Cách hoạt động**

**Bước 1: Tiếp nhận yêu cầu và thu thập dữ liệu đăng ký**  
Hệ thống tiếp nhận nguồn dữ liệu thô (link Google Sheets danh sách đăng ký) cùng các thiết lập cấu hình từ người dùng (ví dụ: thời lượng mỗi lượt, thời gian diễn ra sự kiện, các khung giờ cần tránh). Module AI xử lý ngôn ngữ tự nhiên đảm nhận việc trích xuất các điều kiện ràng buộc (Constraints) như: thời lượng một slot, số lượng ứng viên, và các khung giờ ưu tiên.

**Bước 2: Quét lịch trình khả dụng và thiết lập bài toán ràng buộc**  
Để đảm bảo tính khả thi thực tế, hệ thống tích hợp API Google Calendar để quét các khung giờ trống của ban tổ chức/ban giám khảo và ứng viên, đồng thời đối chiếu thời khóa biểu trường học để loại bỏ các mốc thời gian vướng lịch cố định.

**Bước 3: Thuật toán tối ưu hóa xếp lịch (Constraint Satisfaction Problem - CSP)**  
Thay vì để AI tự suy đoán lịch gây sai sót, hệ thống đưa toàn bộ dữ liệu vào tầng tính toán thuật toán xác định. Áp dụng thuật toán thỏa mãn ràng buộc (Constraint Satisfaction - CSP như Backtracking hoặc Greedy) kết hợp đối sánh đồ thị (Bipartite Matching) để tự động khớp từng ứng viên vào các khung giờ trống phù hợp của ban giám khảo với số lượng xung đột lịch bằng 0.

**Bước 4: Tự động hóa soạn thảo thông báo**  
Sau khi thuật toán tính toán ra timeline chuẩn xác 100%, dữ liệu phân bổ được chuyển sang module AI để tự động tạo mẫu email/tin nhắn thông báo được cá nhân hóa cho từng ứng viên theo ngữ cảnh (thời gian cụ thể, địa điểm, yêu cầu chuẩn bị và liên kết xác nhận tham dự).

**Bước 5: Đồng bộ hóa và thực thi đa kênh**  
Hệ thống gọi API của Google Sheets để xuất timeline trực tiếp ra bảng tính, tự động tạo các sự kiện hẹn trên Google Calendar và đẩy email thông báo hàng loạt qua Gmail API.

**3. Kết quả đầu ra**  
Hệ thống cung cấp cho người dùng:
- Lịch trình casting/phỏng vấn hoàn chỉnh, tối ưu và không bị xung đột lịch giữa các bên.
- File Google Sheets cập nhật trạng thái khung giờ của từng ứng viên theo thời gian thực.
- Các sự kiện lịch được tạo tự động trên Google Calendar kèm thông tin chi tiết.
- Danh sách email thông báo cá nhân hóa đã được chuẩn bị và gửi tự động đến từng ứng viên.
- Báo cáo thống kê về tỷ lệ lấp đầy lịch và cảnh báo các trường hợp không thể xếp lịch do trùng lịch bất khả kháng.

**4. Nguyên tắc thiết kế**  
Hệ thống kết hợp **kiến trúc Hybrid** giữa hai tầng xử lý: **Tầng thuật toán xác định (CSP / Graph Matching)** để đảm bảo tính toán xếp lịch chính xác tuyệt đối mà không phụ thuộc vào tính bất định của AI, kết hợp với **Module AI (LLM)** để đọc hiểu văn bản ràng buộc và cá nhân hóa nội dung thông báo, cùng **cơ chế tích hợp External APIs (Sheets, Calendar, Gmail)** để hoàn thiện quy trình tự động hóa.

---

### English:
My project will be about a **Smart Event & Casting Orchestrator System** designed to resolve schedule coordination bottlenecks, automatically generating optimal casting/interview timetables between applicants and organizers without calendar or academic conflicts.

**How it works**

**Step 1: Ingesting scheduling requests and registration data**  
The system ingests raw registration datasets (such as a Google Sheets link) alongside user configuration parameters. An AI language processing module extracts structured parameters and constraint requirements, including slot durations, total candidates, and specified time windows.

**Step 2: Availability scanning and constraint mapping**  
To ensure real-world viability, the system interfaces with the Google Calendar API to scan available free slots across interviewers and candidates, cross-referencing academic timetables to filter out rigid lecture hours.

**Step 3: Constraint Satisfaction Scheduling Algorithm (CSP)**  
Instead of relying on probabilistic AI generation, the system passes mapped constraints to a deterministic computing layer. By executing Constraint Satisfaction Problem (CSP) algorithms (such as Backtracking Search or Greedy Heuristics) and bipartite matching, the engine assigns candidates to optimal interviewer slots with zero scheduling collisions.

**Step 4: Automated personalized communication**  
Once a 100% deterministic timeline is generated, the allocation data is passed to the AI module. The model drafts personalized email and message templates for each candidate, specifying allocated time slots, venue instructions, and confirmation links.

**Step 5: Multi-channel synchronization and execution**  
The system executes external API calls to export the complete schedule back into Google Sheets, populates calendar events via Google Calendar, and triggers automated email notifications via the Gmail API.

**3. Output**  
The system provides users with:
- An optimized, fully resolved casting timetable with zero schedule collisions.
- An updated Google Sheets database displaying slot assignments and candidate statuses in real time.
- Automated calendar invites and event slots generated within Google Calendar.
- Personalized confirmation and notification emails dispatched to candidates.
- Analytical reports detailing slot occupancy rates and alerts for unresolvable schedule constraints.

**4. Design principles**  
The system adopts a **hybrid architecture** combining a **deterministic computing layer (CSP / Graph Matching)** to ensure mathematical accuracy in conflict resolution, an **AI module (LLM)** for natural language constraint parsing and personalized messaging, and **external API integrations (Sheets, Calendar, Gmail)** to deliver seamless end-to-end event execution.

---
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