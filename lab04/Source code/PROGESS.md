# Tiến độ dự án — Smart Budget Meal Planner

> Cập nhật lần cuối: 03/11/2026
>
> Mục đích: File này là bản bàn giao ngắn gọn để một thành viên hoặc Codex ở phiên khác hiểu trạng thái dự án mà không cần đọc toàn bộ mã nguồn trước.

## 1. Dự án đang làm gì?

Đây là website hỗ trợ người dùng lập kế hoạch bữa ăn theo ngân sách, tận dụng nguyên liệu có sẵn và hạn chế lãng phí thực phẩm.

Đã có **giao diện trang chủ**, **trang Giới thiệu** và **tính năng đề xuất bữa ăn đơn giản** dùng dữ liệu giả chạy ngay trên trình duyệt.

## 2. Những gì đã hoàn thành

### Thanh chọn ngày — 03/11/2026

- Trang meals mặc định lập 7 ngày để hiện sẵn nút **Ngày 1–Ngày 7** như ảnh người dùng đưa; có thể đổi số ngày bằng form hiện có. Không thêm ngày tháng hoặc ô chọn ngày bắt đầu.
- Nút ngày bo tròn, nền xanh nhạt; ngày đang xem nền xanh đậm chữ trắng. Trên điện thoại, nút xuống hàng khi cần.
- Chrome DevTools MCP kiểm tra đủ 7 nút ban đầu, chọn Ngày 7 đổi đúng thực đơn/trạng thái, reset trở về 7 ngày, desktop/mobile không tràn ngang và không có console warning/error. Không sửa logic đề xuất hoặc file ngoài meals; cập nhật bàn giao này.

### Giao diện chung

- Tạo website HTML/CSS/JavaScript thuần, không dùng framework hay thư viện cài đặt ngoài.
- Giao diện dùng một font sans-serif mặc định của hệ thống.
- Thiết kế tông sáng với màu nhấn xanh lá, vàng và thanh điều hướng màu xám đậm.
- Responsive cho desktop và mobile; ở màn hình hẹp navbar chuyển thành menu thu gọn.

### Navbar

- Tên web: **Smart Budget Meal Planner**.
- Các mục đang hiển thị: **Giới thiệu**, **Đăng ký**, **Đăng nhập**, **Đề xuất bữa ăn đơn giản**.
- Mục **Giới thiệu** dẫn tới trang riêng `about.html` theo yêu cầu của người dùng.
- Mục **Đề xuất bữa ăn đơn giản** trên cả trang chủ và Giới thiệu dẫn tới `meals.html`.
- Đăng ký và Đăng nhập vẫn hiển thị thông báo “đang được nhóm phát triển”.

### Trang chủ (`index.html`)

- Có thanh thông báo tối phía trên navbar.
- Hero chính hiển thị thông điệp: **“Ăn đủ, tiết kiệm, không bỏ phí nguyên liệu.”**
- Có mô tả ngắn và nút **“Bắt đầu lập kế hoạch”**.
- Bên phải là thẻ gợi ý món ăn mẫu, hiển thị tên món, thời gian, số người ăn, tổng tiền và chi phí mỗi phần.
- Phần hình món ăn hiện là **khung/placeholder bằng CSS**. Có ghi chú rõ trong HTML để nhóm thay bằng ảnh thật sau này.
- Nút “Lập kế hoạch tuần”, khung chọn ngân sách và phần “Cách hoạt động” đã được **loại bỏ** theo yêu cầu mới nhất.

### Trang giới thiệu (`about.html`)

- Có nội dung về vấn đề, mục tiêu và hướng phát triển dự án.
- Dùng chung navbar và stylesheet với trang chủ.

### Tương tác đang có (`script.js`)

- Navbar/menu mobile có thể mở và đóng.
- Các nút chức năng có hiệu ứng hover, nhấn thu nhỏ và ripple.
- Các tính năng chưa phát triển chỉ hiện toast; chưa có đăng ký, đăng nhập hay API. Logic đề xuất được tách riêng trong `meals.js`.

