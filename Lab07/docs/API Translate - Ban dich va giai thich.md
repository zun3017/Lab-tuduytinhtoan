# Dịch văn bản bằng Python với googletrans trong ứng dụng du lịch

Một ứng dụng đặt phòng có thể nhận câu hỏi bằng tiếng Việt, tiếng Anh hoặc tiếng Nhật. Thư viện `googletrans` giúp chương trình nhận diện ngôn ngữ và lấy bản dịch để nhân viên đọc câu hỏi bằng ngôn ngữ họ dùng.

**Mục lục**

1. Giới thiệu thư viện
2. Cài đặt và kiểm tra
3. Các thành phần chính
4. Cách dùng cơ bản
5. Tùy chỉnh địa chỉ dịch vụ
6. Ba ví dụ du lịch
7. Tổng kết và hướng thực hành

## 1. Giới thiệu thư viện

`py-googletrans` là tên dự án. Tên gói để cài và nhập vào Python là `googletrans`. Thư viện cung cấp một giao diện không chính thức để chương trình sử dụng chức năng dịch của Google Dịch. Theo mô tả trong bài, thư viện gọi dịch vụ web mà trang Google Dịch dùng khi người dùng nhập văn bản.

**API** là giao diện để một chương trình gửi yêu cầu và nhận kết quả từ chương trình khác. Ở đây, chương trình Python gửi câu cần dịch và ngôn ngữ muốn nhận. Google Dịch xử lý câu, rồi thư viện trả kết quả về cho Python.

