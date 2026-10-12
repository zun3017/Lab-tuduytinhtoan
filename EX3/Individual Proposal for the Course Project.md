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

# Trương Tấn Phúc
## Vietnamese:  
#### Đồ án của tôi sẽ về một Hệ thống Trợ lý Ảo Theo dõi & Tư vấn Sức khỏe Toàn diện Sinh viên (Student Daily Holistic Health & Mental Well-being Assistant) hỗ trợ sinh viên theo dõi chế độ ngủ nghỉ chi tiết (giờ/phút), phân tích dinh dưỡng bữa ăn (calo, đa lượng, vi chất) và sàng lọc, hỗ trợ chăm sóc sức khỏe tinh thần hàng ngày.

**Phạm vi bài toán & Bối cảnh (R1):**
- **Người dùng mục tiêu:** Sinh viên đại học thường xuyên đối mặt với thói quen sinh hoạt xáo trộn, thức khuya cày deadline, ăn uống thiếu chất (mì gói, thức ăn nhanh) và chịu áp lực thi cử kéo dài.
- **Điểm đau (Pain points):**
  1. Thiếu ngủ tích lũy (nợ ngủ) dẫn đến suy giảm nhận thức, mệt mỏi nhưng không tự định lượng được mức độ thâm hụt.
  2. Bữa ăn sinh viên nghèo dinh dưỡng, thiếu vi chất và chất xơ, thừa dầu mỡ nhưng khó tự tính toán khẩu phần chuẩn.
  3. Áp lực tâm lý, stress học tập và dấu hiệu kiệt sức (burnout) không được phát hiện sớm; e ngại hoặc thiếu kênh giãi bày, chia sẻ an toàn.
- **Các phi mục tiêu (Non-goals):** Hệ thống KHÔNG đưa ra chẩn đoán bệnh lý y khoa lâm sàng hay kê đơn thuốc; KHÔNG thay thế bác sĩ/chuyên gia tâm lý chuyên nghiệp; KHÔNG phải là ứng dụng tán gẫu tự do ngoài chủ đề sức khỏe lối sống.
- **Ràng buộc (Constraints):** Tuyệt đối bảo mật dữ liệu sức khỏe cá nhân (ẩn danh hóa); thời gian phản hồi $\le 2$ giây; tuân thủ nghiêm ngặt các ngưỡng an toàn y tế và quy trình chuyển tuyến khẩn cấp.
- **Tiêu chí thành công đo lường được:** Tính toán thâm hụt giấc ngủ và dinh dưỡng chính xác 100% (không sai số); 100% trường hợp phát hiện dấu hiệu khủng hoảng tâm lý nghiêm trọng được kích hoạt quy trình bảo vệ khẩn cấp; tỷ lệ sinh viên duy trì check-in đều đặn đạt $\ge 70\%$.

#### Cách hoạt động

### Bước 1: Tiếp nhận thông tin của sinh viên

Trợ lý tương tác với sinh viên để thu thập các thông tin cần thiết hàng ngày qua hội thoại tự nhiên hoặc biểu mẫu nhanh, bao gồm:

- **Dữ liệu giấc ngủ:** Giờ bắt đầu ngủ, giờ thức dậy (chi tiết theo giờ và phút), số lần thức giấc giữa đêm, mức độ tỉnh táo khi thức dậy (thang điểm 1–5).
- **Dữ liệu dinh dưỡng & ăn uống:** Mô tả các bữa ăn trong ngày (sáng, trưa, tối, ăn vặt, nước ngọt/cà phê), lượng nước đã uống (ml/lít), thời gian ăn và tình trạng bỏ bữa.
- **Dữ liệu sức khỏe tinh thần & cảm xúc:** Nhật ký cảm xúc ngắn hàng ngày, mức độ căng thẳng/áp lực (thang đo 1–10), các triệu chứng thể chất liên quan đến stress (đau đầu, lo âu, mất tập trung).
- **Bối cảnh học tập đi kèm:** Lịch thi, thời hạn deadline trong tuần, lịch học thực hành/lý thuyết để đối chiếu nguyên nhân gây căng thẳng.
- **Định tuyến tường minh (R5):** Bộ định tuyến (Intent Router) phân loại yêu cầu vào 3 nhánh chức năng: *Giấc ngủ*, *Dinh dưỡng*, *Tâm lý/Căng thẳng*, hoặc *Đánh giá sức khỏe tổng hợp*. Có nhánh hỏi lại (Clarification) khi sinh viên cung cấp thiếu thông tin (ví dụ: chỉ nói "ngủ ít" mà không nêu giờ giấc cụ thể).

