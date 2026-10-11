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