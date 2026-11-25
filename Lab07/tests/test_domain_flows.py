"""End-to-end SQLite integration tests for all role flows, file BLOBs, and restarts."""
import io
import tempfile
import unittest
from pathlib import Path

from server import create_app


class DomainFlowsTests(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.db_path = str(Path(self.folder.name) / "lab07.sqlite3")
        self.config = {"TESTING": True, "DATABASE": self.db_path, "GOOGLE_TRANSLATE_API_KEY": ""}
        self.app = create_app(self.config)

    def login(self, client, login, password):
        res = client.post("/api/login", json={"login": login, "password": password})
        self.assertEqual(res.status_code, 200, res.get_json())
        return res.get_json()["user"]

    def test_all_referenced_scripts_exist_and_serve_locally(self):
        client = self.app.test_client()
        for asset in (
            "/js/api.js",
            "/js/navigation.js",
            "/js/login.js",
            "/js/homework.js",
            "/js/student.js",
            "/js/tutor.js",
            "/js/calendar.js",
            "/js/admin.js",
            "/js/invoice.js",
            "/js/demo-calendar.js",
            "/js/homepage.js",
            "/vendor/chart.umd.min.js",
            "/vendor/fullcalendar.min.js",
            "/vendor/html2canvas.min.js",
        ):
            with self.subTest(asset=asset):
                resp = client.get(asset)
                self.assertEqual(resp.status_code, 200)
                resp.close()

    def test_assign_submit_grade_feedback_and_restart_persistence(self):
        tutor = self.app.test_client()
        student = self.app.test_client()
        other_tutor = self.app.test_client()

        self.login(tutor, "GS0701", "741963")
        self.login(student, "HS0701", "258147")
        self.login(other_tutor, "GS0702", "684219")

        sid = tutor.get("/api/dashboard").json["students"][0]["id"]

        # 1. Tutor assigns homework with a BLOB attachment
        assign_res = tutor.post(
            "/api/assignments",
            data={
                "student_id": str(sid),
                "title": "Bài tập đại số tuần 4",
                "description": "Giải 3 phương trình bậc nhất.",
                "due_date": "2026-12-01",
                "files": (io.BytesIO(b"De bai tap: x + 2 = 5\n"), "de-bai.txt"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(assign_res.status_code, 201, assign_res.get_json())
        assignment = assign_res.json["assignment"]
        self.assertEqual(len(assignment["files"]), 1)
        assign_file_url = assignment["files"][0]["url"]

        # Other tutor must NOT be able to view this student's assignment file
        self.assertEqual(other_tutor.get(assign_file_url).status_code, 404)

        # 2. Student downloads attachment and submits homework with file
        dl_res = student.get(assign_file_url)
        self.assertEqual(dl_res.status_code, 200)
        self.assertIn(b"x + 2 = 5", dl_res.data)
        dl_res.close()

        sub_res = student.post(
            "/api/submissions",
            data={
                "assignment_id": str(assignment["id"]),
                "content": "Em tìm được x = 3 ạ.",
                "files": (io.BytesIO(b"Loi giai: x = 5 - 2 = 3.\n"), "bai-lam.txt"),
            },
            content_type="multipart/form-data",
        )
        self.assertEqual(sub_res.status_code, 201, sub_res.get_json())
        submission = sub_res.json["submission"]
        sub_file_url = submission["files"][0]["url"]

        # 3. Tutor inspects submitted file, grades and comments
        sub_dl = tutor.get(sub_file_url)
        self.assertEqual(sub_dl.status_code, 200)
        self.assertIn(b"x = 5 - 2 = 3", sub_dl.data)
        sub_dl.close()

        grade_res = tutor.patch(
            f"/api/submissions/{submission['id']}",
            json={"score": 9.5, "comment": "Trình bày rõ ràng, đúng kết quả."},
        )
        self.assertEqual(grade_res.status_code, 200, grade_res.get_json())
        self.assertEqual(grade_res.json["submission"]["score"], 9.5)

        # Student cannot edit after grading, and reads updated grade & feedback
        self.assertEqual(
            student.patch(f"/api/submissions/{submission['id']}", json={"content": "Sửa sau chấm"}).status_code,
            403,
        )
        stu_dash = student.get("/api/dashboard").json
        matched_sub = next(s for s in stu_dash["submissions"] if s["id"] == submission["id"])
        self.assertEqual(matched_sub["score"], 9.5)
        self.assertEqual(matched_sub["comment"], "Trình bày rõ ràng, đúng kết quả.")

        # Student sends feedback to tutor
        fb_res = student.post("/api/feedback", json={"content": "Em muốn xin thêm bài nâng cao."})
        self.assertEqual(fb_res.status_code, 201)

        # 4. Restart Flask app with same SQLite DB and verify persistence
        restarted = create_app(self.config)
        tutor_after = restarted.test_client()
        self.login(tutor_after, "GS0701", "741963")
        after_dash = tutor_after.get("/api/dashboard").json
        self.assertTrue(any(a["title"] == "Bài tập đại số tuần 4" for a in after_dash["assignments"]))
        self.assertTrue(any(f["content"] == "Em muốn xin thêm bài nâng cao." for f in after_dash["feedback"]))

    def test_schedule_invoice_and_admin_lifecycle(self):
        tutor = self.app.test_client()
        admin = self.app.test_client()
        self.login(tutor, "GS0701", "741963")
        self.login(admin, "QT0701", "963852")

        dash = tutor.get("/api/dashboard").json
        sid = dash["students"][0]["id"]

        # Tutor adds a schedule and a lesson, checks invoice consistency
        sched = tutor.post(
            "/api/schedules",
            json={"student_id": sid, "weekday": 5, "start_time": "18:00", "end_time": "19:30", "subject": "Hình học", "color": "#10b981"},
        )
        self.assertEqual(sched.status_code, 201)
        lesson = tutor.post(
            "/api/lessons",
            json={"student_id": sid, "date": "2026-11-20", "subject": "Toán", "content": "Ôn tập", "amount": 140000, "paid": False},
        )
        self.assertEqual(lesson.status_code, 201)

        inv = tutor.get(f"/api/invoices/{sid}").json
        self.assertEqual(inv["total"], sum(l["amount"] for l in inv["lessons"]))
        self.assertEqual(inv["balance"], inv["total"] - inv["paid"])

        # Admin creates center, renews tutor, cancels payment, updates settings
        center = admin.post("/api/centers", json={"code": "LAB07C", "name": "Cơ sở B", "contact": "Phòng 202"})
        self.assertEqual(center.status_code, 201)
        t2 = next(t for t in admin.get("/api/dashboard").json["tutors"] if t["login"] == "GS0702")
        pay = admin.post(f"/api/tutors/{t2['id']}/payments", json={"days": 30, "amount": 199000, "account_type": "standard", "note": "Gói tháng"})
        self.assertEqual(pay.status_code, 201)
        pid = pay.json["payment"]["id"]
        self.assertEqual(admin.delete(f"/api/payments/{pid}").status_code, 200)
        self.assertEqual(admin.put("/api/settings", json={"marquee": "Thông báo mới Lab07"}).status_code, 200)
        self.assertEqual(admin.get("/api/dashboard").json["settings"]["marquee"], "Thông báo mới Lab07")

    def test_register_and_recover_password(self):
        client = self.app.test_client()
        reg = client.post("/api/register", json={"name": "Gia sư Mới", "login": "GSNEW", "password": "pin123"})
        self.assertEqual(reg.status_code, 201)
        recovery_code = reg.json["recovery_code"]
        client.post("/api/logout", json={})
        rec = client.post("/api/recover", json={"login": "GSNEW", "recovery_code": recovery_code, "password": "pin456"})
        self.assertEqual(rec.status_code, 200)
        self.assertEqual(client.post("/api/login", json={"login": "GSNEW", "password": "pin456"}).status_code, 200)