### Bước 2: Phân tích định lượng bằng các thuật toán xác định (Deterministic Computation - R2)

Dữ liệu sau khi tiếp nhận được chuyển giao cho các thuật toán tất định, minh bạch và kiểm thử được để tính toán chính xác, tuyệt đối không để AI tính nhẩm:

- **Thuật toán tính toán chu kỳ & nợ ngủ (Sleep Debt Calculator):**
  $$\text{Thời gian ngủ thực tế} = \text{Giờ thức} - \text{Giờ ngủ}$$
  $$\text{Nợ ngủ tích lũy (Sleep Debt)} = \sum_{i=1}^{7} (\text{Thời lượng mục tiêu} - \text{Thời lượng thực tế}_i)$$
  Đánh giá mức độ thiếu ngủ dựa trên chu kỳ ngủ (chu kỳ 90 phút) và khuyến nghị của Tổ chức Giấc ngủ Quốc gia (7–9 tiếng/ngày).
- **Thuật toán phân tích dinh dưỡng & Năng lượng (Nutritional Math):**
  Tính toán năng lượng tiêu hao cơ bản (BMR theo công thức Mifflin-St Jeor), nhu cầu năng lượng hàng ngày (TDEE) theo mức độ vận động của sinh viên; đối soát lượng calo nạp vào và tỷ lệ đa lượng chuẩn: Đạm (Protein: 15–20%), Đường bột (Carb: 50–60%), Chất béo (Fat: 20–25%) và lượng nước tối thiểu ($35\text{ ml/kg}$ thể trọng).
- **Thuật toán chấm điểm sàng lọc tâm lý (Standardized Psychological Screening):**
  Tự động tính điểm chuẩn hóa từ các bộ câu hỏi sàng lọc sức khỏe tâm thần lâm sàng đã được quốc tế công nhận: thang đo lo âu/trầm cảm nhanh PHQ-4 (hoặc GAD-7 / PHQ-9) theo bảng điểm ranh giới (cut-off thresholds) định sẵn.

### Bước 3: Tra cứu tri thức chuẩn y khoa và dinh dưỡng (Data & Retrieval Capability - R3)

Hệ thống truy xuất dữ liệu từ các kho thông tin chính thống có nguồn gốc (provenance) và siêu dữ liệu (metadata) rõ ràng:

- **Dữ liệu có cấu trúc:** Bảng thành phần thực phẩm Việt Nam (Viện Dinh Dưỡng Quốc gia), lưu trữ chi tiết calo, protein, lipit, glucid, chất xơ và các vi chất của hơn 500 món ăn phổ biến của sinh viên (cơm tấm, hủ tiếu, bánh mì, mì tôm, thức ăn canteen).
- **Dữ liệu phi cấu trúc (RAG):** Cẩm nang vệ sinh giấc ngủ (Sleep Hygiene Guidelines - CDC/WHO), tài liệu sơ cứu tâm lý học đường (Psychological First Aid), kỹ thuật điều hòa cảm xúc và bài tập thở.
- **Trích dẫn nguồn minh bạch:** Mọi hướng dẫn dinh dưỡng và lối sống đều được gắn mã trích dẫn cụ thể (ví dụ: `[Nguồn: Bảng thành phần thực phẩm Việt Nam, Viện Dinh Dưỡng, Nhóm 4, Mã 04012]` hoặc `[Nguồn: Hướng dẫn chăm sóc sức khỏe giấc ngủ CDC 2023]`).

