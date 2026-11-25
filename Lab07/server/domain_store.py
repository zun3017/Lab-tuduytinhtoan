"""Role-scoped reads and shared input validation for the local school API."""
import re
from datetime import date, time

from flask import abort, request, session

from .db import get_db

TABLES = {
    "students": "student_profiles", "tutors": "tutor_profiles",
    **{name: name for name in ("classes","centers","assignments","submissions","lessons",
                                "schedules","feedback","payments")},
}
FILE_INFO = "id,name,mime,size,'/api/files/' || id AS url"


def row(sql, params=()):
    result = get_db().execute(sql, params).fetchone()
    return dict(result) if result is not None else None


def rows(sql, params=()):
    return [dict(r) for r in get_db().execute(sql, params)]


def actor():
    account = row("""SELECT id,login,phone,name,role,theme,auth_version,
                           (SELECT '/api/files/' || f.id FROM files f WHERE f.avatar_id=a.id) AS avatar_url
                    FROM accounts a WHERE id=? AND status='active' AND deleted_at IS NULL""", (session.get("account_id"),))
    if not account or account.pop("auth_version") != session.get("auth_version"):
        abort(401, "Vui lòng đăng nhập để tiếp tục.")
    if session.get("homework_only"):
        return {"id":account["id"], "name":account["name"], "role":"homework"}
    return account


def require(user, *roles):
    if user["role"] not in roles:
        abort(403, "Tài khoản chưa được cấp quyền cho thao tác này.")


def scope(resource, user):
    role = user["role"]
    uid = user["id"]
    if role == "admin":
        return "1", ()
    if role == "tutor":
        if resource == "tutors":
            return "t.id=?", (uid,)
        if resource == "centers":
            return "t.id IN (SELECT center_id FROM tutors WHERE id=?)", (uid,)
        if resource == "submissions":
            return "t.student_id IN (SELECT id FROM students WHERE tutor_id=?)", (uid,)
        return "t.tutor_id=?", (uid,)
    if role == "homework" and resource not in ("students","assignments","submissions"):
        return "0", ()
    if resource == "students":
        return "t.id=? AND t.deleted_at IS NULL", (uid,)
    if resource == "tutors":
        return "t.id IN (SELECT tutor_id FROM students WHERE id=?) AND t.deleted_at IS NULL", (uid,)
    if resource == "classes":
        return "t.id IN (SELECT class_id FROM students WHERE id=?) AND t.deleted_at IS NULL", (uid,)
    if resource == "centers":
        return "t.id IN (SELECT c.center_id FROM classes c JOIN students s ON s.class_id=c.id WHERE s.id=?) AND t.deleted_at IS NULL", (uid,)
    if resource == "payments":
        return "0", ()
    if resource == "assignments":
        return "t.student_id=? AND t.deleted_at IS NULL AND t.release_date<=?", (uid,date.today().isoformat())
    if resource == "submissions":
        return ("t.student_id=? AND EXISTS (SELECT 1 FROM assignments a WHERE a.id=t.assignment_id "
                "AND a.deleted_at IS NULL AND a.release_date<=?)"), (uid,date.today().isoformat())
    return "t.student_id=? AND t.deleted_at IS NULL", (uid,)


def records(resource, user, record_id=None):
    table = TABLES.get(resource)
    if not table:
        abort(404)
    condition, args = scope(resource, user)
    if record_id is not None:
        condition += " AND t.id=?"
        args += (record_id,)
    columns = "t.*"
    if user["role"] == "homework" and resource == "students":
        columns = "t.id,t.name"
    if user["role"] == "student" and resource == "tutors":
        columns = "t.id,t.name,t.phone,t.avatar_url"
    found = rows(f"SELECT {columns} FROM {table} t WHERE {condition} ORDER BY t.id", args)
    if resource in ("assignments","submissions") and found:
        parent = "assignment_id" if resource == "assignments" else "submission_id"
        files = rows(f"""SELECT f.{parent} AS owner,{FILE_INFO} FROM files f
                        WHERE f.{parent} IN (SELECT t.id FROM {table} t WHERE {condition}) ORDER BY f.id""", args)
        items = {r["id"]: r for r in found}
        for item in found:
            item["files"] = []
        for f in files:
            items[f.pop("owner")]["files"].append(f)
    return found


def record(resource, user, record_id, active=False):
    found = records(resource, user, record_id)
    if not found or (active and found[0].get("deleted_at")):
        abort(404, "Không tìm thấy dữ liệu trong phạm vi truy cập.")
    return found[0]


def payload():
    value = request.get_json(silent=True) if request.is_json else request.form.to_dict()
    if not isinstance(value, dict):
        abort(400, "Dữ liệu gửi lên chưa đúng định dạng.")
    return value


def clean_text(value, required=False, limit=6000):
    if value is None:
        value = ""
    if not isinstance(value, str):
        abort(400, "Nội dung phải là văn bản.")
    value = value.strip()
    if (required and not value) or len(value)>limit or "\x00" in value:
        abort(400, "Kiểm tra lại độ dài và nội dung của trường nhập.")
    return value


def integer(value, minimum=0, maximum=1_000_000_000):
    if isinstance(value, bool) or not re.fullmatch(r"[0-9]{1,12}", str(value)):
        abort(400, "Giá trị phải là số nguyên hợp lệ.")
    number = int(value)
    if not minimum <= number <= maximum:
        abort(400, "Giá trị số ngoài giới hạn.")
    return number


def optional_id(value):
    return None if value in ("",None) else integer(value, 1)


def score(value):
    if value in (None,""):
        return None
    try:
        number = float(value)
    except (ValueError,TypeError):
        abort(400, "Điểm phải từ 0 đến 10.")
    if isinstance(value,bool) or not 0 <= number <= 10:
        abort(400, "Điểm phải từ 0 đến 10.")
    return number


def iso_date(value):
    if value in (None,""):
        return None
    try:
        return date.fromisoformat(value).isoformat()
    except (TypeError,ValueError):
        abort(400, "Ngày phải có dạng YYYY-MM-DD.")


def clock(value):
    try:
        return time.fromisoformat(value).strftime("%H:%M")
    except (TypeError,ValueError):
        abort(400, "Giờ phải có dạng HH:MM.")


def set_fields(table, object_id, fields):
    # All table and column names come from explicit server-side allowlists.
    if fields:
        sql = ", ".join(name+"=?" for name in fields)
        get_db().execute(f"UPDATE {table} SET {sql} WHERE id=?", (*fields.values(), object_id))


def add_row(table, fields):
    names = ", ".join(fields)
    params = ", ".join("?" for _ in fields)
    return get_db().execute(f"INSERT INTO {table} ({names}) VALUES ({params})", tuple(fields.values())).lastrowid