### Đề xuất bữa ăn đơn giản (`meals.html`) — 01/11/2026

- Database giả `meals-data.js`: **60 món khác nhau**, gồm 20 món thịt, 20 món cá/hải sản, 20 món chay. Mỗi món có ID, tên, chi phí nguyên liệu ước tính cho một người, thời gian, loại món, nguyên liệu chính và cách làm ngắn.
- Nhập tổng ngân sách, số người (1–20), thời gian nấu tối đa, loại món và nguyên liệu có sẵn (tuỳ chọn).
- Chỉ trả món có chi phí một người × số người không vượt tổng ngân sách và khớp các bộ lọc.
- Ưu tiên số nguyên liệu trùng, sau đó giá thấp hơn và thời gian ngắn hơn. Nhận nguyên liệu không dấu, bỏ qua hoa/thường; hỗ trợ `đậu phụ`/`đậu hũ` và `thịt lợn`/`thịt heo`.
- Hiển thị tổng giá, giá/người, nguyên liệu, nguyên liệu đang có và phần mở rộng cách làm; mỗi lần xem 6 món, có nút xem thêm.
- Tự hiển thị 6 gợi ý theo thông tin mặc định ngay khi mở trang, không cần nhập hoặc bấm nút; không giành focus bàn phím.
- Có trạng thái không tìm thấy món và kiểm tra đầu vào; dùng được trên desktop/mobile và bàn phím.
- Ô **Nguyên liệu không ăn** hỗ trợ không dấu, dấu phẩy/chấm phẩy/xuống dòng. `hành` áp dụng cho hành lá, hành tím, hành tây; `cá` áp dụng các loại cá trong dữ liệu, không nhầm với cà chua.
- Phân biệt nguyên liệu chính/phụ bằng metadata `optionalIngredients` từng món. Hành lá, hành tím, tỏi và hành tây có thể bỏ ở các món cho phép; hành tây vẫn là nguyên liệu chính của **Cơm bò xào hành tây**. Nguyên liệu không được đánh dấu phụ được coi là thành phần chính.
- Nếu không ăn nguyên liệu phụ: giữ món, bỏ nguyên liệu khỏi danh sách dùng/mua, điểm khớp nguyên liệu và chỉnh cách làm theo quy tắc câu đã biên soạn trong `optionalStepEdits`. Nếu không ăn nguyên liệu chính: loại món. Không chỉnh sửa database gốc khi lọc.
- Hiển thị **Cần mua thêm**, trừ nguyên liệu đang có và nguyên liệu đã bỏ. Chi phí vẫn là ước tính ban đầu, chưa giảm giá sau khi bỏ nguyên liệu phụ.
- Mỗi kết quả là một món hoặc món ăn kèm cơm; chưa ghép thực đơn nhiều món. Chi phí tính cả nguyên liệu có sẵn, chưa trừ nguyên liệu hoặc tính định lượng. Thời gian của món dùng cơm đã nấu được ghi rõ trong cách làm.
- Không gọi API, không cần cài thư viện hoặc backend; mở `meals.html` trực tiếp cũng dùng được.

## 3. Những phần còn dang dở

| Hạng mục | Trạng thái | Việc cần làm |
| --- | --- | --- |
| Đăng ký | Chưa làm | Tạo form, kiểm tra dữ liệu và lưu tài khoản. |
| Đăng nhập | Chưa làm | Tạo form, phiên đăng nhập và phân quyền phù hợp. |
| Đề xuất bữa ăn đơn giản | Đã làm bản dữ liệu giả | Có 60 món, lọc theo ngân sách/nguyên liệu/thời gian/loại món; sau này có thể thêm định lượng và ghép thực đơn. |
| Lập kế hoạch bữa ăn | Đã có bản dùng thử | Chọn 1–30 ngày, 1–4 bữa, số người, ngân sách, khẩu vị; xác nhận và đổi món từng ngày. Chưa lưu kế hoạch sau khi tải lại trang. |
| Ảnh món ăn | Có ảnh minh hoạ chung cho meals | Trang chủ vẫn dùng placeholder; meals dùng `assets/meal-hero.png`, chưa có ảnh riêng cho từng món. |
| Dữ liệu chi phí | Database giả 60 món | Giá chỉ để minh hoạ thuật toán; chưa kết nối dữ liệu thực tế. |
| Kiểm thử trình duyệt | Cơ bản | Nên kiểm tra thêm thủ công trên Chrome/Edge, điện thoại và các kích thước màn hình khác nhau. |