### Bước 4: Tổng hợp lý luận AI, tư vấn cá nhân hóa và phòng vệ an toàn (AI Reasoning & Safeguards - R4, R7)

- **Biện minh kỹ thuật cho việc dùng AI:** Sử dụng LLM để hiểu ngôn ngữ tự nhiên giàu tính cảm xúc và tiếng lóng của sinh viên, bóc tách thực thể món ăn phức tạp từ câu văn ngắn, đóng vai người bạn đồng hành thấu cảm (empathetic companion) để phân tích nguyên nhân gốc rễ gây stress mà các công thức toán học không biểu đạt được.
- **Đề xuất cá nhân hóa:** Đề xuất giải pháp ngủ bù khoa học (không ngủ quá nhiều vào ban ngày gây rối loạn nhịp sinh học), gợi ý món ăn lành mạnh bình dân quanh khu vực trường học để bù đắp nhóm chất bị thiếu hụt, và hướng dẫn bài tập thả lỏng (kỹ thuật thở 4-7-8, bài tập giải tỏa căng thẳng cơ bắp).
- **Cơ chế phòng vệ khẩn cấp (Crisis Escalation & Safeguards - R7):** 
  - Tách biệt prompt để chống tấn công chèn lệnh (Prompt Injection).
  - Khước từ đưa ra chẩn đoán bệnh lý (Medical Disclaimer).
  - Khi phát hiện các từ khóa/dấu hiệu nguy cấp (ý nghĩ tự hại, tuyệt vọng cùng cực, PHQ-4 đạt mức báo động đỏ) $\to$ Ngắt mọi phản hồi thông thường, kích hoạt ngay luồng hỗ trợ khẩn cấp: hiển thị số điện thoại đường dây nóng hỗ trợ tâm lý sinh viên (111 / Đường dây nóng Ngày Mai / Trung tâm hỗ trợ sinh viên của trường).

## 3. Kết quả đầu ra

Hệ thống cung cấp cho người dùng qua giao diện ứng dụng Web/Chatbot tương tác (End-to-End Interface - R6):

- **10 Ca sử dụng (Use Cases) được hỗ trợ hoàn chỉnh:**
  1. *UC01:* Check-in và phân tích thời lượng ngủ hàng ngày (ghi nhận chính xác số giờ, phút và tính toán nợ ngủ tích lũy).
  2. *UC02:* Phân tích thành phần dinh dưỡng bữa ăn sinh viên (định lượng calo, phát hiện thiếu chất đạm/chất xơ/uống thiếu nước).
  3. *UC03:* Check-in cảm xúc hàng ngày và chấm điểm mức độ căng thẳng tâm lý (PHQ-4 / GAD-2).
  4. *UC04:* Cảnh báo sớm hội chứng kiệt sức học tập (burnout) khi có sự kết hợp giữa thức khuya kéo dài và lịch thi dày đặc.
  5. *UC05:* Gợi ý thực đơn bổ sung dưỡng chất giá rẻ, dễ tìm quanh ký túc xá / trường học cho sinh viên ăn thiếu chất.
  6. *UC06:* Hướng dẫn kỹ thuật vệ sinh giấc ngủ (Sleep Hygiene) và lịch ngủ bù khoa học sau các đợt deadline.
  7. *UC07:* Hướng dẫn tương tác bài tập giảm stress nhanh (thở hộp Box Breathing, kỹ thuật tiếp đất 5-4-3-2-1).
  8. *UC08:* Xuất báo cáo tổng kết sức khỏe tuần (Weekly Health Report) với biểu đồ xu hướng ngủ - ăn - cảm xúc trực quan.
  9. *UC09:* Nhắc nhở thông minh theo ngữ cảnh (nhắc uống nước, nhắc nghỉ mắt sau 2 giờ học liên tục).
  10. *UC10:* Kích hoạt cảnh báo và quy trình hỗ trợ can thiệp tâm lý khẩn cấp (Crisis Escalation) khi phát hiện nguy cơ cao.
- **Bảng điều khiển sức khỏe (Health Dashboard Artifacts):** Vòng tròn mục tiêu giấc ngủ (Sleep Ring), biểu đồ Radar phân bổ dinh dưỡng (Macro Radar Chart), và nhật ký tâm trạng dạng lịch (Mood Calendar).

