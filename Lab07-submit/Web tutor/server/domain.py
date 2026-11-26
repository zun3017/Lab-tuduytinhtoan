"""Role-scoped REST API for ZunTutor Lab07 backed exclusively by local SQLite."""
import re
import secrets
from datetime import date, datetime, timedelta
from urllib.parse import quote

from flask import Blueprint, Response, abort, jsonify, request, session
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash, generate_password_hash

from .db import get_db
from .domain_store import (
    actor,
    add_row,
    clean_text,
    clock,
    integer,
    iso_date,
    optional_id,
    payload,
    record,
    records,
    require,
    row,
    rows,
    score,
    set_fields,
)

bp = Blueprint("domain", __name__)

SAFE_INLINE_MIMES = {
    "text/plain",
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/gif",
    "image/webp",
}
ALLOWED_SETTINGS = {"marquee", "contact", "contact_phone", "contact_messenger", "contact_zalo", "commission_rates"}


@bp.errorhandler(HTTPException)
def domain_http_error(error):
    return jsonify(error=error.description or error.name), error.code


def _settings_map():
    return {r["key"]: r["value"] for r in rows("SELECT key, value FROM settings")}


def _set_session(account_id, auth_version, homework_only=False):
    session.clear()
    session.permanent = True
    session["account_id"] = account_id
    session["auth_version"] = auth_version
    if homework_only:
        session["homework_only"] = True


def _save_uploaded_files(db, files, assignment_id=None, submission_id=None):
    saved = 0
    for storage in files:
        if not storage or not storage.filename:
            continue
        data = storage.read()
        if not data:
            continue
        if len(data) > 20 * 1024 * 1024:
            abort(400, "Mỗi tệp đính kèm không được vượt quá 20 MB.")
        filename = clean_text(storage.filename.replace("\\", "/").split("/")[-1], True, 180)
        mime = clean_text(storage.mimetype or "application/octet-stream", True, 120).lower()
        db.execute(
            "INSERT INTO files(assignment_id, submission_id, name, mime, size, content) VALUES(?,?,?,?,?,?)",
            (assignment_id, submission_id, filename, mime, len(data), data),
        )
        saved += 1
    return saved


def _unique_code(prefix, table, column):
    for _ in range(12):
        candidate = f"{prefix}{secrets.token_hex(2).upper()}"
        exists = row(f"SELECT 1 FROM {table} WHERE {column}=?", (candidate,))
        if not exists:
            return candidate
    abort(500, "Không thể tạo mã định danh mới.")


@bp.get("/api/session")
def get_session():
    return jsonify(user=actor())


@bp.post("/api/login")
def login():
    data = payload()
    identifier = clean_text(data.get("login"), True, 80)
    password = clean_text(data.get("password"), True, 128)
    account = row(
        "SELECT id, role, status, password_hash, auth_version FROM accounts WHERE (login=? OR phone=?) AND deleted_at IS NULL",
        (identifier, identifier),
    )
    if not account or not check_password_hash(account["password_hash"], password):
        abort(401, "Mã đăng nhập hoặc mật khẩu chưa đúng.")
    if account["status"] == "locked":
        abort(403, "Tài khoản đang bị tạm khóa. Vui lòng liên hệ quản trị viên.")
    _set_session(account["id"], account["auth_version"])
    return jsonify(user=actor())


@bp.post("/api/logout")
def logout():
    session.clear()
    return jsonify(ok=True)


@bp.post("/api/student/access")
def student_access():
    identifier = clean_text(payload().get("code"), True, 80)
    account = row(
        """SELECT a.id, a.status, a.auth_version FROM accounts a
           JOIN students s ON s.id=a.id
           WHERE a.role='student' AND a.deleted_at IS NULL AND (a.login=? OR a.phone=?)""",
        (identifier, identifier),
    )
    if not account or account["status"] != "active":
        abort(401, "Không tìm thấy hồ sơ học sinh đang hoạt động.")
    _set_session(account["id"], account["auth_version"])
    return jsonify(user=actor())


@bp.post("/api/homework/access")
def homework_access():
    data = payload()
    code = clean_text(data.get("code"), True, 60)
    account = row(
        """SELECT a.id, a.status, a.auth_version
           FROM accounts a JOIN students s ON s.id=a.id
           WHERE s.homework_code=? AND a.deleted_at IS NULL""",
        (code,),
    )
    if not account:
        abort(401, "Mã bài tập không tồn tại hoặc đã bị thu hồi.")
    if account["status"] == "locked":
        abort(403, "Tài khoản học sinh đang tạm khóa.")
    _set_session(account["id"], account["auth_version"], homework_only=True)
    return jsonify(user=actor())


