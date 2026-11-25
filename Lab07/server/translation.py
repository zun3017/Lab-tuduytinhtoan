"""Translate only the annotated, public text of the bundled homepage and static portal UI."""
import hashlib
import html
import json
from html.parser import HTMLParser
from pathlib import Path
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from flask import Blueprint, current_app, jsonify, request

from .db import get_db


class HomepageCatalog(HTMLParser):
    """Annotated text nodes are leaves. Attributes and text can share the same key."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items = {}
        self.text_key = None
        self.prefix = ""

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        self.text_key = attrs.get("data-i18n")
        self.prefix = attrs.get("data-prefix", "")
        for name in ("title", "alt", "aria-label", "content"):
            key = attrs.get("data-i18n-" + name)
            if key:
                self.items[key] = attrs[name]

    def handle_endtag(self, tag):
        self.text_key = None

    def handle_data(self, value):
        if self.text_key:
            self.items[self.text_key] = value.strip().removeprefix(self.prefix)


def load_catalog():
    parser = HomepageCatalog()
    homepage = Path(__file__).resolve().parents[1] / "public" / "index.html"
    parser.feed(homepage.read_text(encoding="utf-8"))
    parser.close()
    return parser.items


# Static public UI labels across all portal pages (never includes private database records).
UI_CATALOG = {
    "ui.lang": "Ngôn ngữ",
    "ui.lang.aria": "Chọn ngôn ngữ",
    "ui.nav.tagline": "Quản lý Gia sư 4.0",
    "ui.nav.home": "Trang chủ",
    "ui.nav.student": "PH/HS",
    "ui.nav.homework_upper": "BÀI TẬP",
    "ui.nav.homework": "Bài tập",
    "ui.nav.tutor_upper": "GIA SƯ",
    "ui.nav.tutor": "Gia sư",
    "ui.status.loading": "Đang dịch giao diện…",
    "ui.status.missing_key": "Chưa cấu hình khóa Google Dịch. Hãy điền khóa vào tệp .env của Lab07 và khởi động lại máy chủ.",
    "ui.status.quota": "Đã hết hạn mức dịch. Hãy thử lại sau hoặc kiểm tra hạn mức Google Cloud.",
    "ui.status.google_denied": "Google chưa cấp quyền dịch. Hãy kiểm tra khóa và cấu hình Cloud Translation.",
    "ui.status.network": "Không kết nối được dịch vụ dịch. Hãy kiểm tra mạng rồi thử lại.",
    "ui.status.google_error": "Dịch vụ dịch chưa trả về kết quả. Hãy thử chọn lại ngôn ngữ.",
    # Student login
    "ui.slogin.badge": "Hệ Thống Tra Cứu Học Tập",
    "ui.slogin.title1": "Khám phá kết quả",
    "ui.slogin.title2": "Học tập của bạn",
    "ui.slogin.sub": "Tra cứu điểm số và theo dõi tiến trình học tập mọi lúc, mọi nơi 🚀",
    "ui.slogin.ph_code": "Mã học sinh",
    "ui.slogin.ph_pin": "Mã PIN",
    "ui.slogin.submit": "Tra cứu",
    "ui.slogin.c1t": "Kết quả học tập",
    "ui.slogin.c1d": "Xem điểm số và kết quả các môn học trong học kỳ hiện tại.",
    "ui.slogin.c2t": "Thành tích",
    "ui.slogin.c2d": "Khám phá thành tích, bằng khen và các danh hiệu đã đạt được.",
    "ui.slogin.c3t": "Tiến trình học tập",
    "ui.slogin.c3d": "Theo dõi quá trình học tập và sự tiến bộ qua từng giai đoạn.",
    "ui.slogin.c4t": "Thông tin chi tiết",
    "ui.slogin.c4d": "Xem thông tin chi tiết và các thông báo mới nhất từ hệ thống.",
    # Student dashboard
    "ui.sdash.back": "Trở về màn hình chính",
    "ui.sdash.refresh": "Làm mới dữ liệu",
    "ui.sdash.hw_sub": "Bấm vào để nộp →",
    "ui.sdash.avg_start": "TB Đầu giờ (tháng)",
    "ui.sdash.avg_exam": "TB Định kì (tháng)",
    "ui.sdash.compare": "So sánh tiến bộ học tập",
    "ui.sdash.chart": "Biểu đồ điểm số học tập",
    "ui.sdash.chart_hint": "Nhấn nút điểm để ẩn/hiện đường dữ liệu. Nhấn vào điểm tròn để xem chi tiết",
    "ui.sdash.leg_start": "Điểm đầu giờ",
    "ui.sdash.leg_exam": "Điểm định kì",
    "ui.sdash.period": "Kỳ đánh giá:",
    "ui.sdash.btvn": "Hoàn thành BTVN",
    "ui.sdash.done": "Hoàn thành",
    "ui.sdash.att": "Chuyên cần",
    "ui.sdash.present": "Có mặt",
    "ui.sdash.history": "Lịch sử học tập & Nhận xét chi tiết",
    "ui.sdash.more": "Xem thêm các buổi trước",
    "ui.sdash.feedback_h": "Phản hồi từ Phụ huynh",
    "ui.sdash.feedback_send": "Gửi phản hồi",
    # Homework portal
    "ui.hw.badge": "Cổng Nộp Bài Tập Học Viên",
    "ui.hw.title1": "Đăng nhập & Nộp bài",
    "ui.hw.title2": "Bài tập học viên",
    "ui.hw.sub": "Nộp bài tập của bạn trực tuyến và theo dõi kết quả chấm điểm nhanh chóng, thuận tiện 🚀",
    "ui.hw.login": "Đăng nhập",
    "ui.hw.logout": "Đăng xuất",
    "ui.hw.kpi_total": "Tổng bài được giao",
    "ui.hw.kpi_sub": "Đã nộp bài",
    "ui.hw.kpi_ontime": "Nộp đúng hạn",
    "ui.hw.kpi_miss": "Chưa nộp",
    "ui.hw.donut": "Tỷ lệ nộp bài (tháng này)",
    "ui.hw.bar": "Bài nộp theo tuần (tháng này)",
    "ui.hw.new": "Nộp bài mới",
    "ui.hw.assigned": "Bài tập được giao",
    "ui.hw.history": "Lịch sử nộp bài",
    "ui.hw.send": "Gửi bài làm",
    # Tutor login
    "ui.tlogin.badge": "Cổng Thông Tin Gia Sư",
    "ui.tlogin.sub": "Nhập số điện thoại đăng ký và mã PIN để vào trang quản lý lớp học.",
    "ui.tlogin.card_sub": "Dùng mã tài khoản và mã PIN của bạn.",
    "ui.tlogin.phone": "Số điện thoại",
    "ui.tlogin.pin": "Mã PIN / Mật khẩu",
    "ui.tlogin.remember": "Ghi nhớ đăng nhập",
    "ui.tlogin.forgot": "Quên mật khẩu / mã PIN?",
    "ui.tlogin.or": "hoặc",
    "ui.tlogin.no_acc": "Chưa có tài khoản?",
    "ui.tlogin.register": "Tạo tài khoản gia sư",
    "ui.tlogin.c1t": "Quản lý học sinh",
    "ui.tlogin.c2t": "Lịch dạy trực quan",
    "ui.tlogin.c3t": "Sổ thu học phí",
    "ui.tlogin.c4t": "Nhật ký & Báo cáo",
    # Tutor dashboard
    "ui.tdash.brand": "Gia Sư 4.0",
    "ui.tdash.overview": "Tổng quan",
    "ui.tdash.reports": "Báo cáo",
    "ui.tdash.diary": "Nhật ký buổi học",
    "ui.tdash.calendar": "Lịch dạy",
    "ui.tdash.students": "Học sinh",
    "ui.tdash.tuition": "Học phí",
    "ui.tdash.theme": "Giao diện",
    "ui.tdash.account": "Tài khoản",
    "ui.tdash.settings": "Cài đặt",
    "ui.tdash.overview_sub": "Tổng quan hệ thống giảng dạy & theo dõi hiệu suất",
    "ui.tdash.kpi_stu": "Học sinh đang dạy",
    "ui.tdash.kpi_stu_sub": "Đang theo học",
    "ui.tdash.kpi_hrs": "Tổng giờ tích lũy",
    "ui.tdash.kpi_hrs_sub": "Thời lượng dạy",
    "ui.tdash.upcoming": "Lịch dạy sắp tới",
    "ui.tdash.today": "Hôm nay",
    "ui.tdash.tomorrow": "Ngày mai",
    "ui.tdash.all_sched": "Xem toàn bộ lịch dạy",
    "ui.tdash.stu_rev": "Doanh thu theo học sinh",
    "ui.tdash.stu_rev_sub": "Phân bổ doanh thu tháng này",
    "ui.tdash.timetable": "Thời khóa biểu tổng hợp",
    "ui.tdash.manage_cal": "Quản lý & Tạo thời khóa biểu",
    "ui.tdash.stu_list": "Danh sách học sinh",
    "ui.tdash.add_stu": "Thêm học sinh",
    "ui.tdash.tuition_title": "Quản lý học phí & Thu nhập",
    "ui.tdash.exp": "Tổng thu dự kiến",
    "ui.tdash.col": "Đã thu",
    "ui.tdash.pen": "Còn phải thu",
    # Calendars
    "ui.cal.back": "Quay lại Dashboard",
    "ui.cal.month": "Tháng",
    "ui.cal.week": "Tuần",
    "ui.cal.day": "Ngày",
    "ui.cal.summary": "Lịch tóm tắt",
    "ui.cal.demo_title": "Thời Khóa Biểu & Lịch Dạy",
    "ui.cal.demo_home": "Về trang chủ",
    "ui.cal.demo_sheet": "Xem lịch tóm tắt",
    # Invoice
    "ui.inv.title": "Phiếu học tập và học phí",
    "ui.inv.sub": "Tổng kết theo kỳ học",
    "ui.inv.back": "Quay lại",
    "ui.inv.png": "Tải ảnh PNG",
    "ui.inv.pdf": "In / lưu PDF",
    "ui.inv.summary": "TỔNG KẾT KẾT QUẢ KỲ NÀY",
    "ui.inv.hw": "Bài tập về nhà",
    "ui.inv.total": "Tổng học phí kỳ này",
    "ui.inv.msg": "Lời nhắn gửi phụ huynh",
    # Admin dashboard
    "ui.adm.refresh": "Làm mới",
    "ui.adm.tab_rep": "Tổng Quan Kinh Doanh",
    "ui.adm.tab_tut": "Quản Lý Gia Sư",
    "ui.adm.tab_cen": "Trung Tâm Giới Thiệu",
    "ui.adm.tab_set": "Cài Đặt Hệ Thống",
    "ui.adm.kpi_rev": "Doanh thu phí web tháng này",
    "ui.adm.kpi_act": "Gia sư đang hoạt động (trả phí)",
    "ui.adm.kpi_tri": "Gia sư đang dùng thử (15 ngày)",
    "ui.adm.kpi_exp": "Gia sư hết hạn / cần gia hạn",
    "ui.adm.add_tut": "Thêm Gia Sư Mới",
    "ui.adm.trash_tut": "Thùng rác Gia sư",
    "ui.adm.add_cen": "Thêm Trung Tâm Mới",
}


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class TranslationError(Exception):
    def __init__(self, code, status):
        self.code = code
        self.status = status


CATALOG = load_catalog()
TARGET_LOCKS = {lang: Lock() for lang in ("en", "ja", "ko")}
GOOGLE_URL = "https://translation.googleapis.com/language/translate/v2"
open_google = build_opener(NoRedirect()).open
bp = Blueprint("homepage_translation", __name__)


def google_batch(texts, target, key):
    payload = {"q": texts, "target": target, "source": "vi", "format": "text"}
    call = Request(GOOGLE_URL, data=json.dumps(payload).encode(), method="POST",
                   headers={"Content-Type": "application/json", "X-Goog-Api-Key": key})
    try:
        with open_google(call, timeout=12) as response:
            values = json.load(response)["data"]["translations"]
        if not isinstance(values, list) or len(values) != len(texts):
            raise ValueError
        translated = [row["translatedText"] for row in values]
        if any(not isinstance(value, str) or not value.strip() for value in translated):
            raise ValueError
        return [html.unescape(value) for value in translated]
    except HTTPError as exc:
        # Provider diagnostics can include request metadata. Never forward or log the body.
        with exc:
            diagnostic = exc.read(8192).lower()
        quota_terms = (b"quota", b"rate limit", b"ratelimit", b"daily limit", b"dailylimit")
        if exc.code == 429 or (exc.code == 403 and any(q in diagnostic for q in quota_terms)):
            raise TranslationError("quota", 429) from None
        if exc.code in (400, 401, 403):
            raise TranslationError("google_denied", 502) from None
        raise TranslationError("google_error", 502) from None
    except (URLError, OSError):
        raise TranslationError("network", 503) from None
    except (ValueError, KeyError, TypeError, IndexError):
        raise TranslationError("google_error", 502) from None


def _translate_catalog(target, catalog, scope_name="homepage"):
    db = get_db()
    rows = db.execute(
        "SELECT item_key, source_hash, translated_text FROM homepage_translations WHERE language=?",
        (target,),
    )
    stored = {row["item_key"]: row for row in rows}
    result = {}
    missing = []
    for item_key, value in catalog.items():
        digest = hashlib.sha256(value.encode("utf-8")).hexdigest()
        previous = stored.get(item_key)
        if previous is not None and previous["source_hash"] == digest:
            result[item_key] = previous["translated_text"]
        else:
            missing.append((item_key, value, digest))
    logger = current_app.logger
    if not missing:
        logger.info("%s_translation target=%s cache=hit source=sqlite items=%d", scope_name, target, len(result))
        return jsonify(target=target, translations=result, source="sqlite")
    key = current_app.config.get("GOOGLE_TRANSLATE_API_KEY", "").strip()
    if not key:
        raise TranslationError("missing_key", 503)
    # Keep each successful batch, so a quota error on a later batch is safely retryable.
    for start in range(0, len(missing), 128):
        batch = missing[start:start + 128]
        values = google_batch([value for _, value, _ in batch], target, key)
        updates = []
        for (item_key, _, digest), value in zip(batch, values):
            result[item_key] = value
            updates.append((target, item_key, digest, value))
        with db:
            db.executemany("""
                INSERT INTO homepage_translations(language, item_key, source_hash, translated_text)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(language, item_key) DO UPDATE SET
                   source_hash=excluded.source_hash, translated_text=excluded.translated_text
            """, updates)
        logger.info("%s_translation target=%s cache=miss source=google items=%d", scope_name, target, len(batch))
    return jsonify(target=target, translations=result, source="google")


def translate(target):
    return _translate_catalog(target, CATALOG, "homepage")


def _parse_target():
    body = request.get_json(silent=True)
    if not isinstance(body, dict) or set(body) != {"target"}:
        return None
    target = body["target"]
    if not isinstance(target, str) or target not in ("vi", "en", "ja", "ko"):
        return None
    return target


@bp.post("/api/translate/homepage")
def homepage_translation():
    target = _parse_target()
    if not target:
        return jsonify(error="invalid_target"), 400
    if target == "vi":
        return jsonify(target=target, translations=CATALOG, source="original")
    try:
        with TARGET_LOCKS[target]:
            return translate(target)
    except TranslationError as exc:
        current_app.logger.info("homepage_translation target=%s outcome=%s", target, exc.code)
        return jsonify(error=exc.code), exc.status


@bp.post("/api/translate/ui")
def ui_translation():
    target = _parse_target()
    if not target:
        return jsonify(error="invalid_target"), 400
    if target == "vi":
        return jsonify(target=target, translations=UI_CATALOG, originals=UI_CATALOG, source="original")
    try:
        with TARGET_LOCKS[target]:
            response = _translate_catalog(target, UI_CATALOG, "ui")
            data = response.get_json()
            data["originals"] = UI_CATALOG
            return jsonify(data), response.status_code
    except TranslationError as exc:
        current_app.logger.info("ui_translation target=%s outcome=%s", target, exc.code)
        return jsonify(error=exc.code, originals=UI_CATALOG), exc.status
