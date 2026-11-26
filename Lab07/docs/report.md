# Báo cáo Lab07 – ZunTutor và Google Cloud Translation API

Ngày cập nhật 26/11/2026. Tác giả cần bổ sung họ tên, mã sinh viên và lớp trước khi nộp.

## 1. Mục tiêu và sản phẩm

ZunTutor Lab07 là website hỗ trợ quản lý dạy kèm. Gia sư quản lý học sinh, lịch dạy, bài tập, điểm và học phí. Phụ huynh/học sinh tra cứu kết quả học tập, xem thông báo và gửi phản hồi. Cổng Bài tập hỗ trợ xem đề, nộp tệp, sửa bài chưa chấm và đọc nhận xét.

Sản phẩm sử dụng Google Cloud Translation Basic v2 để dịch hai trang PH/HS và Bài tập sau đăng nhập. Đây là lựa chọn tích hợp một trong hai API được giới thiệu trong đề. Nội dung giao diện và văn bản từ database như tên bài, mô tả và nhận xét được đưa vào luồng dịch. Nội dung trong tệp đính kèm giữ nguyên.

## 2. Công nghệ và kiến trúc

Python Flask cung cấp máy chủ, session và API nghiệp vụ. SQLite lưu dữ liệu trong instance/lab07.sqlite3. HTML/CSS/JavaScript cung cấp giao diện, Chart.js vẽ biểu đồ và FullCalendar trình bày lịch. Các thư viện giao diện cần thiết được đóng gói trong public/vendor.

Trình duyệt gọi API cùng nguồn trên Flask. Chỉ máy chủ liên hệ Google Cloud Translation qua HTTPS. Khóa được đọc từ .env và không gửi xuống JavaScript. Các API kiểm tra phiên và vai trò, bao gồm phạm vi học sinh và mã bài tập.

Mã nguồn chính gồm app.py, server/, public/, requirements.txt và .env.example. README.md hướng dẫn cài đặt từ máy mới. Database mẫu được tạo tự động để người chấm có thể chạy thử.

## 3. Tích hợp Google Cloud Translation

Người dùng chọn Language ở PH/HS hoặc Bài tập sau khi đăng nhập. public/js/lang-all.js thu thập chữ trên trang, nhãn, placeholder và dữ liệu biểu đồ. MutationObserver theo dõi nội dung phát sinh khi đổi tháng, mở hộp thoại hoặc cập nhật dữ liệu.

Trình duyệt gửi POST /api/translate/ui với page, target và texts. Máy chủ xác minh vai trò, ngôn ngữ và giới hạn dữ liệu đầu vào. Hỗ trợ vi, en, ja và ko.

server/translation.py loại bỏ nội dung trùng thông qua khóa hash và tra cứu cache SQLite. Những đoạn chưa có bản dịch được gửi theo lô tối đa 128 mục đến POST https://translation.googleapis.com/language/translate/v2. Nội dung yêu cầu gồm q, source=vi, target và format=text. Khóa được gửi bằng header X-Goog-Api-Key.

Máy chủ kiểm tra số lượng kết quả và từng chuỗi trả về trước khi lưu cache. Từng lô thành công được lưu để tái sử dụng khi thử lại. Cache Google dùng tiền tố riêng, tránh dùng bản dịch từ nhà cung cấp thử nghiệm trước đó.

Trình duyệt giữ bản gốc, áp bản dịch khi đủ kết quả và phục hồi tiếng Việt khi chọn vi. Nếu dịch vụ lỗi, trang phục hồi bản gốc và hiển thị thông báo. Nội dung nghiệp vụ gốc trong database được giữ để gia sư chỉnh sửa.

## 4. Cài đặt và tái hiện

Cần Python 3.9 trở lên và trình duyệt hiện đại. Giải nén Lab07-submit.zip, mở terminal tại thư mục chứa app.py rồi thực hiện theo README.md.