## 4. Cấu trúc tệp hiện tại

Danh sách này đã được đối chiếu với các tệp thực tế ngày 02/11/2026. Chỉ liệt kê tệp đang tồn tại, không bao gồm tệp hoặc thư mục đã xoá.

| Tệp | Vai trò |
| --- | --- |
| `index.html` | Trang chủ. |
| `about.html` | Trang Giới thiệu riêng. |
| `styles.css` | Giao diện chung, navbar, trang chủ và Giới thiệu. |
| `script.js` | Menu mobile, ripple và thông báo toast cho các nút chưa hoạt động. |
| `meals.html` | Form lập kế hoạch, thực đơn từng ngày, thư viện món và danh sách đi chợ. |
| `meals.css` | Giao diện và responsive riêng của meals, theo `AGENTS.md`. |
| `meals-data.js` | Database giả 60 món, không phụ thuộc mạng. |
| `meals.js` | Lọc/xếp hạng món, lập kế hoạch nhiều ngày, tính dự chi, xác nhận/đổi món và tương tác meals. |
| `assets/meal-hero.png` | Ảnh minh hoạ được các thẻ món trên meals sử dụng. |
| `PROGESS.md` | Bản ghi tiến độ và hướng bàn giao này. |
| `AGENTS.md` | Quy tắc làm việc nhóm và design system bắt buộc. Đọc trước khi sửa mã. |

## 5. Quy ước quan trọng khi phát triển tiếp

- Giữ giao diện đơn giản, sáng, rõ hướng dẫn; không thêm quá nhiều màu hoặc font mới.
- Giữ màu nhận diện hiện tại: xanh lá là hành động chính, vàng là nhãn nhấn, navbar xám đậm.
- Không biến các nút Đăng ký/Đăng nhập/Đề xuất thành chức năng giả. Khi triển khai, cần gắn luồng thật hoặc nói rõ là demo.
- Khi thay ảnh món ăn, giữ tỷ lệ và phần chữ/giá hiển thị rõ trên ảnh.
- Không xoá `about.html`: đây là yêu cầu rõ ràng rằng Giới thiệu là một trang riêng, không phải phần đầu trang chủ.
- Luôn đọc `AGENTS.md` trước khi bắt đầu một hạng mục mới để tránh xung đột tệp và lệch giao diện.

## 6. Cách chạy dự án

Mở `index.html` trực tiếp bằng trình duyệt, hoặc chạy server cục bộ tại thư mục dự án:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Sau đó truy cập `http://127.0.0.1:8000`.

## 7. Nhật ký thay đổi và kiểm tra (lịch sử)

Các ghi chép theo ngày bên dưới mô tả trạng thái tại thời điểm thực hiện, nên có thể nhắc đến tệp đã được xoá sau đó. Đây không phải cấu trúc hiện tại; danh sách tệp đang tồn tại nằm ở mục 4.

- `node --check script.js`: không có lỗi cú pháp JavaScript.
- `http://127.0.0.1:8000/`: trả về HTTP 200.
- `http://127.0.0.1:8000/about.html`: trả về HTTP 200.
- Đã kiểm tra không còn các phần bị yêu cầu xoá: nút Lập kế hoạch tuần, khung ngân sách và phần Cách hoạt động.

### Kiểm tra cho tính năng đề xuất — 01/11/2026