@bp.post("/api/register")
def register_tutor():
    data = payload()
    name = clean_text(data.get("name"), True, 120)
    login_id = clean_text(data.get("login"), True, 80)
    password = clean_text(data.get("password"), True, 128)
    phone = clean_text(data.get("phone"), False, 30) or None
    if row("SELECT 1 FROM accounts WHERE login=?", (login_id,)):
        abort(409, "Mã đăng nhập này đã được sử dụng.")
    if phone and row("SELECT 1 FROM accounts WHERE phone=?", (phone,)):
        abort(409, "Số điện thoại này đã được đăng ký.")
    recovery_code = f"ZT-{secrets.token_hex(3).upper()}"
    today = date.today()
    db = get_db()
    with db:
        uid = add_row(
            "accounts",
            {
                "role": "tutor",
                "login": login_id,
                "phone": phone,
                "name": name,
                "password_hash": generate_password_hash(password),
                "recovery_hash": generate_password_hash(recovery_code),
            },
        )
        add_row(
            "tutors",
            {
                "id": uid,
                "account_type": "trial",
                "registered_date": today.isoformat(),
                "next_billing_date": (today + timedelta(days=15)).isoformat(),
            },
        )
    _set_session(uid, 1)
    return jsonify(user=actor(), recovery_code=recovery_code), 201


@bp.post("/api/recover")
def recover_password():
    data = payload()
    identifier = clean_text(data.get("login"), True, 80)
    recovery_code = clean_text(data.get("recovery_code"), True, 80)
    new_password = clean_text(data.get("password"), True, 128)
    account = row(
        "SELECT id, recovery_hash, auth_version FROM accounts WHERE (login=? OR phone=?) AND deleted_at IS NULL",
        (identifier, identifier),
    )
    if not account or not account["recovery_hash"] or not check_password_hash(account["recovery_hash"], recovery_code):
        abort(401, "Thông tin khôi phục chưa chính xác.")
    db = get_db()
    with db:
        db.execute(
            "UPDATE accounts SET password_hash=?, auth_version=auth_version+1 WHERE id=?",
            (generate_password_hash(new_password), account["id"]),
        )
    return jsonify(ok=True)


@bp.patch("/api/account")
def update_own_account():
    user = actor()
    if user["role"] == "homework":
        abort(403, "Chế độ mã bài tập không được đổi thông tin tài khoản.")
    data = payload()
    fields = {}
    if "name" in data:
        fields["name"] = clean_text(data["name"], True, 120)
    if "phone" in data:
        phone = clean_text(data["phone"], False, 30) or None
        if phone and row("SELECT 1 FROM accounts WHERE phone=? AND id!=?", (phone, user["id"])):
            abort(409, "Số điện thoại đã thuộc tài khoản khác.")
        fields["phone"] = phone
    if "theme" in data:
        theme = clean_text(data["theme"], False, 80)
        if theme and not re.fullmatch(r"(?:(?:theme|preset)-[\w-]+|custom:#[a-fA-F0-9]{6})", theme):
            abort(400, "Tên giao diện không hợp lệ.")
        fields["theme"] = theme
    if "password" in data and clean_text(data["password"], False, 128):
        current_pw = clean_text(data.get("current_password"), True, 128)
        acc = row("SELECT password_hash, auth_version FROM accounts WHERE id=?", (user["id"],))
        if not check_password_hash(acc["password_hash"], current_pw):
            abort(403, "Mật khẩu hiện tại chưa đúng.")
        fields["password_hash"] = generate_password_hash(clean_text(data["password"], True, 128))
        fields["auth_version"] = acc["auth_version"] + 1
    db = get_db()
    with db:
        set_fields("accounts", user["id"], fields)
    if "auth_version" in fields:
        session["auth_version"] = fields["auth_version"]
    return jsonify(user=actor())


@bp.post("/api/account/avatar")
def upload_own_avatar():
    user = actor()
    if user["role"] == "homework":
        abort(403, "Chế độ mã bài tập không thể cập nhật ảnh đại diện.")
    storage = request.files.get("avatar") or request.files.get("file")
    if not storage or not storage.filename:
        abort(400, "Vui lòng chọn tệp ảnh hợp lệ.")
    data = storage.read()
    if not data or len(data) > 5 * 1024 * 1024:
        abort(400, "Ảnh đại diện phải nhỏ hơn 5 MB.")
    mime = (storage.mimetype or "").lower()
    if mime not in ("image/png", "image/jpeg", "image/webp", "image/gif"):
        abort(400, "Chỉ hỗ trợ ảnh PNG, JPG, WebP hoặc GIF.")
    name = clean_text(storage.filename.replace("\\", "/").split("/")[-1], True, 180)
    db = get_db()
    with db:
        db.execute("DELETE FROM files WHERE avatar_id=?", (user["id"],))
        db.execute(
            "INSERT INTO files(avatar_id, name, mime, size, content) VALUES(?,?,?,?,?)",
            (user["id"], name, mime, len(data), data),
        )
    return jsonify(user=actor())


@bp.get("/api/dashboard")
def get_dashboard():
    user = actor()
    return jsonify(
        user=user,
        students=records("students", user),
        tutors=records("tutors", user),
        classes=records("classes", user),
        centers=records("centers", user),
        assignments=records("assignments", user),
        submissions=records("submissions", user),
        lessons=records("lessons", user),
        schedules=records("schedules", user),
        feedback=records("feedback", user),
        payments=records("payments", user),
        settings={} if user["role"] == "homework" else _settings_map(),
    )