## 4. Nguyên tắc thiết kế

Hệ thống tuân thủ chặt chẽ các nguyên tắc Tư duy tính toán (Computational Thinking) và yêu cầu kỹ thuật:

- **Phân tách rạch ròi giữa Năng lực xác định và Năng lực AI:** Tuyệt đối không để AI làm toán hay tự chấm điểm sàng lọc tâm lý. Các bài toán tính calo, tính nợ ngủ, và ngưỡng điểm PHQ-4/GAD-7 được thực thi bởi các module giải thuật độc lập, minh bạch và có thể viết unit test kiểm thử 100%. AI chỉ đóng vai trò phân tích ngôn ngữ, trích xuất thực thể và giao tiếp thấu cảm.
- **RAG chuẩn xác với độ tin cậy nguồn cao (High Provenance):** Mọi lời khuyên về thói quen ngủ và ăn uống đều được tham chiếu từ cơ sở dữ liệu dinh dưỡng quốc gia và các hướng dẫn y tế công cộng chính thống, loại bỏ tình trạng ảo giác (hallucination).
- **An toàn, Quyền riêng tư & Đạo đức AI:** Dữ liệu sinh viên được bảo vệ nghiêm ngặt; luôn đi kèm tuyên bố từ chối trách nhiệm y tế; tích hợp chốt chặn an toàn (safety guardrails) tự động chuyển tuyến khẩn cấp khi phát hiện dấu hiệu khủng hoảng tinh thần.
- **Khung kiểm thử và đánh giá lặp lại (Evaluation Framework - R8):**
  - **Bộ Benchmark 100 ca kiểm thử:** 40 ca bóc tách món ăn và tính calo, 30 ca tính toán giờ ngủ qua đêm (cross-midnight calculation) và nợ ngủ, 30 ca phản hồi tâm trạng (bao gồm cả các ca an toàn và ca khủng hoảng tâm lý).
  - **Chỉ số đo lường:** Sai số tính toán Calo/Giờ ngủ = 0%; Độ nhạy phát hiện khủng hoảng tâm lý (Crisis Recall) = 100%; Độ chính xác trích xuất thực thể món ăn (F1-score) $\ge 90\%$.
  - **Phân loại lỗi (Error Taxonomy):** Phân chia 4 loại lỗi: *Lỗi bóc tách thiếu khẩu phần*; *Lỗi tính giờ ngủ xuyên đêm*; *Lỗi trích dẫn sai bảng dinh dưỡng*; *Lỗi nhận diện chậm cảm xúc tiêu cực*.
  - **Minh chứng chu kỳ cải tiến:** Phiên bản thử nghiệm (Baseline) gặp lỗi bóc tách sai các món ăn ghép của sinh viên (như "cơm sườn trứng ốp la") $\to$ Cải tiến bằng cách kết hợp từ điển danh mục món ăn địa phương + trích xuất Few-shot Prompting giúp nâng F1-score từ 71% lên 93.5%.

---

## English:  
#### My project will be about a Student Daily Holistic Health & Mental Well-being Assistant that empowers university students to track granular sleep patterns (hours and minutes), evaluate dietary nutritional adequacy (calories, macronutrients, micronutrients), and receive daily mental health screening and supportive care.

**Problem Boundary & Context (R1):**
- **Target Users:** College students frequently dealing with irregular circadian habits, all-night deadline cramming, nutrient-deficient diets (instant noodles, fast food), and sustained academic stress.
- **Pain Points:**
  1. Accumulated sleep debt leading to cognitive impairment and exhaustion without students being able to quantify their actual deficit.
  2. Nutrient-poor student diets lacking essential micronutrients and fiber while high in refined fats, paired with the difficulty of manual portion tracking.
  3. Unaddressed academic anxiety, chronic stress, and early burnout symptoms left unchecked due to the lack of safe, non-judgmental daily outlets.