Tạo môi trường ảo bằng python -m venv .venv. Cài thư viện bằng .venv/Scripts/python.exe -m pip install -r requirements.txt. Sao chép .env.example thành .env, điền GOOGLE_TRANSLATE_API_KEY hợp lệ. Khóa cần thuộc dự án đã bật Cloud Translation API và có cấu hình thanh toán phù hợp.

Chạy .venv/Scripts/python.exe app.py run rồi mở http://127.0.0.1:5000. Với macOS/Linux dùng .venv/bin/python. Khởi động lại Flask khi thay khóa.

Dữ liệu mẫu: gia sư GS0701/PIN 741963; quản trị QT0701/PIN 963852; PH/HS dùng HS0701 hoặc 0000701001; Bài tập dùng BT-SAO-07. Hai cổng học sinh không yêu cầu PIN.

## 5. Kiểm chứng và giới hạn

Đã kiểm tra bản Google với database mới, truy cập trang chủ, đăng nhập học sinh, định dạng yêu cầu Google API và cache. Phản hồi Google trong kiểm tra hợp đồng được mô phỏng. Tám kiểm thử nghiệp vụ đã đạt trước khi dọn thư mục test khỏi bản mã nguồn theo yêu cầu.

Trước khi chuyển sang Google Cloud Translation, bản thử nghiệm đã gọi TranslateAPI và Gemini thật. Kết quả thử nghiệm đó không phải bằng chứng đã gọi Cloud Translation thật.

Bản nộp hiện chưa có khóa Cloud Translation hợp lệ nên chưa xác minh dịch toàn trang qua Google thật. Người nộp cần điền khóa, chọn English trên hai cổng, kiểm tra tên bài và nhận xét, rồi quay lại đoạn minh chứng API thành công. Dịch máy vẫn cần rà soát chất lượng thuật ngữ.

Video docs/demo.webm trình diễn website và trạng thái thiếu khóa hiện tại. Video này minh họa thao tác và đường gọi API trong ứng dụng; chưa đáp ứng phần chứng minh Google dịch thành công. Hướng dẫn quay đoạn bổ sung nằm trong docs/demo-script.md.

## 6. Khai báo sử dụng AI

Đã sử dụng trợ lý AI hỗ trợ phân tích yêu cầu, chuyển giao diện ZunTutor sang Flask/SQLite, nối API, xây dựng cơ chế dịch, xử lý lỗi, chạy kiểm tra và soạn tài liệu. Gemini và TranslateAPI từng được dùng để thử chức năng dịch trước khi chuyển mã nguồn sang Google Cloud Translation.

Bản nộp hiện chỉ cấu hình Google Cloud Translation. Sinh viên cần đọc hiểu mã, kiểm tra kết quả và trình bày chính xác phần việc đã thực hiện, bao gồm mức độ hỗ trợ của AI. Nội dung báo cáo này cần được sinh viên rà soát trước khi nộp.

## 7. Lịch sử Git

Repository gốc là https://github.com/zun3017/Lab-tuduytinhtoan.git. Commit liên quan Lab07 đã đọc được là 915fa5e, ngày 25/11/2026 lúc 18:08:27 +07:00, tác giả zun3017, thông điệp lab 07.

Các thay đổi hiện tại chưa được commit tại thời điểm lập báo cáo. Không tạo lại lịch sử phát triển giả. docs/git-history.md ghi lịch sử quan sát được và trạng thái này. Người nộp cần commit phần đã rà soát và cung cấp repository cùng lịch sử thực tế theo đề.

## 8. Đối chiếu yêu cầu đề

Giải thích website và tích hợp API nằm trong báo cáo này. Mã nguồn nằm trong Lab07-submit.zip. Báo cáo có cả report.md và report.pdf. Khai báo AI nằm ở mục 6. Lịch sử Git nằm ở mục 7 và git-history.md.

Video thao tác có trong demo.webm, nhưng phần Google API thật vẫn chờ khóa hợp lệ để quay bổ sung. Thông tin sinh viên và commit cho các thay đổi hiện tại cũng cần hoàn tất trước khi nộp chính thức.
