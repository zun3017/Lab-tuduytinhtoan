## AI Usage Declaration by Hồ Hoàng Tiến Dũng
- **Gemini**: Flash, Google, truy cập 11:30 ngày 02/11/2026, 12:15 ngày 02/11/2026. 
#### Prompt 1: 
 "Dùng $impeccable:impeccable impeccable shape để thiết kế trang chủ theo yêu cầu dưới đây,
sau đó triển khai giao diện

MỤC TIÊU
Tạo trang meals, nổi bật và có chiều sâu thị giác.
Thiết kế có cá tính, thống nhất; tránh bố cục template đại trà.

PHẠM VI
- Chỉ làm frontend và tương tác UI.
- Giữ nguyên logic và dữ liệu hiện có.
- Làm theo stack của dự án, không tự thêm dependency không cần thiết.

THIẾT KẾ
1. Hero có tiêu đề rõ, hình ảnh hoặc đồ họa nổi bật và CTA chính.
2. Nhiều thẻ nội dung đa dạng: thẻ lớn/nhỏ, nội dung nổi bật,
   chỉ số và danh sách; có phân cấp, không nhồi mọi thứ vào các ô giống nhau..
3. Các section có nhịp điệu, khoảng trắng và điểm nhấn để người dùng
4. Animation nhẹ, hover tinh tế, chuyển cảnh mượt.
   Hỗ trợ prefers-reduced-motion, không gây chóng mặt hoặc cản đọc.
5. Responsive tốt trên điện thoại, tablet và desktop.
   Bảo đảm contrast, focus bàn phím và kích thước chữ dễ đọc.

QUY TRÌNH
- Đọc dự án và đề xuất hướng thiết kế trước khi sửa.
- Khi tôi duyệt hướng thiết kế, triển khai theo từng section.
- Dùng Chrome DevTools MCP kiểm tra bản render và screenshot.
- Kết thúc bằng polish; báo rõ phần đã kiểm tra và phần chưa kiểm tra.\"
#### Prompt 2:
" Một bữa được chọn nhiều món. Theo làm rõ mới nhất, hệ thống tự phân bổ và đề xuất các bữa sao cho tổng dự trù cả ngày không vượt ngân sách ngày; người dùng xem xét và đổi món. Không yêu cầu người dùng tự đặt tiền từng bữa. Người dùng được tự chọn vượt định mức, theo quy tắc dự trù/thực chi bên dưới.
- Chấp nhận tách dự trù và thực chi: ví dụ một lựa chọn vượt phần phân bổ 5.000đ thì báo chênh lệch và tính lại tiền có thể phân bổ cho các bữa/ngày còn lại. Theo làm rõ sau đó, giới hạn được kiểm tra ở tổng ngày, không bắt người dùng đặt tiền mỗi bữa. Chọn món không tạo giao dịch chi; chỉ ghi mua hàng mới trừ số tiền thực tế. Không trừ phần vượt một lần rồi trừ lại trong giao dịch mua hàng; không tạo quỹ dự phòng riêng.
- Hệ thống phải đề xuất thực đơn cho toàn bộ số ngày người dùng chọn, gồm các kỳ 7 ngày và 30 ngày. Thiết kế đã duyệt giữ 1–365 ngày, có nút nhanh 7/30 và ngày mô phỏng.
- Tách ghi nhận mua hàng và ghi nhận đã dùng: mua bổ sung tồn kho, sử dụng mới trừ lượng nguyên liệu. Không tiếp tục mặc định mua hàng đồng nghĩa đã nấu hết thực đơn."
---
- Nội Dung Có Sự Hỗ Trợ Của AI
  - Ở lần sử dụng thứ nhất, AI hỗ trợ loại bỏ các khối form cũ, sinh ra danh sách định lượng nguyên liệu cho 56 loại thực phẩm và ánh xạ ảnh minh họa cho 60 món ăn.
  - Ở lần sử dụng thứ hai, AI hỗ trợ cập nhật lại bảng giá của 60 món ăn trong file dữ liệu về mức chi phí thực tế tự nấu (8.000đ – 23.000đ).
  - Ở lần sử dụng thứ ba, AI hỗ trợ dọn dẹp mã nguồn CSS, khôi phục lại font chữ chuẩn `Arial, Helvetica, sans-serif` và loại bỏ hơn 1.200 dòng CSS dư thừa.
- Nội dung do sinh viên tự thực hiện và cách chỉnh sửa, kiểm chứng:
  - Đối với việc tinh gọn tính năng và định lượng: Sinh viên trực tiếp định hướng bài toán chỉ tập trung vào đề xuất món ăn cho 1 người, tự rà soát danh sách định lượng nguyên liệu (1 củ cà rốt, 1 quả trứng, 120g thịt heo...) để đảm bảo sát với thực tế khi đi chợ.
  - Đối với việc điều chỉnh giá: Sinh viên tự khảo sát giá đi chợ thực tế, phát hiện mức giá AI đưa ra ban đầu quá cao (trên 30.000đ) và chủ động yêu cầu AI điều chỉnh lại toàn bộ bảng giá về mức sinh viên tự nấu tiết kiệm (8.000đ – 23.000đ).
  - Đối với việc đồng bộ giao diện và kiểm thử: Sinh viên trực tiếp kiểm tra lại giao diện trên trình duyệt ở cả Desktop và Mobile (responsive <= 830px), chạy bộ kiểm thử tự động `node --test meals.test.js` đạt 10/10 test case, sau đó tự commit và push code lên nhánh `feature/Dung`.
