import tempfile
import unittest
from pathlib import Path

from server import create_app


class DemoCalendar(unittest.TestCase):
    def test_edits_are_persistent_and_scoped_to_the_demo_visitor(self):
        with tempfile.TemporaryDirectory() as tmp:
            app = create_app({"DATABASE": str(Path(tmp) / "lab.db"), "TESTING": True})
            first, second = app.test_client(), app.test_client()
            state = first.get("/api/demo/calendar").get_json()
            state["rows"][0]["tue"] = "13:00 - 14:00 (Ôn tập)"
            self.assertEqual(first.put("/api/demo/calendar", json=state).status_code, 200)
            self.assertEqual(first.put("/api/demo/calendar", json=state).status_code, 409)
            self.assertEqual(first.get("/api/demo/calendar").json["rows"], state["rows"])
            self.assertNotEqual(second.get("/api/demo/calendar").json["rows"], state["rows"])