- `node --test meals.test.js`: 6 kiểm thử qua, bao gồm dữ liệu 60 món, tổng giá theo số người, giới hạn thời gian, khớp nguyên liệu không dấu, món chay, không có kết quả và đầu vào không hợp lệ.
- `node --check script.js`, `node --check meals-data.js`, `node --check meals.js`: không lỗi cú pháp.
- Đã mở bằng Chrome headless qua server Node cục bộ tạm: desktop 1440px và mobile 390px, không tràn ngang; đã xem ảnh chụp cả hai kích thước.
- Đã kiểm tra submit form, validation, mở cách làm, xem thêm, trạng thái rỗng, ưu tiên nguyên liệu, menu mobile và liên kết từ `index.html`/`about.html`. Không ghi nhận JavaScript exception trong các luồng này.
- `git diff --check`: không lỗi khoảng trắng.
- Detector giao diện có cảnh báo về Arial và shadow kế thừa; giữ nguyên theo design system trong `AGENTS.md`.
- Phạm vi thay đổi: thêm `meals.html`, `meals.css`, `meals-data.js`, `meals.js`, `meals.test.js`; chỉ đổi liên kết đề xuất trên navbar của `index.html`/`about.html`, thêm hai selector màu liên kết vào `styles.css`, cập nhật file tiến độ này. Không sửa `AGENTS.md` hoặc `script.js`.


### Thiết kế frontend meals — Bếp hôm nay — 01/11/2026

- Hướng thiết kế được người dùng duyệt trước khi sửa: hero bất đối xứng “Bữa ngon vừa túi tiền.”, ảnh bữa cơm, CTA dẫn đến khu chọn món; dải 60 món/3 nhóm món/tuỳ chỉnh khẩu vị; bộ lọc bên trái, món đầu nổi bật, hai món dạng thẻ và các món còn lại dạng danh sách.
- Giữ nguyên `meals.js`, `meals-data.js`, thứ tự kết quả, giá và toàn bộ quy tắc nguyên liệu. Không thêm dependency. Không sửa trang chủ, Giới thiệu hay stylesheet chung cho lượt thiết kế này.
- `meals.html`, `meals.css`: thay bố cục và style riêng trong trang meals, thêm liên kết bỏ qua phần đầu, footer và thông báo dữ liệu minh hoạ. Giữ menu dùng chung.
- `meals-ui.js`: tương tác UI riêng; dùng native details/summary cho bộ lọc, mặc định thu gọn ở <=830px; liên kết cuối trang tự mở bộ lọc và focus ô nguyên liệu. Resize không xoá dữ liệu người dùng đã nhập.

### Bổ sung yêu cầu hướng dẫn tính năng — 02/11/2026


