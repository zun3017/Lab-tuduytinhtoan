import tempfile
import unittest
from pathlib import Path

from server import create_app


class ApplicationBoundary(unittest.TestCase):
    def setUp(self):
        self.folder = tempfile.TemporaryDirectory()
        self.addCleanup(self.folder.cleanup)
        self.config = {"TESTING": True, "DATABASE": str(Path(self.folder.name) / "test.sqlite3"),
                       "GOOGLE_TRANSLATE_API_KEY": ""}
        self.app = create_app(self.config)
        self.client = self.app.test_client()

    def test_private_files_are_outside_the_document_root(self):
        for resource in ["/.env", "/.env.example", "/server/schema.sql", "/instance/lab07.sqlite3",
                         "/PROMPT_ZUNTUTOR_LAB07.md", "/requirements.txt"]:
            with self.subTest(resource=resource):
                self.assertEqual(self.client.get(resource).status_code, 404)

    def test_browser_connections_are_local_and_cross_origin_writes_denied(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("connect-src 'self'", response.headers["Content-Security-Policy"])
        response.close()
        denied = self.client.post("/api/translate/homepage", json={"target": "vi"},
                                  headers={"Origin": "https://elsewhere.invalid"})
        self.assertEqual(denied.status_code, 403)
        self.assertIn("no-store", denied.headers["Cache-Control"])

    def test_signing_key_survives_restart_and_differs_between_labs(self):
        self.assertTrue(self.app.secret_key)
        self.assertEqual(self.app.secret_key, create_app(self.config).secret_key)
        self.config["DATABASE"] = str(Path(self.folder.name) / "independent.sqlite3")
        self.assertNotEqual(self.app.secret_key, create_app(self.config).secret_key)