@bp.get("/api/invoices/<int:student_id>")
def get_invoice(student_id):
    user = actor()
    require(user, "student", "tutor", "admin")
    student = record("students", user, student_id, active=True)
    month = request.args.get("month", "").strip()
    if month and not re.fullmatch(r"\d{4}-\d{2}", month):
        abort(400, "Kỳ học phải có dạng YYYY-MM.")
    lessons = [
        l for l in records("lessons", user)
        if l["student_id"] == student_id and not l["deleted_at"] and (not month or l["date"].startswith(month))
    ]
    assignments = [
        a for a in records("assignments", user)
        if a["student_id"] == student_id
        and not a["deleted_at"]
        and (not month or (a["due_date"] or a["release_date"] or "").startswith(month))
    ]
    assignment_ids = {a["id"] for a in assignments}
    submissions = [
        s for s in records("submissions", user)
        if s["student_id"] == student_id and not s["deleted_at"] and s["assignment_id"] in assignment_ids
    ]
    total = sum(int(l["amount"] or 0) for l in lessons)
    paid = sum(int(l["amount"] or 0) for l in lessons if l["paid"])
    return jsonify(
        student=student,
        month=month,
        lessons=lessons,
        assignments=assignments,
        submissions=submissions,
        total=total,
        paid=paid,
        balance=total - paid,
    )


@bp.post("/api/students")
def create_student():
    user = actor()
    require(user, "tutor", "admin")
    data = payload()
    name = clean_text(data.get("name"), True, 120)
    login_id = clean_text(data.get("login"), False, 80) or _unique_code("HS", "accounts", "login")
    if row("SELECT 1 FROM accounts WHERE login=?", (login_id,)):
        abort(409, "Mã đăng nhập học sinh đã tồn tại.")
    phone = clean_text(data.get("phone"), False, 30) or None
    if phone and row("SELECT 1 FROM accounts WHERE phone=?", (phone,)):
        abort(409, "Số điện thoại đã thuộc tài khoản khác.")
    password = clean_text(data.get("password"), False, 128) or "123456"
    tutor_id = user["id"] if user["role"] == "tutor" else integer(data.get("tutor_id"), 1)
    if user["role"] == "admin":
        record("tutors", user, tutor_id, active=True)
    class_id = optional_id(data.get("class_id"))
    if class_id is not None:
        cls = record("classes", user, class_id, active=True)
        if cls["tutor_id"] != tutor_id:
            abort(400, "Lớp học không thuộc gia sư được chọn.")
    hw_code = clean_text(data.get("homework_code"), False, 60) or _unique_code("BT-", "students", "homework_code")
    if row("SELECT 1 FROM students WHERE homework_code=?", (hw_code,)):
        abort(409, "Mã bài tập đã tồn tại.")
    tuition = integer(data.get("tuition", 0), 0, 100_000_000)
    parent_name = clean_text(data.get("parent_name"), False, 120)
    announcement = clean_text(data.get("announcement"), False, 1000)
    db = get_db()
    with db:
        sid = add_row(
            "accounts",
            {
                "role": "student",
                "login": login_id,
                "phone": phone,
                "name": name,
                "password_hash": generate_password_hash(password),
            },
        )
        add_row(
            "students",
            {
                "id": sid,
                "tutor_id": tutor_id,
                "class_id": class_id,
                "parent_name": parent_name,
                "tuition": tuition,
                "homework_code": hw_code,
                "announcement": announcement,
            },
        )
    return jsonify(student=record("students", user, sid)), 201


@bp.patch("/api/students/<int:student_id>")
def update_student(student_id):
    user = actor()
    require(user, "tutor", "admin")
    existing = record("students", user, student_id)
    data = payload()
    acc_fields = {}
    stu_fields = {}
    if "name" in data:
        acc_fields["name"] = clean_text(data["name"], True, 120)
    if "phone" in data:
        phone = clean_text(data["phone"], False, 30) or None
        if phone and row("SELECT 1 FROM accounts WHERE phone=? AND id!=?", (phone, student_id)):
            abort(409, "Số điện thoại đã thuộc tài khoản khác.")
        acc_fields["phone"] = phone
    if "status" in data:
        status = clean_text(data["status"], True, 20)
        if status not in ("active", "locked"):
            abort(400, "Trạng thái không hợp lệ.")
        acc_fields["status"] = status
        if status == "locked":
            acc = row("SELECT auth_version FROM accounts WHERE id=?", (student_id,))
            acc_fields["auth_version"] = acc["auth_version"] + 1
    if "password" in data and clean_text(data["password"], False, 128):
        acc = row("SELECT auth_version FROM accounts WHERE id=?", (student_id,))
        acc_fields["password_hash"] = generate_password_hash(clean_text(data["password"], True, 128))
        acc_fields["auth_version"] = acc["auth_version"] + 1
    if "parent_name" in data:
        stu_fields["parent_name"] = clean_text(data["parent_name"], False, 120)
    if "tuition" in data:
        stu_fields["tuition"] = integer(data["tuition"], 0, 100_000_000)
    if "announcement" in data:
        stu_fields["announcement"] = clean_text(data["announcement"], False, 1000)
    if "homework_code" in data:
        hw_code = clean_text(data["homework_code"], True, 60)
        if row("SELECT 1 FROM students WHERE homework_code=? AND id!=?", (hw_code, student_id)):
            abort(409, "Mã bài tập đã tồn tại.")
        stu_fields["homework_code"] = hw_code
    if "class_id" in data:
        class_id = optional_id(data["class_id"])
        if class_id is not None:
            cls = record("classes", user, class_id, active=True)
            if cls["tutor_id"] != existing["tutor_id"]:
                abort(400, "Lớp học không thuộc gia sư của học sinh này.")
        stu_fields["class_id"] = class_id
    db = get_db()
    with db:
        set_fields("accounts", student_id, acc_fields)
        set_fields("students", student_id, stu_fields)
    return jsonify(student=record("students", user, student_id))