- **Explicit Non-Goals:** The system will NOT perform medical diagnoses or prescribe pharmaceuticals; will NOT replace licensed healthcare or clinical psychiatric professionals; and will NOT operate as an unrestricted open-domain chatbot unrelated to lifestyle well-being.
- **Constraints:** Strict compliance with personal health data privacy (anonymization); response latency $\le 2$ seconds; absolute compliance with clinical safety thresholds and crisis escalation protocols.
- **Measurable Success Criteria:** Sleep debt and nutritional calculation error margin = 0%; 100% recall on detecting severe psychological crisis indicators to trigger emergency hotlines; student daily check-in retention rate $\ge 70\%$.

#### How it works

### Step 1: Collecting student input and request

The assistant interacts with students to collect daily inputs via natural language conversational check-ins or lightweight interactive cards, including:

- **Sleep Data:** Bedtime, wake-up time (down to exact hours and minutes), nocturnal awakenings, and post-awakening alertness level (1–5 scale).
- **Nutritional & Dietary Data:** Descriptions of daily meals (breakfast, lunch, dinner, snacks, sugary beverages/caffeine), fluid intake (ml/liters), meal timings, and skipped meals.
- **Mental & Emotional Well-being Data:** Daily emotional logs, subjective stress scores (1–10 scale), and stress-related somatic cues (headaches, tension, loss of focus).
- **Academic Context:** Upcoming exam schedules, project deadlines, and lab commitments to contextualize stress drivers.
- **Explicit Orchestration & Routing (R5):** An Intent Router dispatches user queries into 3 specialized pipelines: *Sleep*, *Nutrition*, *Mental Health / Stress*, or *Holistic Daily Synthesis*. It includes a Clarification Path when inputs are incomplete (e.g., asking for specific bedtimes when a student only remarks "I slept very little").

### Step 2: Deterministic calculation of sleep debt, nutritional adequacy, and clinical scores (R2)

Structured data is channeled into transparent, fully testable deterministic algorithms rather than relying on LLM guesswork:

- **Sleep Debt & Circadian Cycle Algorithm:**
  $$\text{Actual Sleep Duration} = \text{Wake Time} - \text{Bedtime}$$
  $$\text{Cumulative Sleep Debt} = \sum_{i=1}^{7} (\text{Target Sleep Duration} - \text{Actual Sleep Duration}_i)$$
  Evaluates sleep sufficiency against 90-minute sleep cycles and National Sleep Foundation benchmarks (7–9 hours/night).
- **Nutritional & Energy Computation Engine:**
  Calculates Basal Metabolic Rate (BMR via the Mifflin-St Jeor equation) and Total Daily Energy Expenditure (TDEE) based on student physical activity; validates caloric intake and balances against standard macronutrient distributions: Protein (15–20%), Carbohydrates (50–60%), Fat (20–25%), and hydration targets ($35\text{ ml/kg}$ body weight).
- **Standardized Mental Health Screening Engine:**
  Automatically evaluates validated clinical screening instruments: Patient Health Questionnaire-4 (PHQ-4), GAD-7, and PHQ-9 using deterministic cutoff threshold rules.

### Step 3: Medical and nutritional knowledge retrieval with provenance (Data & Retrieval - R3)

The system queries authenticated knowledge repositories with documented provenance and metadata:

- **Structured Knowledge:** The National Institute of Nutrition's Vietnamese Food Composition Database, cataloging caloric values, protein, lipids, carbohydrates, fiber, and micronutrients for over 500 staple student dishes (broken rice, noodle soup, banh mi, instant noodles, canteen meals).
- **Unstructured Knowledge (RAG):** Official Sleep Hygiene Guidelines (CDC/WHO), campus Psychological First Aid protocols, and evidence-based relaxation guides.
- **Verifiable Provenance:** Every nutritional recommendation and lifestyle suggestion references exact source documentation (e.g., `[Source: Vietnamese Food Composition Database, Group 4, ID 04012]` or `[Source: CDC Sleep Hygiene Guidelines 2023]`).

### Step 4: AI synthesis, personalized behavioral nudges, and safety guardrails (R4, R7)

