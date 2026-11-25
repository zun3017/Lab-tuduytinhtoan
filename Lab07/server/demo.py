"""A visitor's private practice timetable, kept apart from teaching accounts."""
import json
import re
import secrets

from flask import Blueprint, jsonify, request, session

from .db import get_db

bp = Blueprint("practice", __name__)
DAYS = ("mon", "tue", "wed", "thu", "fri", "sat", "sun")
STUDENTS = (
    ("Mộc An", "#6378EB", "mon", "16:15 - 17:15 (Phân số)"),
    ("Đăng Khoa", "#E76C9C", "wed", "17:00 - 18:00 (Hình học)"),
    ("Thảo Vi", "#23A587", "fri", "15:30 - 16:45 (Tư duy logic)"),
)


def init_schema(connection):
    connection.execute("""CREATE TABLE IF NOT EXISTS demo_calendars (
        visitor TEXT PRIMARY KEY, revision INTEGER NOT NULL, rows_json TEXT NOT NULL
    )""")


def valid_rows(rows):
    if not isinstance(rows, list) or len(rows) != len(STUDENTS):
        return False
    for row, (name, *_) in zip(rows, STUDENTS):
        if not isinstance(row, dict) or set(row) != {"studentName", "color", *DAYS}:
            return False
        if row["studentName"] != name or not re.fullmatch(r"#[a-fA-F0-9]{6}", str(row["color"])):
            return False
        if any(not isinstance(row[d], str) or len(row[d]) > 2000 for d in DAYS):
            return False
    return True


@bp.route("/api/demo/calendar", methods=["GET", "PUT"])
def practice():
    connection = get_db()
    visitor = session.setdefault("demo_calendar", secrets.token_urlsafe(24))
    if request.method == "GET":
        calendar = connection.execute("SELECT revision, rows_json FROM demo_calendars WHERE visitor=?", (visitor,)).fetchone()
        if calendar:
            return jsonify(revision=calendar[0], rows=json.loads(calendar[1]))
        rows = [{**dict.fromkeys(DAYS, ""), "studentName": name, "color": color} for name, color, _, _ in STUDENTS]
        for row, (_, _, day, slot) in zip(rows, STUDENTS):
            row[day] = slot
        with connection:
            connection.execute("INSERT OR IGNORE INTO demo_calendars VALUES (?, 0, ?)", (visitor, json.dumps(rows)))
        return jsonify(revision=0, rows=rows)

    payload = request.get_json(silent=True)
    if not isinstance(payload, dict) or type(payload.get("revision")) is not int or not valid_rows(payload.get("rows")):
        return jsonify(error="Lịch gửi lên chưa hợp lệ."), 400
    with connection:
        changed = connection.execute("UPDATE demo_calendars SET revision=revision+1, rows_json=? WHERE visitor=? AND revision=?",
                                     (json.dumps(payload["rows"]), visitor, payload["revision"])).rowcount
        if not changed:
            return jsonify(error="Lịch đã thay đổi ở cửa sổ khác. Vui lòng tải lại."), 409
    return jsonify(revision=payload["revision"] + 1)
