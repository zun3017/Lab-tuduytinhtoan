# Quy tắc làm việc nhóm — Smart Budget Meal Planner

File này áp dụng cho mọi thành viên và mọi phiên Codex làm việc trong dự án. Đọc file này cùng `PROGESS.md` trước khi sửa mã.

## 1. Mục tiêu chung

Smart Budget Meal Planner là website hỗ trợ người dùng lên kế hoạch bữa ăn **đủ chất, tiết kiệm và hạn chế lãng phí nguyên liệu**.

Vibe cần giữ nhất quán:

- Sáng, thân thiện, thực tế và có định hướng rõ ràng.
- Nội dung giúp người dùng biết **bước tiếp theo cần làm**, không chỉ mang tính trang trí.
- Hiện đại, gọn gàng, lấy cảm hứng từ trang gợi ý bữa ăn/ngân sách; không rườm rà hoặc dùng quá nhiều hiệu ứng.
- Ngôn ngữ giao diện là tiếng Việt, ngắn gọn và dễ hiểu.

## 2. Quy tắc tránh xung đột khi làm nhóm

1. **Đọc `PROGESS.md` trước khi bắt đầu.** Xác định phần nào đã xong, phần nào chưa làm và ai/phần nào có thể đang được mở rộng.
2. **Mỗi người chỉ tập trung một tính năng hoặc một nhóm tệp trong một lượt.** Ví dụ: người làm Đăng nhập không tự ý sửa logic Đề xuất bữa tối.
3. **Không ghi đè hoặc xoá thay đổi không thuộc nhiệm vụ của mình.** Không dùng `git reset --hard`, không checkout đè tệp và không format toàn dự án nếu không cần thiết.
4. **Sửa ít nhất có thể ngoài phạm vi tính năng.** Nếu cần sửa tệp chung như `styles.css`, chỉ thêm selector/biến cần thiết; không đổi toàn bộ giao diện cũ.
5. **Luôn kiểm tra thay đổi trước khi bàn giao:** chạy kiểm tra cú pháp phù hợp, mở trang bị ảnh hưởng và kiểm tra responsive cơ bản.
6. **Cập nhật `PROGESS.md` sau khi hoàn thành.** Ghi phần đã làm, tệp thay đổi, phần còn dang dở và mọi quyết định mới.
7. **Nếu hai tính năng cần cùng sửa một tệp chung,** ưu tiên thêm phần CSS/JS có tiền tố riêng của tính năng thay vì đổi selector đang dùng ở nơi khác.
8. **Không tự ý đổi công nghệ nền.** Dự án hiện là HTML/CSS/JavaScript thuần; chỉ thêm framework/backend khi cả nhóm thống nhất.

## 3. Cấu trúc và trách nhiệm tệp

| Tệp | Vai trò | Lưu ý khi sửa |
| --- | --- | --- |
| `index.html` | Trang chủ | Giữ hero, CTA và thẻ gợi ý món ăn rõ ràng. |
| `about.html` | Trang Giới thiệu | Giới thiệu là trang riêng, không chuyển lại thành phần trong trang chủ. |
| `styles.css` | Style chung, responsive, design system | Không thay màu/font toàn cục nếu chưa thống nhất. |
| `script.js` | Menu mobile, ripple, toast | Giữ các hiệu ứng hiện có khi thêm logic mới. |
| `PROGESS.md` | Tiến độ/bàn giao | Cập nhật sau mỗi hạng mục đáng kể. |
| `AGENTS.md` | Quy tắc nhóm và style guide | Chỉ sửa khi có quyết định chung mới. |

### Navbar dùng chung

Navbar hiện được viết trực tiếp trong cả `index.html` và `about.html`. Khi đổi tên mục, thêm mục hoặc đổi giao diện navbar, cần cập nhật **cả hai tệp** để tránh lệch trải nghiệm.

## 4. Design system bắt buộc

### Font và kiểu chữ