Bài gốc nêu các ưu điểm gồm dùng miễn phí, không cần khóa API hay thiết lập thanh toán, hỗ trợ hơn 100 ngôn ngữ, tự nhận diện ngôn ngữ nguồn, dịch được danh sách văn bản và dễ tích hợp vào ứng dụng. Tác giả dùng cụm “không giới hạn”. Trên thực tế, phía dịch vụ có thể giới hạn hoặc từ chối yêu cầu. [Thông tin của dự án googletrans](https://pypi.org/project/googletrans/4.0.2/)

Trong du lịch, có thể dùng thư viện để dịch đánh giá khách sạn và phản hồi của khách, chuyển câu hỏi giữa các ngôn ngữ, tạo cẩm nang đa ngữ, xử lý yêu cầu đặt chỗ quốc tế hoặc phân tích nội dung du lịch viết bằng tiếng nước ngoài.

## 2. Cài đặt và kiểm tra

### Hai phiên bản được nhắc trong bài

Tài liệu đưa ra hai lệnh cài bằng `pip`. Mỗi lệnh chọn **một phiên bản** của cùng một gói. Đây là hai lựa chọn được nêu ở thời điểm viết bài.

```bash
# Phiên bản tài liệu chọn cho các ví dụ
pip install googletrans==3.1.0a0

# Phương án thứ hai được nêu trong tài liệu
pip install googletrans==4.0.0rc1
```

**Lưu ý về phiên bản.** Các đoạn mã của bài dùng cách gọi trực tiếp của `3.1.0a0`. Hậu tố `a0` chỉ bản alpha và `rc1` chỉ bản ứng viên phát hành. Với `4.0.2`, dự án minh họa cách dùng `await translator.translate(...)` trong hàm `async def`. Có thể xem hai cách viết ở phần 4 bên dưới. [Phiên bản 3.1.0a0](https://pypi.org/project/googletrans/3.1.0a0/) · [Phiên bản 4.0.2](https://pypi.org/project/googletrans/4.0.2/#basic-usage)

### Kiểm tra phiên bản và số ngôn ngữ

```python
import googletrans
print(googletrans.__version__)
print("Số ngôn ngữ hỗ trợ:", len(googletrans.LANGUAGES))
# Kết quả mẫu: 3.1.0a0
# Số ngôn ngữ hỗ trợ: 107
```

`__version__` là số phiên bản đã cài. `LANGUAGES` là bảng tra từ mã sang tên ngôn ngữ. `len(...)` đếm số mục trong bảng. Con số 107 là kết quả minh họa trong tài liệu.

### Xem các mã ngôn ngữ

```python
from googletrans import LANGUAGES

# In tất cả ngôn ngữ được hỗ trợ
for code, name in LANGUAGES.items():
    print(f"{code}: {name}")

# Một số ngôn ngữ thường gặp trong du lịch
travel_languages = {
    'en': 'english', 'vi': 'vietnamese', 'fr': 'french',
    'es': 'spanish', 'zh': 'chinese', 'ja': 'japanese',
    'ko': 'korean', 'th': 'thai'
}
print("Các ngôn ngữ trong ví dụ du lịch:", travel_languages)
```

Vòng lặp in từng cặp mã và tên. Trong ví dụ, `en` là tiếng Anh, `vi` là tiếng Việt, `fr` là tiếng Pháp, `es` là tiếng Tây Ban Nha, `ja` là tiếng Nhật, `ko` là tiếng Hàn và `th` là tiếng Thái. Bảng `travel_languages` do tác giả tự tạo. Khi cần một mã tiếng Trung dùng để gọi thư viện, hãy tra bảng `LANGUAGES` của phiên bản đang dùng.

## 3. Các thành phần chính

### Đối tượng thực hiện yêu cầu

```python
from googletrans import Translator
translator = Translator()
```

Dòng đầu nhập lớp `Translator`. Dòng sau tạo đối tượng `translator` để chương trình gọi hai thao tác chính. `translate()` dịch văn bản và `detect()` nhận diện ngôn ngữ. Bạn cũng có thể truyền danh sách câu cần dịch hoặc cấu hình tên miền dịch vụ.

### Kết quả dịch và kết quả nhận diện

| Cách lấy | Thuộc tính | Ý nghĩa |
| --- | --- | --- |
| `result = translator.translate(...)` | `result.origin` | Văn bản gốc đã gửi đi |
| | `result.text` | Văn bản sau khi dịch |
| | `result.src` | Mã ngôn ngữ nguồn, do người gọi chỉ định hoặc dịch vụ nhận diện |
| | `result.dest` | Mã ngôn ngữ đích |
| | `result.pronunciation` | Cách phát âm, nếu có |
| `detection = translator.detect(...)` | `detection.lang` | Mã ngôn ngữ nhận diện được |
| | `detection.confidence` | Điểm tin cậy của kết quả nhận diện. Tài liệu minh họa thang từ 0 đến 1 |

Ví dụ, nếu `detection.lang` là `es`, chương trình nhận diện câu là tiếng Tây Ban Nha. Điểm `confidence` đi kèm chỉ nói về bước nhận diện ngôn ngữ. Muốn đánh giá câu dịch có đúng nghĩa hay không, cần đọc câu dịch trong ngữ cảnh.

## 4. Cách dùng cơ bản

### Dịch một câu

```python
from googletrans import Translator

translator = Translator()

# Tự nhận diện ngôn ngữ nguồn và dịch sang tiếng Anh
result = translator.translate("Hello, how are you?")
print(f"Văn bản: {result.text}")
print(f"Ngôn ngữ nhận diện được: {result.src}")
# Kết quả mẫu: Văn bản: Hello, how are you?
# Ngôn ngữ nhận diện được: en

# Chỉ định ngôn ngữ đích
result = translator.translate("Hello, how are you?", dest="vi")
print(f"Tiếng Việt: {result.text}")
# Kết quả mẫu: Tiếng Việt: Xin chào bạn khỏe không?
```

Ở lần gọi đầu, tiếng Anh là ngôn ngữ đích mặc định. Câu đầu vào vốn đã là tiếng Anh nên kết quả mẫu giống câu gốc. Ở lần gọi thứ hai, `dest="vi"` yêu cầu dịch sang tiếng Việt. Biến `result` chứa toàn bộ kết quả. Để hiển thị riêng câu dịch, dùng `result.text`.

**Cùng thao tác trong phiên bản 4.0.2.** Ví dụ sau bổ sung để đối chiếu với cú pháp trong tài liệu. `await` bảo Python chờ nhận kết quả dịch trước khi đọc `result.text`. [Ví dụ của dự án](https://pypi.org/project/googletrans/4.0.2/#basic-usage)

```python
import asyncio
from googletrans import Translator

async def main():
    async with Translator() as translator:
        result = await translator.translate("Hello, how are you?", dest="vi")
        print(result.text)

asyncio.run(main())
```

### Nhận diện ngôn ngữ

```python
# Nhận diện ngôn ngữ của câu đầu vào
text = "¿Dónde está el hotel?"
detection = translator.detect(text)

print(f"Ngôn ngữ nhận diện được: {detection.lang}")
print(f"Độ tin cậy: {detection.confidence}")
# Kết quả mẫu: Ngôn ngữ nhận diện được: es
# Độ tin cậy: 1.0

# Tra tên ngôn ngữ tương ứng với mã
from googletrans import LANGUAGES
print(f"Tên ngôn ngữ: {LANGUAGES[detection.lang]}")
# Kết quả mẫu: Tên ngôn ngữ: spanish
```

Câu “¿Dónde está el hotel?” có nghĩa là “Khách sạn ở đâu?”. Lệnh `detect(text)` trả về mã `es` trong ví dụ. Khi tra `LANGUAGES["es"]`, chương trình tìm được tên `spanish` (tiếng Tây Ban Nha). Mã ngôn ngữ, điểm tin cậy và bản dịch trong các đoạn minh họa là kết quả mẫu của tài liệu.

### Chỉ định ngôn ngữ nguồn và đích

```python
# Chỉ định cả ngôn ngữ nguồn và ngôn ngữ đích
result = translator.translate(
    "Bonjour, comment allez-vous?",
    src='fr',
    dest='en'
)

print(f"Tiếng Pháp: {result.origin}")
print(f"Tiếng Anh: {result.text}")
print(f"Nguồn: {result.src}, Đích: {result.dest}")
# Kết quả mẫu: Tiếng Pháp: Bonjour, comment allez-vous?
# Tiếng Anh: Hello, how are you?
# Nguồn: fr, Đích: en
```

`src='fr'` cho biết câu ban đầu là tiếng Pháp. `dest='en'` yêu cầu trả về tiếng Anh. Hai câu “Bonjour, comment allez-vous?” và “Hello, how are you?” đều là lời chào hỏi thăm sức khỏe.

### Dịch nhiều câu

```python
# Dịch cả danh sách câu
texts = [
    "Welcome to our hotel",
    "Thank you for staying with us",
    "Have a safe trip"
]

results = translator.translate(texts, dest='vi')

for i, result in enumerate(results):
    print(f"Tiếng Anh: {result.origin}")
    print(f"Tiếng Việt: {result.text}")
    print("---")

# Kết quả mẫu:
# Tiếng Anh: Welcome to our hotel
# Tiếng Việt: Chào mừng bạn đến với khách sạn của chúng tôi
# ---
# Tiếng Anh: Thank you for staying with us
# Tiếng Việt: Cảm ơn bạn đã ở lại với chúng tôi
# ---
# Tiếng Anh: Have a safe trip
# Tiếng Việt: Có một chuyến đi an toàn
# ---
```

Đầu vào là danh sách ba câu. Kết quả cũng là một danh sách nên vòng lặp có thể in từng cặp câu gốc và câu dịch. Trong tiếng Việt tự nhiên, “Thank you for staying with us” có thể viết là “Cảm ơn quý khách đã lưu trú tại khách sạn” và “Have a safe trip” là “Chúc bạn thượng lộ bình an”.

## 5. Tùy chỉnh địa chỉ dịch vụ

### Dùng nhiều tên miền

Tài liệu minh họa cách truyền nhiều tên miền Google Dịch qua tham số `service_urls`. Mục đích tác giả nêu là có thêm địa chỉ dịch vụ để sử dụng.

```python
# Cấu hình nhiều tên miền cho dịch vụ dịch
translator = Translator(service_urls=[
    'translate.google.com',
    'translate.google.co.kr',
    'translate.google.co.jp'
])

result = translator.translate("Welcome to Vietnam", dest='vi')
print(result.text)
# Kết quả mẫu: Chào mừng đến với Việt Nam
```

### Chỉ định trực tiếp địa chỉ nhận yêu cầu

Một **điểm cuối** (endpoint) là địa chỉ mà chương trình gửi yêu cầu tới. Ví dụ tiếp theo cấu hình tên miền `translate.googleapis.com`. Tác giả gợi ý cấu hình này vì lý do ổn định. Đoạn mã vẫn dùng thư viện không chính thức.

```python
# Gửi yêu cầu tới địa chỉ translate.googleapis.com
translator = Translator(service_urls=['translate.googleapis.com'])

result = translator.translate("Travel safely", dest='vi')
print(result.text)
# Kết quả mẫu: Du lịch an toàn
```

## 6. Ba ví dụ du lịch

Nếu đọc từng ví dụ riêng, các đoạn mã dưới đây dùng `Translator` đã nhập ở phần 3. Ví dụ thứ hai cũng dùng `LANGUAGES` ở phần 2.

### Ví dụ 1. Dịch đánh giá khách sạn

Hàm `translate_hotel_reviews` nhận danh sách đánh giá và ngôn ngữ đích, mặc định là tiếng Anh. Với từng đánh giá, hàm nhận diện ngôn ngữ rồi so sánh với ngôn ngữ đích. Nếu hai mã trùng nhau, hàm giữ câu gốc. Nếu khác nhau, nó dịch và lưu cả hai câu cùng mã ngôn ngữ nguồn và điểm tin cậy của bước nhận diện. Khi một đánh giá gặp lỗi, hàm ghi lỗi cho mục đó rồi tiếp tục với mục kế tiếp.

```python
def translate_hotel_reviews(reviews, target_language='en'):
    """
    Dịch các đánh giá khách sạn sang ngôn ngữ đích.
    """
    translator = Translator()
    translated_reviews = []

    for review in reviews:
        try:
            # Nhận diện ngôn ngữ nguồn
            detection = translator.detect(review)

            # Giữ nguyên nếu đánh giá đã dùng ngôn ngữ đích
            if detection.lang == target_language:
                translated_reviews.append({
                    'original': review,
                    'translated': review,
                    'source_lang': detection.lang,
                    'confidence': detection.confidence
                })
            else:
                # Dịch sang ngôn ngữ đích
                result = translator.translate(review, dest=target_language)
                translated_reviews.append({
                    'original': review,
                    'translated': result.text,
                    'source_lang': result.src,
                    'confidence': detection.confidence
                })
        except Exception as e:
            translated_reviews.append({
                'original': review,
                'translated': None,
                'error': str(e)
            })

    return translated_reviews

# Ví dụ sử dụng
vietnamese_reviews = [
    "Khách sạn này rất tuyệt vời! Nhân viên thân thiện.",
    "Vị trí khách sạn thuận tiện, gần biển.",
    "Phòng sạch sẽ nhưng hơi nhỏ."
]

english_translations = translate_hotel_reviews(vietnamese_reviews)

for review in english_translations:
    print(f"Câu gốc ({review.get('source_lang', 'unknown')}): {review['original']}")
    print(f"Tiếng Anh: {review['translated']}")
    print(f"Độ tin cậy: {review.get('confidence', 'N/A')}")
    print("---")

# Kết quả dự kiến:
# Câu gốc (vi): Khách sạn này rất tuyệt vời! Nhân viên thân thiện.
# Tiếng Anh: This hotel is great! Friendly staff.
# Độ tin cậy: 1.0
# ---
# Câu gốc (vi): Vị trí khách sạn thuận tiện, gần biển.
# Tiếng Anh: The hotel location is convenient, near the beach.
# Độ tin cậy: 1.0
# ---
# Câu gốc (vi): Phòng sạch sẽ nhưng hơi nhỏ.
# Tiếng Anh: The room is clean but a bit small.
# Độ tin cậy: 1.0
# ---
```

**Đọc một kết quả.** Với “Phòng sạch sẽ nhưng hơi nhỏ.”, mục `original` chứa câu này và mục `translated` có thể chứa “The room is clean but a bit small.”. Giữ cả hai giúp nhân viên đối chiếu bản dịch với lời của khách.

### Ví dụ 2. Xử lý câu hỏi của khách du lịch

Hàm `process_travel_inquiry` xử lý mỗi lần một câu. Kết quả cho biết ngôn ngữ, nội dung và giá trị `needs_translation`. Giá trị `True` cho biết chương trình đã đi vào nhánh dịch. Giá trị `False` cho biết câu đầu vào đã dùng ngôn ngữ đích.

```python
def process_travel_inquiry(inquiry_text, target_language='en'):
    """
    Nhận diện ngôn ngữ và dịch câu hỏi của khách du lịch.
    """
    translator = Translator()

    try:
        # Nhận diện ngôn ngữ của câu hỏi
        detection = translator.detect(inquiry_text)

        # Dịch khi ngôn ngữ của câu hỏi khác ngôn ngữ đích
        if detection.lang != target_language:
            translation = translator.translate(inquiry_text, dest=target_language)

            return {
                'original_text': inquiry_text,
                'detected_language': LANGUAGES.get(detection.lang, detection.lang),
                'confidence': detection.confidence,
                'translated_text': translation.text,
                'needs_translation': True
            }
        else:
            return {
                'original_text': inquiry_text,
                'detected_language': LANGUAGES.get(detection.lang, detection.lang),
                'confidence': detection.confidence,
                'translated_text': inquiry_text,
                'needs_translation': False
            }

    except Exception as e:
        return {
            'error': str(e),
            'original_text': inquiry_text
        }

# Ví dụ sử dụng
inquiries = [
    "Tôi muốn đặt phòng khách sạn ở Hà Nội",
    "I want to book a hotel in Hanoi",
    "¿Hay tours disponibles para mañana?",
    "空港からホテルまでの交通手段は？"
]

print("Đang xử lý câu hỏi của khách du lịch:")
for inquiry in inquiries:
    result = process_travel_inquiry(inquiry)

    if 'error' not in result:
        print(f"Ngôn ngữ: {result['detected_language']} (độ tin cậy: {result['confidence']})")
        print(f"Câu gốc: {result['original_text']}")
        if result['needs_translation']:
            print(f"Tiếng Anh: {result['translated_text']}")
        else:
            print("Câu đã ở ngôn ngữ đích")
    else:
        print(f"Lỗi khi xử lý: {result['error']}")
    print("---")

# Kết quả dự kiến:
# Ngôn ngữ: vietnamese (độ tin cậy: 1.0)
# Câu gốc: Tôi muốn đặt phòng khách sạn ở Hà Nội
# Tiếng Anh: I want to book a hotel in Hanoi
# ---
# Ngôn ngữ: english (độ tin cậy: 1.0)
# Câu gốc: I want to book a hotel in Hanoi
# Câu đã ở ngôn ngữ đích
# ---
# Ngôn ngữ: spanish (độ tin cậy: 1.0)
# Câu gốc: ¿Hay tours disponibles para mañana?
# Tiếng Anh: Are there tours available for tomorrow?
# ---
# Ngôn ngữ: japanese (độ tin cậy: 1.0)
# Câu gốc: 空港からホテルまでの交通手段は？
# Tiếng Anh: What are the transportation options from the airport to the hotel?
# ---
```

Bốn câu thử lần lượt có nghĩa là “Tôi muốn đặt phòng khách sạn ở Hà Nội”, “Tôi muốn đặt phòng khách sạn ở Hà Nội”, “Ngày mai có tour nào không?” và “Có những cách nào để đi từ sân bay đến khách sạn?”. Với đích là tiếng Anh, hai câu đầu cùng diễn đạt một ý nhưng đi qua hai nhánh khác nhau. Câu tiếng Việt cần dịch. Câu tiếng Anh được giữ nguyên.

### Ví dụ 3. Dịch thông tin điểm đến

Hàm `translate_destination_info` nhận một từ điển Python gồm các cặp khóa và giá trị. Khóa như `description` cho chương trình biết đây là mục mô tả. Giá trị của khóa là nội dung người đọc sẽ thấy. Hàm dịch các giá trị dạng chuỗi có nội dung, giữ nguyên các khóa cùng những giá trị kiểu khác hoặc chuỗi trống. Nếu một mục dịch lỗi, hàm lưu thông báo lỗi ở mục đó.

```python
def translate_destination_info(destination_data, target_language):
    """
    Dịch thông tin về điểm đến.
    """
    translator = Translator()
    translated_data = {}

    for key, value in destination_data.items():
        if isinstance(value, str) and value.strip():
            try:
                result = translator.translate(value, dest=target_language)
                translated_data[key] = result.text
            except Exception as e:
                translated_data[key] = f"Lỗi dịch: {e}"
        else:
            translated_data[key] = value

    return translated_data


# Ví dụ sử dụng
hanoi_info = {
    'name': 'Hanoi',
    'description': 'The capital city of Vietnam, known for its rich history and vibrant street food culture.',
    'attractions': 'Hoan Kiem Lake, Old Quarter, Temple of Literature, Ho Chi Minh Mausoleum',
    'food_specialties': 'Pho, Bun Cha, Banh Mi, Vietnamese Coffee',
    'best_time_to_visit': 'October to April when the weather is cool and dry'
}

vietnamese_info = translate_destination_info(hanoi_info, 'vi')

print("Thông tin du lịch Hà Nội (tiếng Việt):")
for key, value in vietnamese_info.items():
    print(f"{key.replace('_', ' ').title()}: {value}")

# Kết quả dự kiến:
# Thông tin du lịch Hà Nội (tiếng Việt):
# Name: Hanoi
# Description: Thủ đô của Việt Nam, được biết đến với lịch sử phong phú và văn hóa ẩm thực đường phố sôi động.
# Attractions: Hồ Hoàn Kiếm, Phố Cổ, Văn Miếu, Lăng Chủ tịch Hồ Chí Minh
# Food Specialties: Phở, Bún Chả, Bánh Mì, Cà phê Việt Nam
# Best Time To Visit: Tháng 10 đến tháng 4 khi thời tiết mát mẻ và khô ráo
```

Trong ví dụ Hà Nội, các trường mô tả lịch sử và ẩm thực đường phố, liệt kê Hồ Hoàn Kiếm, Phố cổ, Văn Miếu và Lăng Chủ tịch Hồ Chí Minh, giới thiệu phở, bún chả, bánh mì và cà phê Việt Nam, rồi nêu thời gian tham quan từ tháng 10 đến tháng 4. Việc giữ nguyên khóa giúp phần giao diện vẫn tìm thấy nội dung tiếng Việt qua `vietnamese_info['description']`.

## 7. Tổng kết và hướng thực hành

Quy trình trong bài là cài phiên bản phù hợp, nhập lớp `Translator`, tạo đối tượng, gọi `translate(..., dest="vi")` và lấy câu dịch bằng `.text`. Khi tích hợp vào ứng dụng, tác giả đề nghị xử lý ngoại lệ để một yêu cầu lỗi vẫn cho phép chương trình báo lại điều đã xảy ra.

Tài liệu gợi ý thử thêm các cặp ngôn ngữ, bổ sung cơ chế thử lại khi có lỗi, giới hạn tần suất gửi yêu cầu cho tác vụ lớn, kết hợp thư viện với bộ dữ liệu du lịch và đánh giá chất lượng bản dịch trong tình huống sử dụng cụ thể.
