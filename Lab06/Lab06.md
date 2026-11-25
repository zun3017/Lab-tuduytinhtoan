# Lab 06

**Họ và tên:** Hồ Hoàng Tiến Dũng · **MSSV:** 25127304  


## 1. Giới thiệu và phạm vi

Phần trình bày tập trung vào ba đóng góp của em gồm **Tổng quan**, **Khám phá món ăn** và **cơ sở dữ liệu món ăn**.

| Đóng góp | Người dùng làm được gì? | Mã nguồn đối chiếu |
| --- | --- | --- |
| **Tổng quan** | Xem bữa gợi ý, công thức, ngân sách và mục tiêu tự nấu. Ghi đã nấu hoặc bỏ qua bữa nếu ăn ngoài. | `source/js/overview-ui.js`, `css/overview.css`, `backend/overview.py` |
| **Khám phá món ăn** | Mở danh mục từ trang chủ hoặc dashboard, tìm món theo tên hay nguyên liệu, xem định lượng và cách nấu. | `source/kham-pha-mon-an.html`, `js/explore-dishes.js`, `css/explore-dishes.css` |
| **Cơ sở dữ liệu món ăn** | Cung cấp 77 món và 65 nguyên liệu, có phân loại chính, phụ và định lượng cho từng công thức. | [`catalog.sqlite3`](source/backend/data/catalog.sqlite3) |


## 2. Cách tính năng hoạt động

**Tổng quan.** Sau khi đăng nhập, trình duyệt đọc `GET /api/state` để lấy kế hoạch, bữa ăn, ngân sách và thống kê theo tài khoản. Bữa gợi ý dựa vào ngày đang mở và giờ Việt Nam. Bấm **Đã nấu bữa này** gọi lệnh ghi bữa tự nấu. **Chưa nấu** lưu trạng thái bỏ qua và chuyển đề xuất sang bữa khác. Backend bảo đảm cùng một bữa chỉ có một trạng thái. Mục tiêu tuần đếm số bữa tự nấu, chuỗi tự nấu đếm số ngày liên tiếp có ít nhất một bữa đã ghi nhận. Chuỗi truy cập ghi tối đa một lần mỗi tài khoản mỗi ngày khi người dùng mở dashboard.

**Khám phá món ăn.** Trang công khai gọi `GET /api/public/dishes` để lấy danh mục. Dashboard dùng danh mục đã tải qua API dành cho người đã đăng nhập. Hai màn hình dùng chung bộ hiển thị. Ô tìm kiếm chuẩn hóa dấu tiếng Việt và tìm theo tên món hoặc tên nguyên liệu. Thẻ món hiển thị ảnh, mô tả, lượng nguyên liệu và cách nấu. Danh mục tải sáu thẻ mỗi lượt hiển thị, người dùng có thể bấm **Xem thêm món** để xem tiếp.

**Cơ sở dữ liệu.** SQLite lưu tên, mô tả, ảnh, giá và cách nấu trong `dishes`. Bảng `ingredients` lưu danh mục nguyên liệu. `recipe_ingredients` liên kết món với nguyên liệu, định lượng, đơn vị, vai trò và thứ tự trong công thức. Bảng `dish_ingredients` hỗ trợ lượng nguyên liệu dùng khi lập kế hoạch. Bản nộp có **77 món và 65 nguyên liệu**. Định danh số giữ liên kết ổn định khi sửa tên hiển thị.

