"""Exercise SQLite authorization, seed idempotence and atomic billing through Flask."""
import tempfile
import unittest
from pathlib import Path

from flask import Flask


class DomainScopeTest(unittest.TestCase):
    def setUp(self):
        try:
            from server import db, domain
        except ImportError:
            self.fail("The local SQLite domain API has not been implemented")
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True, SECRET_KEY="test", DATABASE=str(Path(directory.name) / "school.db"))
        db.init_app(self.app)
        self.app.register_blueprint(domain.bp)
        self.client = self.app.test_client()

    def login(self, login, password):
        result = self.client.post("/api/login", json={"login": login, "password": password})
        self.assertEqual(result.status_code, 200, result.get_json())

    def test_homework_code_cannot_open_private_student_data(self):
        result = self.client.post("/api/homework/access", json={"code": "BT-SAO-07"})
        self.assertEqual(result.status_code, 200)
        sid = result.json["user"]["id"]
        self.assertEqual(self.client.get(f"/api/invoices/{sid}").status_code, 403)
        dashboard = self.client.get("/api/dashboard").json
        self.assertTrue(dashboard["assignments"])
        self.assertFalse(dashboard["lessons"])
        self.assertFalse(dashboard["payments"])

    def test_seed_preserves_edited_student_name(self):
        self.login("GS0701", "741963")
        sid = self.client.get("/api/dashboard").json["students"][0]["id"]
        self.assertEqual(self.client.patch(f"/api/students/{sid}", json={"name": "Tên sau chỉnh sửa"}).status_code, 200)
        result = self.app.test_cli_runner().invoke(args=["init-db"])
        self.assertEqual(result.exit_code, 0, result.output)
        people = self.client.get("/api/dashboard").json["students"]
        self.assertEqual([p["name"] for p in people if p["id"] == sid], ["Tên sau chỉnh sửa"])

    def test_batch_fees_rollback_if_any_lesson_out_of_scope(self):
        self.login("GS0701", "741963")
        lesson = next(x for x in self.client.get("/api/dashboard").json["lessons"] if not x["paid"])
        result = self.client.put("/api/lessons/payment", json={"ids": [lesson["id"], 999999], "paid": True})
        self.assertIn(result.status_code, (403, 404))
        lessons = self.client.get("/api/dashboard").json["lessons"]
        self.assertFalse(next(x["paid"] for x in lessons if x["id"] == lesson["id"]))