- Chỉ dùng: `Arial, Helvetica, sans-serif`.
- Không import Google Fonts hoặc thêm font mới nếu chưa có quyết định chung.
- Tiêu đề: đậm, sans-serif, khoảng cách chữ hơi sát (`letter-spacing` âm nhẹ) để hiện đại và rõ ràng.
- Nội dung: cỡ chữ dễ đọc, màu xám muted; tránh đoạn văn quá dài.
- Nhãn nhỏ (eyebrow/label): in hoa, đậm, có khoảng cách chữ nhẹ.

### Bảng màu

| Vai trò | Mã màu | Cách dùng |
| --- | --- | --- |
| Chữ chính | `#24251f` | Tiêu đề, nội dung quan trọng. |
| Chữ phụ | `#65665e` | Mô tả, metadata, nội dung phụ. |
| Nền trang | `#f5f6f3` | Nền sáng chủ đạo. |
| Bề mặt trắng | `#ffffff` | Card, ô nội dung, nút phụ. |
| Navbar | `#414149` | Thanh điều hướng chính. |
| Thanh thông báo | `#161821` | Thanh phía trên navbar. |
| Xanh hành động | `#06c765` | CTA chính, giá/điểm nhấn tích cực. |
| Xanh đậm hover | `#00a955` | Hover hoặc trạng thái xanh đậm hơn. |
| Vàng nhấn | `#f2d600` | Nhãn nổi bật, thông tin “gợi ý trong tuần”. |
| Đường viền | `#dedfd9` | Border nhẹ cho card và khu vực phân tách. |

Quy tắc màu:

- Xanh lá chỉ dành cho hành động chính hoặc dữ liệu tích cực/quan trọng.
- Vàng chỉ là màu nhấn, không dùng làm nền chính của cả khu vực lớn.
- Không thêm màu neon, gradient sặc sỡ, đỏ/tím/xanh dương nổi bật nếu không có mục đích trạng thái rõ ràng.
- Dùng nền sáng, card trắng và border/shadow nhẹ để phân cấp nội dung.

### Thành phần giao diện

- **CTA chính:** nền xanh `#06c765`, chữ đậm màu tối, bo góc khoảng `8–9px`, có hover nâng nhẹ và active thu nhỏ.
- **Nút phụ:** nền trắng, border/shadow rất nhẹ; không cạnh tranh thị giác với CTA chính.
- **Card:** nền trắng, border `#dedfd9`, bo góc từ `8–24px` tuỳ ngữ cảnh; shadow mờ và nhẹ.
- **Navbar:** nền `#414149`, chữ trắng, nút hành động chính màu xanh.
- **Responsive:** dùng breakpoint hiện có `830px` và `680px` khi phù hợp. Trên mobile, ưu tiên một cột, khoảng cách thoáng và menu thu gọn.

## 5. Hành vi và trải nghiệm người dùng

- Giữ hiệu ứng hover đổi màu/nâng nhẹ, hiệu ứng bấm thu nhỏ và ripple cho các nút tương tác.
- Chức năng chưa xây xong phải hiển thị toast hoặc trạng thái rõ ràng; không tạo cảm giác nút bị hỏng.
- Nút/CTA mới phải có nhãn hành động cụ thể, ví dụ: “Xem gợi ý”, “Lưu kế hoạch”, “Tiếp tục”. Tránh “Bấm vào đây”.
- Mỗi trang tính năng mới nên có: tiêu đề rõ mục tiêu, mô tả ngắn, CTA chính và trạng thái rỗng/lỗi phù hợp.
- Giữ khả năng dùng bàn phím cơ bản: dùng thẻ `button` cho hành động và `a` cho điều hướng thật.

## 6. Quy trình bàn giao tối thiểu

Trước khi báo hoàn thành một thay đổi:

1. Kiểm tra JavaScript bằng `node --check script.js` nếu có sửa JS.
2. Mở các trang đã ảnh hưởng qua server cục bộ và kiểm tra không lỗi rõ ràng.
3. Kiểm tra desktop và một kích thước mobile.
4. Chạy `git diff --check` để phát hiện khoảng trắng/lỗi diff.
5. Cập nhật `PROGESS.md` với thay đổi và việc còn lại.

Chạy web cục bộ từ thư mục dự án:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Sau đó mở `http://127.0.0.1:8000`.