@bp.delete("/api/students/<int:student_id>")
def delete_student(student_id):
    user = actor()
    require(user, "tutor", "admin")
    record("students", user, student_id, active=True)
    db = get_db()
    with db:
        db.execute(
            "UPDATE accounts SET deleted_at=?, auth_version=auth_version+1 WHERE id=?",
            (datetime.now().isoformat(timespec="seconds"), student_id),
        )
    return jsonify(ok=True)


@bp.post("/api/students/<int:student_id>/restore")
def restore_student(student_id):
    user = actor()
    require(user, "tutor", "admin")
    record("students", user, student_id)
    db = get_db()
    with db:
        db.execute("UPDATE accounts SET deleted_at=NULL WHERE id=?", (student_id,))
    return jsonify(student=record("students", user, student_id))


@bp.post("/api/classes")
def create_class():
    user = actor()
    require(user, "tutor", "admin")
    data = payload()
    name = clean_text(data.get("name"), True, 120)
    tutor_id = user["id"] if user["role"] == "tutor" else integer(data.get("tutor_id"), 1)
    if user["role"] == "admin":
        record("tutors", user, tutor_id, active=True)
    center_id = optional_id(data.get("center_id"))
    if center_id is not None:
        record("centers", user, center_id, active=True)
    db = get_db()
    with db:
        cid = add_row("classes", {"tutor_id": tutor_id, "center_id": center_id, "name": name})
    return jsonify(class_item=record("classes", user, cid)), 201


@bp.patch("/api/classes/<int:class_id>")
def update_class(class_id):
    user = actor()
    require(user, "tutor", "admin")
    record("classes", user, class_id, active=True)
    data = payload()
    fields = {}
    if "name" in data:
        fields["name"] = clean_text(data["name"], True, 120)
    db = get_db()
    with db:
        set_fields("classes", class_id, fields)
    return jsonify(class_item=record("classes", user, class_id))