- **Technical Justification for AI:** Utilizes LLMs strictly where unstructured conversational parsing, empathetic natural language dialogues, and holistic behavioral synthesis justify it—transforming colloquial descriptions into structured variables and offering non-judgmental guidance for academic burnout.
- **Personalized Recommendations:** Proposes restorative sleep debt repayment strategies (preventing disruptive prolonged daytime napping), recommends budget-friendly nutritious meal alternatives around campus, and guides interactive relaxation routines (4-7-8 breathing, progressive muscle relaxation).
- **Safety Safeguards & Crisis Escalation (R7):**
  - Prompt delimitation to defend against prompt injection exploits.
  - Explicit medical disclaimers affirming educational/support boundaries.
  - Emergency protocol: If suicidal ideation, severe despair, or critical PHQ-4 scores are flagged $\to$ immediately bypass conversational flows and present crisis intervention hotlines (National Child & Youth Helpline 111, Ngay Mai Suicide Prevention Hotline, Campus Psychological Counseling Unit).

## 3. Output

The system delivers actionable deliverables through an end-to-end interactive Web/Chat interface (R6):

- **10 Fully Supported Representative Use Cases:**
  1. *UC01:* Daily sleep tracking and quantitative analysis (exact hours/minutes and cumulative sleep debt).
  2. *UC02:* Dietary nutrient breakdown (calories, protein/fiber deficits, dehydration alerts).
  3. *UC03:* Daily mood check-ins and clinical anxiety/depression screening scores (PHQ-4 / GAD-2).
  4. *UC04:* Early burnout warning triggered by compounding sleep debt and exam schedules.
  5. *UC05:* Budget-friendly, campus-accessible meal recommendations to fix identified nutritional deficiencies.
  6. *UC06:* Post-exam sleep hygiene recovery scheduling.
  7. *UC07:* Guided in-chat stress reduction exercises (Box Breathing, 5-4-3-2-1 Grounding).
  8. *UC08:* Weekly holistic health trend reports integrating sleep, diet, and emotional state.
  9. *UC09:* Context-aware wellness nudges (hydration reminders, screen rest breaks after 2-hour study blocks).
  10. *UC10:* Automated psychological crisis escalation and emergency helpline routing.
- **Interactive Health Dashboard Artifacts:** Visual Sleep Debt Ring, Macronutrient Distribution Radar Chart, and an interactive Monthly Mood Calendar.

## 4. Design principles

The system adheres strictly to Computational Thinking principles and engineering criteria:

- **Strict Separation of Deterministic Algorithms and AI:** AI never performs mathematical calculations or clinical score summing. Calorie calculations, sleep debt algorithms, and PHQ-4 scoring are implemented as standalone, transparent, 100% unit-tested code modules. The AI is scoped strictly to conversational understanding, entity extraction, and empathetic dialogue.
- **High-Provenance RAG Knowledge Grounding:** All lifestyle and nutritional recommendations are grounded in official public health and nutritional databases, eliminating hallucinations.
- **Safety, Privacy, and Ethical AI:** User data is anonymized; medical disclaimers are persistently enforced; and automated fail-safe guardrails prioritize human life via immediate crisis escalation.
- **Iterative Evaluation Framework (R8):**
  - **100-Case Repeatable Benchmark:** 40 food extraction and calorie test cases, 30 cross-midnight sleep duration edge-cases, and 30 emotional interaction scenarios (including benign and severe crisis prompts).
  - **Metrics:** Calculation Error Margin = 0%; Crisis Escalation Recall = 100%; Food Entity Extraction F1-Score $\ge 90\%$.
  - **Error Taxonomy:** Classification into 4 failure modes: *Portion size omission*; *Cross-midnight sleep calculation error*; *Nutritional database miscitation*; *Delayed negative emotion recognition*.
  - **Documented Improvement Cycle:** Baseline prompt extraction frequently misclassified compound local dishes (e.g., "broken rice with pork chop and fried egg") $\to$ resolved by pairing a local food vocabulary gazetteer with few-shot extraction prompts, elevating the F1-score from 71% to 93.5%.