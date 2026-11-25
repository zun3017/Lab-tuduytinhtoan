"""Contract tests use a temporary SQLite database. Only Google's HTTP response is simulated."""
import io
import json
import sqlite3
import unittest
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch
from urllib.error import HTTPError

from flask import Flask

ROOT = Path(__file__).resolve().parents[1]
ROUTE = "/api/translate/homepage"


class HomepageTranslationTests(unittest.TestCase):
    def setUp(self):
        from server import translation

        self.translation = translation
        self.temp = TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.db = sqlite3.connect(Path(self.temp.name) / "translations.db")
        self.addCleanup(self.db.close)
        self.db.row_factory = sqlite3.Row
        self.db.executescript((ROOT / "server/translation.sql").read_text(encoding="utf-8"))
        self.app = Flask(__name__)
        self.app.config.update(TESTING=True, GOOGLE_TRANSLATE_API_KEY="")
        self.app.register_blueprint(translation.bp)
        self.client = self.app.test_client()
        db_patch = patch.object(translation, "get_db", return_value=self.db)
        db_patch.start()
        self.addCleanup(db_patch.stop)

    def post(self, target):
        return self.client.post(ROUTE, json={"target": target})

    def test_requires_exactly_one_supported_target(self):
        for body in ({"target": "fr"}, {"target": []}, {"text": "private"}, {"target": "en", "q": "private"}, None):
            with self.subTest(body=body):
                self.assertEqual(self.client.post(ROUTE, json=body).status_code, 400)

    def test_vietnamese_is_available_offline(self):
        response = self.post("vi")
        self.assertEqual(response.status_code, 200)
        self.assertIn("Trang chủ", response.json["translations"].values())

    def test_missing_key_is_actionable(self):
        response = self.post("ja")
        self.assertEqual(response.status_code, 503)
        self.assertEqual(response.json["error"], "missing_key")

    def test_versions_and_batches_only_missing_text_and_reuses_cache_without_key(self):
        catalog = {f"item{i}": f"Văn bản {i}" for i in range(130)}
        self.app.config["GOOGLE_TRANSLATE_API_KEY"] = "test-key"
        sent = []

        def google(request, timeout):
            self.assertEqual(request.full_url, "https://translation.googleapis.com/language/translate/v2")
            self.assertEqual(request.get_method(), "POST")
            self.assertGreater(timeout, 0)
            payload = json.loads(request.data)
            self.assertEqual((payload["target"], payload["source"], payload["format"]), ("en", "vi", "text"))
            sent.append(payload["q"])
            result = [{"translatedText": f"{text} &amp; EN"} for text in payload["q"]]
            return io.BytesIO(json.dumps({"data": {"translations": result}}).encode())

        with patch.object(self.translation, "CATALOG", catalog), patch.object(self.translation, "open_google", side_effect=google):
            first = self.post("en")
            self.assertEqual(first.status_code, 200)
            self.assertEqual(first.json["translations"]["item129"], "Văn bản 129 & EN")
            self.assertEqual([len(batch) for batch in sent], [128, 2])
            self.app.config["GOOGLE_TRANSLATE_API_KEY"] = ""
            cached = self.post("en")
            self.assertEqual(cached.json["source"], "sqlite")
            self.assertEqual(first.json["translations"], cached.json["translations"])
            self.app.config["GOOGLE_TRANSLATE_API_KEY"] = "test-key"
            catalog["item7"] = "Đã đổi"
            updated = self.post("en")
            self.assertEqual(updated.json["translations"]["item7"], "Đã đổi & EN")
            self.assertEqual(sent[2:], [["Đã đổi"]])

    def test_failed_google_requests_return_safe_errors_and_do_not_poison_cache(self):
        self.app.config["GOOGLE_TRANSLATE_API_KEY"] = "PRIVATE-TEST-KEY"
        quota_body = b'{"error":{"message":"Daily Limit Exceeded"}}'
        for http_status, body, expected_status, code in [
            (403, quota_body, 429, "quota"), (403, b'{}', 502, "google_denied"), (500, b'{}', 502, "google_error")
        ]:
            error = HTTPError("test", http_status, "PRIVATE-TEST-KEY", {}, io.BytesIO(body))
            with self.subTest(code=code), patch.object(self.translation, "open_google", side_effect=error):
                response = self.post("ko")
                self.assertEqual(response.status_code, expected_status)
                self.assertEqual(response.json["error"], code)
                self.assertNotIn("PRIVATE-TEST-KEY", response.text)
        with patch.object(self.translation, "open_google", side_effect=TimeoutError()):
            self.assertEqual(self.post("ko").json["error"], "network")
        with patch.object(self.translation, "open_google", return_value=io.BytesIO(b'{"data":{"translations":[]}}')):
            self.assertEqual(self.post("ko").json["error"], "google_error")
        self.app.config["GOOGLE_TRANSLATE_API_KEY"] = ""
        self.assertEqual(self.post("ko").json["error"], "missing_key")

    def test_ui_translation_endpoint_supports_vi_cache_and_batching(self):
        vi = self.client.post("/api/translate/ui", json={"target": "vi"})
        self.assertEqual(vi.status_code, 200)
        self.assertIn("Trang chủ", vi.json["translations"].values())

        self.assertEqual(self.client.post("/api/translate/ui", json={"target": "en"}).status_code, 503)

        self.app.config["GOOGLE_TRANSLATE_API_KEY"] = "test-key"
        ui_catalog = {"ui.a": "Trang chủ", "ui.b": "Đăng nhập"}

        def google(request, timeout):
            payload = json.loads(request.data)
            result = [{"translatedText": f"{text} EN"} for text in payload["q"]]
            return io.BytesIO(json.dumps({"data": {"translations": result}}).encode())

        with patch.object(self.translation, "UI_CATALOG", ui_catalog), patch.object(self.translation, "open_google", side_effect=google):
            res = self.client.post("/api/translate/ui", json={"target": "en"})
            self.assertEqual(res.status_code, 200)
            self.assertEqual(res.json["translations"]["ui.a"], "Trang chủ EN")
            self.app.config["GOOGLE_TRANSLATE_API_KEY"] = ""
            cached = self.client.post("/api/translate/ui", json={"target": "en"})
            self.assertEqual(cached.status_code, 200)
            self.assertEqual(cached.json["source"], "sqlite")