@bp.delete("/api/classes/<int:class_id>")
def delete_class(class_id):
    user = actor()
    require(user, "tutor", "admin")
    record("classes", user, class_id, active=True)
    db = get_db()
    with db:
        set_fields("classes", class_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.post("/api/lessons")
def create_lesson():
    user = actor()
    require(user, "tutor", "admin")
    data = payload()
    student_id = integer(data.get("student_id"), 1)
    student = record("students", user, student_id, active=True)
    lesson_date = iso_date(data.get("date")) or date.today().isoformat()
    status = clean_text(data.get("status") or "Đã học", True, 60)
    default_amount = 0 if re.search(r"nghỉ|vắng", status, re.I) else int(student["tuition"] or 0)
    amount = integer(data["amount"], 0, 100_000_000) if data.get("amount") not in (None, "") else default_amount
    paid = 1 if data.get("paid") in (True, 1, "1", "true") else 0
    fields = {
        "student_id": student_id,
        "tutor_id": student["tutor_id"],
        "date": lesson_date,
        "week": clean_text(data.get("week"), False, 40),
        "subject": clean_text(data.get("subject"), False, 120),
        "content": clean_text(data.get("content"), False, 4000),
        "evaluation": clean_text(data.get("evaluation"), False, 4000),
        "homework_status": clean_text(data.get("homework_status"), False, 120),
        "start_score": score(data.get("start_score")),
        "exam_score": score(data.get("exam_score")),
        "status": status,
        "amount": amount,
        "paid": paid,
    }
    db = get_db()
    with db:
        lid = add_row("lessons", fields)
    return jsonify(lesson=record("lessons", user, lid)), 201


@bp.patch("/api/lessons/<int:lesson_id>")
def update_lesson(lesson_id):
    user = actor()
    require(user, "tutor", "admin")
    record("lessons", user, lesson_id, active=True)
    data = payload()
    fields = {}
    if "date" in data:
        fields["date"] = iso_date(data["date"]) or abort(400, "Ngày học không hợp lệ.")
    for key, limit in (("week", 40), ("subject", 120), ("content", 4000), ("evaluation", 4000), ("homework_status", 120), ("status", 60)):
        if key in data:
            fields[key] = clean_text(data[key], key == "status", limit)
    if "start_score" in data:
        fields["start_score"] = score(data["start_score"])
    if "exam_score" in data:
        fields["exam_score"] = score(data["exam_score"])
    if "amount" in data:
        fields["amount"] = integer(data["amount"], 0, 100_000_000)
    if "paid" in data:
        fields["paid"] = 1 if data["paid"] in (True, 1, "1", "true") else 0
    db = get_db()
    with db:
        set_fields("lessons", lesson_id, fields)
    return jsonify(lesson=record("lessons", user, lesson_id))


@bp.delete("/api/lessons/<int:lesson_id>")
def delete_lesson(lesson_id):
    user = actor()
    require(user, "tutor", "admin")
    record("lessons", user, lesson_id, active=True)
    db = get_db()
    with db:
        set_fields("lessons", lesson_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.put("/api/lessons/payment")
def update_lessons_payment():
    user = actor()
    require(user, "tutor", "admin")
    data = payload()
    raw_ids = data.get("ids")
    if not isinstance(raw_ids, list) or not raw_ids:
        abort(400, "Danh sách buổi học cần cập nhật không hợp lệ.")
    if "paid" not in data or not isinstance(data["paid"], (bool, int)):
        abort(400, "Trạng thái thanh toán phải là true/false.")
    ids = [integer(item, 1) for item in raw_ids]
    paid = 1 if bool(data["paid"]) else 0
    db = get_db()
    with db:
        for lid in ids:
            # Verify every single lesson is in the caller's active scope before committing.
            record("lessons", user, lid, active=True)
            db.execute("UPDATE lessons SET paid=? WHERE id=?", (paid, lid))
    return jsonify(ok=True, count=len(ids), paid=bool(paid))


@bp.post("/api/schedules")
def create_schedule():
    user = actor()
    require(user, "tutor", "admin")
    data = payload()
    student_id = optional_id(data.get("student_id"))
    if student_id is not None:
        student = record("students", user, student_id, active=True)
        tutor_id = student["tutor_id"]
    else:
        tutor_id = user["id"] if user["role"] == "tutor" else integer(data.get("tutor_id"), 1)
        if user["role"] == "admin":
            record("tutors", user, tutor_id, active=True)
    weekday = optional_id(data.get("weekday"))
    if weekday is not None and not 1 <= weekday <= 7:
        abort(400, "Thứ trong tuần phải từ 1 đến 7.")
    sched_date = iso_date(data.get("date"))
    if weekday is None and sched_date is None:
        abort(400, "Cần chọn thứ lặp lại hoặc ngày cụ thể.")
    start_time = clock(data.get("start_time"))
    end_time = clock(data.get("end_time"))
    if start_time >= end_time:
        abort(400, "Giờ kết thúc phải sau giờ bắt đầu.")
    color = clean_text(data.get("color") or "#2563eb", True, 20)
    if not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
        abort(400, "Mã màu phải có dạng #RRGGBB.")
    db = get_db()
    with db:
        sid = add_row(
            "schedules",
            {
                "tutor_id": tutor_id,
                "student_id": student_id,
                "weekday": weekday,
                "date": sched_date,
                "start_time": start_time,
                "end_time": end_time,
                "subject": clean_text(data.get("subject"), False, 120),
                "color": color,
                "note": clean_text(data.get("note"), False, 1000),
            },
        )
    return jsonify(schedule=record("schedules", user, sid)), 201


@bp.patch("/api/schedules/<int:schedule_id>")
def update_schedule(schedule_id):
    user = actor()
    require(user, "tutor", "admin")
    existing = record("schedules", user, schedule_id, active=True)
    data = payload()
    fields = {}
    if "student_id" in data:
        student_id = optional_id(data["student_id"])
        if student_id is not None:
            record("students", user, student_id, active=True)
        fields["student_id"] = student_id
    if "weekday" in data:
        weekday = optional_id(data["weekday"])
        if weekday is not None and not 1 <= weekday <= 7:
            abort(400, "Thứ trong tuần phải từ 1 đến 7.")
        fields["weekday"] = weekday
    if "date" in data:
        fields["date"] = iso_date(data["date"])
    if "start_time" in data:
        fields["start_time"] = clock(data["start_time"])
    if "end_time" in data:
        fields["end_time"] = clock(data["end_time"])
    start_time = fields.get("start_time", existing["start_time"])
    end_time = fields.get("end_time", existing["end_time"])
    if start_time >= end_time:
        abort(400, "Giờ kết thúc phải sau giờ bắt đầu.")
    final_weekday = fields.get("weekday", existing["weekday"])
    final_date = fields.get("date", existing["date"])
    if final_weekday is None and final_date is None:
        abort(400, "Lịch học cần có thứ lặp lại hoặc ngày cụ thể.")
    if "color" in data:
        color = clean_text(data["color"], True, 20)
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", color):
            abort(400, "Mã màu phải có dạng #RRGGBB.")
        fields["color"] = color
    for key, limit in (("subject", 120), ("note", 1000)):
        if key in data:
            fields[key] = clean_text(data[key], False, limit)
    db = get_db()
    with db:
        set_fields("schedules", schedule_id, fields)
    return jsonify(schedule=record("schedules", user, schedule_id))


@bp.delete("/api/schedules/<int:schedule_id>")
def delete_schedule(schedule_id):
    user = actor()
    require(user, "tutor", "admin")
    record("schedules", user, schedule_id, active=True)
    db = get_db()
    with db:
        set_fields("schedules", schedule_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.post("/api/assignments")
def create_assignment():
    user = actor()
    require(user, "tutor", "admin")
    data = payload()
    student_id = integer(data.get("student_id"), 1)
    student = record("students", user, student_id, active=True)
    title = clean_text(data.get("title"), True, 200)
    description = clean_text(data.get("description"), False, 6000)
    release_date = iso_date(data.get("release_date")) or date.today().isoformat()
    due_date = iso_date(data.get("due_date"))
    db = get_db()
    with db:
        aid = add_row(
            "assignments",
            {
                "tutor_id": student["tutor_id"],
                "student_id": student_id,
                "title": title,
                "description": description,
                "release_date": release_date,
                "due_date": due_date,
            },
        )
        _save_uploaded_files(db, request.files.getlist("files"), assignment_id=aid)
    return jsonify(assignment=record("assignments", user, aid)), 201


@bp.patch("/api/assignments/<int:assignment_id>")
def update_assignment(assignment_id):
    user = actor()
    require(user, "tutor", "admin")
    record("assignments", user, assignment_id, active=True)
    data = payload()
    fields = {}
    if "title" in data:
        fields["title"] = clean_text(data["title"], True, 200)
    if "description" in data:
        fields["description"] = clean_text(data["description"], False, 6000)
    if "release_date" in data:
        fields["release_date"] = iso_date(data["release_date"]) or date.today().isoformat()
    if "due_date" in data:
        fields["due_date"] = iso_date(data["due_date"])
    db = get_db()
    with db:
        set_fields("assignments", assignment_id, fields)
        _save_uploaded_files(db, request.files.getlist("files"), assignment_id=assignment_id)
    return jsonify(assignment=record("assignments", user, assignment_id))


@bp.delete("/api/assignments/<int:assignment_id>")
def delete_assignment(assignment_id):
    user = actor()
    require(user, "tutor", "admin")
    record("assignments", user, assignment_id, active=True)
    db = get_db()
    with db:
        set_fields("assignments", assignment_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.post("/api/assignments/<int:assignment_id>/restore")
def restore_assignment(assignment_id):
    user = actor()
    require(user, "tutor", "admin")
    with get_db():
        record("assignments", user, assignment_id)
        set_fields("assignments", assignment_id, {"deleted_at": None})
    return jsonify(ok=True)


@bp.post("/api/submissions")
def create_submission():
    user = actor()
    require(user, "student", "homework")
    data = payload()
    assignment_id = integer(data.get("assignment_id"), 1)
    record("assignments", user, assignment_id, active=True)
    content = clean_text(data.get("content"), False, 6000)
    uploaded = request.files.getlist("files")
    has_file = any(f and f.filename for f in uploaded)
    if not content and not has_file:
        abort(400, "Hãy nhập nội dung bài làm hoặc đính kèm ít nhất một tệp.")
    db = get_db()
    with db:
        sid = add_row(
            "submissions",
            {
                "assignment_id": assignment_id,
                "student_id": user["id"],
                "content": content,
                "submitted_at": datetime.now().isoformat(timespec="seconds"),
            },
        )
        _save_uploaded_files(db, uploaded, submission_id=sid)
    return jsonify(submission=record("submissions", user, sid)), 201


@bp.patch("/api/submissions/<int:submission_id>")
def update_submission(submission_id):
    user = actor()
    require(user, "student", "homework", "tutor", "admin")
    existing = record("submissions", user, submission_id, active=True)
    data = payload()
    db = get_db()
    if user["role"] in ("student", "homework"):
        if existing["score"] is not None:
            abort(403, "Bài nộp đã được chấm điểm, không thể chỉnh sửa.")
        fields = {}
        if "assignment_id" in data:
            aid = integer(data["assignment_id"], 1)
            record("assignments", user, aid, active=True)
            fields["assignment_id"] = aid
        if "content" in data:
            fields["content"] = clean_text(data["content"], False, 6000)
        uploaded = request.files.getlist("files")
        with db:
            set_fields("submissions", submission_id, fields)
            _save_uploaded_files(db, uploaded, submission_id=submission_id)
    else:
        fields = {}
        if "score" in data:
            fields["score"] = score(data["score"])
            fields["graded_at"] = date.today().isoformat() if fields["score"] is not None else None
        if "comment" in data:
            fields["comment"] = clean_text(data["comment"], False, 4000)
        with db:
            set_fields("submissions", submission_id, fields)
    return jsonify(submission=record("submissions", user, submission_id))


@bp.delete("/api/submissions/<int:submission_id>")
def delete_submission(submission_id):
    user = actor()
    require(user, "student", "homework", "tutor", "admin")
    existing = record("submissions", user, submission_id, active=True)
    if user["role"] in ("student", "homework") and existing["score"] is not None:
        abort(403, "Bài nộp đã được chấm điểm, không thể thu hồi.")
    db = get_db()
    with db:
        set_fields("submissions", submission_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.get("/api/files/<int:file_id>")
def get_file(file_id):
    user = actor()
    file_row = row("SELECT id, assignment_id, submission_id, avatar_id, name, mime, content FROM files WHERE id=?", (file_id,))
    if not file_row:
        abort(404, "Không tìm thấy tệp.")
    if file_row["assignment_id"] is not None:
        record("assignments", user, file_row["assignment_id"], active=True)
    elif file_row["submission_id"] is not None:
        record("submissions", user, file_row["submission_id"], active=True)
    elif file_row["avatar_id"] is not None:
        if user["role"] == "homework":
            abort(403, "Không có quyền xem ảnh đại diện.")
        aid = file_row["avatar_id"]
        if aid != user["id"] and user["role"] != "admin":
            allowed_ids = {t["id"] for t in records("tutors", user)} | {s["id"] for s in records("students", user)}
            if aid not in allowed_ids:
                abort(403, "Không có quyền xem tệp này.")
    download = request.args.get("download") == "1"
    mime = file_row["mime"] if file_row["mime"] in SAFE_INLINE_MIMES else "application/octet-stream"
    disposition = "attachment" if (download or mime == "application/octet-stream") else "inline"
    encoded_name = quote(file_row["name"])
    response = Response(file_row["content"], mimetype=mime)
    response.headers["Content-Disposition"] = f"{disposition}; filename*=UTF-8''{encoded_name}"
    response.headers["Cache-Control"] = "private, no-store"
    return response


@bp.post("/api/feedback")
def create_feedback():
    user = actor()
    require(user, "student", "tutor", "admin")
    data = payload()
    content = clean_text(data.get("content"), True, 4000)
    if user["role"] == "student":
        student = record("students", user, user["id"], active=True)
    else:
        student = record("students", user, integer(data.get("student_id"), 1), active=True)
    db = get_db()
    with db:
        fid = add_row(
            "feedback",
            {
                "student_id": student["id"],
                "tutor_id": student["tutor_id"],
                "content": content,
                "created_at": datetime.now().isoformat(timespec="seconds"),
            },
        )
    return jsonify(feedback=record("feedback", user, fid)), 201


@bp.post("/api/tutors")
def create_tutor():
    user = actor()
    require(user, "admin")
    data = payload()
    name = clean_text(data.get("name"), True, 120)
    login_id = clean_text(data.get("login"), False, 80) or _unique_code("GS", "accounts", "login")
    if row("SELECT 1 FROM accounts WHERE login=?", (login_id,)):
        abort(409, "Mã đăng nhập gia sư đã tồn tại.")
    phone = clean_text(data.get("phone"), False, 30) or None
    if phone and row("SELECT 1 FROM accounts WHERE phone=?", (phone,)):
        abort(409, "Số điện thoại đã thuộc tài khoản khác.")
    password = clean_text(data.get("password"), False, 128) or "123456"
    center_id = optional_id(data.get("center_id"))
    if center_id is not None:
        record("centers", user, center_id, active=True)
    account_type = clean_text(data.get("account_type") or "trial", True, 30)
    if account_type not in ("trial", "standard", "pro"):
        abort(400, "Loại tài khoản không hợp lệ.")
    today = date.today()
    next_billing = iso_date(data.get("next_billing_date")) or (today + timedelta(days=15)).isoformat()
    custom_fee = integer(data.get("custom_fee", 0), 0, 100_000_000)
    db = get_db()
    with db:
        tid = add_row(
            "accounts",
            {
                "role": "tutor",
                "login": login_id,
                "phone": phone,
                "name": name,
                "password_hash": generate_password_hash(password),
            },
        )
        add_row(
            "tutors",
            {
                "id": tid,
                "center_id": center_id,
                "account_type": account_type,
                "registered_date": today.isoformat(),
                "next_billing_date": next_billing,
                "custom_fee": custom_fee,
            },
        )
    return jsonify(tutor=record("tutors", user, tid)), 201


@bp.patch("/api/tutors/<int:tutor_id>")
def update_tutor(tutor_id):
    user = actor()
    require(user, "admin")
    record("tutors", user, tutor_id)
    data = payload()
    acc_fields = {}
    tut_fields = {}
    if "name" in data:
        acc_fields["name"] = clean_text(data["name"], True, 120)
    if "phone" in data:
        phone = clean_text(data["phone"], False, 30) or None
        if phone and row("SELECT 1 FROM accounts WHERE phone=? AND id!=?", (phone, tutor_id)):
            abort(409, "Số điện thoại đã thuộc tài khoản khác.")
        acc_fields["phone"] = phone
    if "status" in data:
        status = clean_text(data["status"], True, 20)
        if status not in ("active", "locked"):
            abort(400, "Trạng thái không hợp lệ.")
        acc_fields["status"] = status
        if status == "locked":
            acc = row("SELECT auth_version FROM accounts WHERE id=?", (tutor_id,))
            acc_fields["auth_version"] = acc["auth_version"] + 1
    if "password" in data and clean_text(data["password"], False, 128):
        acc = row("SELECT auth_version FROM accounts WHERE id=?", (tutor_id,))
        acc_fields["password_hash"] = generate_password_hash(clean_text(data["password"], True, 128))
        acc_fields["auth_version"] = acc["auth_version"] + 1
    if "center_id" in data:
        cid = optional_id(data["center_id"])
        if cid is not None:
            record("centers", user, cid, active=True)
        tut_fields["center_id"] = cid
    if "account_type" in data:
        atype = clean_text(data["account_type"], True, 30)
        if atype not in ("trial", "standard", "pro"):
            abort(400, "Loại tài khoản không hợp lệ.")
        tut_fields["account_type"] = atype
    if "next_billing_date" in data:
        tut_fields["next_billing_date"] = iso_date(data["next_billing_date"])
    if "custom_fee" in data:
        tut_fields["custom_fee"] = integer(data["custom_fee"], 0, 100_000_000)
    db = get_db()
    with db:
        set_fields("accounts", tutor_id, acc_fields)
        set_fields("tutors", tutor_id, tut_fields)
    return jsonify(tutor=record("tutors", user, tutor_id))


@bp.delete("/api/tutors/<int:tutor_id>")
def delete_tutor(tutor_id):
    user = actor()
    require(user, "admin")
    record("tutors", user, tutor_id, active=True)
    db = get_db()
    with db:
        db.execute(
            "UPDATE accounts SET deleted_at=?, auth_version=auth_version+1 WHERE id=?",
            (datetime.now().isoformat(timespec="seconds"), tutor_id),
        )
    return jsonify(ok=True)


@bp.post("/api/tutors/<int:tutor_id>/restore")
def restore_tutor(tutor_id):
    user = actor()
    require(user, "admin")
    record("tutors", user, tutor_id)
    db = get_db()
    with db:
        db.execute("UPDATE accounts SET deleted_at=NULL WHERE id=?", (tutor_id,))
    return jsonify(tutor=record("tutors", user, tutor_id))


@bp.post("/api/tutors/<int:tutor_id>/payments")
def renew_tutor(tutor_id):
    user = actor()
    require(user, "admin")
    tutor = record("tutors", user, tutor_id, active=True)
    data = payload()
    amount = integer(data.get("amount", 0), 0, 100_000_000)
    next_date = iso_date(data.get("next_date"))
    if not next_date:
        days = integer(data.get("days", 30), 1, 3650)
        base = date.today()
        if tutor["next_billing_date"]:
            prev = date.fromisoformat(tutor["next_billing_date"])
            if prev > base:
                base = prev
        next_date = (base + timedelta(days=days)).isoformat()
    note = clean_text(data.get("note"), False, 500)
    new_type = clean_text(data.get("account_type") or "standard", True, 30)
    if new_type not in ("trial", "standard", "pro"):
        abort(400, "Loại tài khoản không hợp lệ.")
    db = get_db()
    with db:
        pid = add_row(
            "payments",
            {
                "tutor_id": tutor_id,
                "date": date.today().isoformat(),
                "amount": amount,
                "note": note,
                "previous_date": tutor["next_billing_date"],
                "next_date": next_date,
                "previous_type": tutor["account_type"],
                "previous_status": tutor["status"],
            },
        )
        set_fields("tutors", tutor_id, {"next_billing_date": next_date, "account_type": new_type})
        set_fields("accounts", tutor_id, {"status": "active"})
    return jsonify(payment=record("payments", user, pid), tutor=record("tutors", user, tutor_id)), 201


@bp.delete("/api/payments/<int:payment_id>")
def cancel_payment(payment_id):
    user = actor()
    require(user, "admin")
    payment = record("payments", user, payment_id, active=True)
    db = get_db()
    with db:
        set_fields(
            "tutors",
            payment["tutor_id"],
            {
                "next_billing_date": payment["previous_date"],
                "account_type": payment["previous_type"],
            },
        )
        set_fields("accounts", payment["tutor_id"], {"status": payment["previous_status"]})
        set_fields("payments", payment_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.post("/api/centers")
def create_center():
    user = actor()
    require(user, "admin")
    data = payload()
    code = clean_text(data.get("code"), True, 40).upper()
    if row("SELECT 1 FROM centers WHERE code=?", (code,)):
        abort(409, "Mã trung tâm đã tồn tại.")
    name = clean_text(data.get("name"), True, 120)
    contact = clean_text(data.get("contact"), False, 300)
    db = get_db()
    with db:
        cid = add_row("centers", {"code": code, "name": name, "contact": contact})
    return jsonify(center=record("centers", user, cid)), 201


@bp.patch("/api/centers/<int:center_id>")
def update_center(center_id):
    user = actor()
    require(user, "admin")
    record("centers", user, center_id, active=True)
    data = payload()
    fields = {}
    if "name" in data:
        fields["name"] = clean_text(data["name"], True, 120)
    if "contact" in data:
        fields["contact"] = clean_text(data["contact"], False, 300)
    db = get_db()
    with db:
        set_fields("centers", center_id, fields)
    return jsonify(center=record("centers", user, center_id))


@bp.delete("/api/centers/<int:center_id>")
def delete_center(center_id):
    user = actor()
    require(user, "admin")
    record("centers", user, center_id, active=True)
    db = get_db()
    with db:
        set_fields("centers", center_id, {"deleted_at": datetime.now().isoformat(timespec="seconds")})
    return jsonify(ok=True)


@bp.put("/api/settings")
def update_settings():
    user = actor()
    require(user, "admin")
    data = payload()
    updates = []
    for key, value in data.items():
        if key not in ALLOWED_SETTINGS:
            abort(400, f"Khóa cài đặt '{key}' không được hỗ trợ.")
        updates.append((key, clean_text(str(value if value is not None else ""), False, 4000)))
    db = get_db()
    with db:
        db.executemany(
            "INSERT INTO settings(key, value) VALUES(?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value",
            updates,
        )
    return jsonify(settings=_settings_map())