- Giữ bố cục hiện có, database 60 món và bộ lọc nguyên liệu phụ. Chỉ sửa `meals.html`, `meals.css`, `meals.js`, thêm kiểm thử vào `meals.test.js`, cập nhật bàn giao này; không cài dependency.
- Kế hoạch thực hiện/đã hoàn thành: bổ sung đầu vào → tạo kế hoạch nhiều ngày có giới hạn tiền → chuyển ngày/xác nhận/thay món → thêm ảnh/giá/mô tả → kiểm tra trên Chrome và cập nhật tiến độ.
- Form: ngân sách **cả kỳ**, 1–30 ngày, số người, 1–4 bữa/ngày (sáng/trưa/tối/phụ), thời gian nấu, mức tiết kiệm/cân bằng/nhiều đạm, chọn nhiều sở thích: nhiều rau, nhiều đạm, không cay, không hải sản, không bò/heo/gà, ăn chay.
- Kết quả: tab từng ngày, ngân sách/ngày, dự chi từng ngày và cả kỳ, ngân sách còn sau dự chi. Hiển thị mức và sở thích đang áp dụng. Đây là dự chi minh hoạ, chưa theo dõi tiền thực chi.
- Mỗi ngày có trạng thái xác nhận độc lập; từng món có nút thay/bỏ, từng bữa có thể thêm món từ thư viện. Thay món chỉ ảnh hưởng ngày đang chọn và xoá xác nhận của ngày đó. Nút tạo lại cả kỳ đặt lại toàn bộ kế hoạch/xác nhận.
- Thuật toán ưu tiên nguyên liệu đang có, mục tiêu nhiều rau/đạm theo nhóm nguyên liệu, rồi chi phí. Không tính kcal hoặc định lượng dinh dưỡng chính xác. Không cay lọc nguyên liệu cay được liệt kê và nhắc không thêm ớt/sa tế khi nêm; dữ liệu hiện tại không chứa món có nguyên liệu cay bắt buộc.
- Không tự sinh hoặc thêm món vượt ngân sách chia cho ngày/cả kỳ. Nếu không đủ tiền hoặc bộ lọc quá chặt, để trống bữa không có món, cảnh báo số bữa còn thiếu và không cho xác nhận ngày chưa đủ. Người dùng có thể tăng ngân sách hoặc nới điều kiện.
- Thẻ món có ảnh bữa cơm minh hoạ sẵn có (dùng chung, không phải ảnh riêng của từng món), giá trên ảnh, tên, mô tả, nguyên liệu và cách làm đã bỏ thành phần phụ không ăn.
- Danh sách đi chợ dành cho ngày đang chọn, loại nguyên liệu đang có/đã bỏ; modal hỗ trợ focus ban đầu, vòng Tab, Escape và trở lại nút mở. Sao chép báo đúng khi trình duyệt không cấp quyền.
- Kiểm chứng: `node --test meals.test.js` **16/16 qua**, gồm 10 kiểm thử cũ và 6 nhóm mới về nhiều ngày/4 bữa, không vượt tiền, sở thích, ngân sách thiếu, đổi món độc lập và đầu vào sai. Kiểm tra cú pháp JS và `git diff --check` qua.


### Tinh gọn tính năng Đề xuất món ăn cho 1 người — 03/11/2026

- **Xóa bỏ các khối chức năng rườm rà:** Loại bỏ kế hoạch nhiều ngày (1–30 ngày), bảng dự trù/thực chi, khay chọn món từng bữa, modal đi chợ và toàn bộ khối form thiết lập (ngân sách, số người, thời gian nấu, accordion tủ lạnh) ở đầu trang `meals.html`. Giao diện tập trung duy nhất vào danh sách đề xuất món ăn và giá tiền cho 1 người.
- **Ảnh minh họa chính xác từng món (`DISH_IMAGES`):** Khắc phục lỗi gán chung 1 ảnh `assets/meal-hero.png` cho tất cả các món. Mỗi món trong 60 món có ảnh minh họa riêng biệt tương ứng đúng với món ăn (gà, bò, cá, tôm, mực, canh rau củ, bắp cải xào, v.v.), có cơ chế fallback và nút bật/tắt hiển thị ảnh (`#toggle-images-btn`).
- **Định lượng nguyên liệu chi tiết cho 1 người (`INGREDIENT_PORTIONS_FOR_ONE`):** Toàn bộ nguyên liệu ở mục Cần mua được hiển thị số lượng cụ thể cho 1 người ăn (ví dụ: `1 củ cà rốt`, `1 quả trứng`, `120g thịt heo`, `1 bát gạo (150g)`, `1 bìa đậu hũ`...) dạng thẻ chip trực quan.
- **Điều chỉnh giá tiền sát thực tế tự nấu ăn tại nhà:** Cập nhật bảng giá trong `meals-data.js` về mức chi phí thực tế cho 1 người ăn (từ `8.000đ – 23.000đ`), siêu tiết kiệm so với ăn tiệm.
- **Typography & Layout:** Đổi font chữ sang `Be Vietnam Pro`, thẻ món dạng Grid 2 cột vuông vắn, đồng đều.
- **Kiểm thử:** `node --check meals.js`, `node --check meals-data.js` không lỗi cú pháp; `node --test meals.test.js` đạt 10/10 kiểm thử vượt qua.
