import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit


PUBLIC = Path(__file__).resolve().parents[1] / "public"
PAGES = ("homework", "student-login", "student-dashboard", "tutor-login",
         "tutor-dashboard", "tutor-calendar", "demo-calendar", "admin-dashboard", "preview-invoice")


class AssetReferences(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []

    def handle_starttag(self, tag, attrs):
        for key, value in attrs:
            if key in ("src", "href", "action") and value:
                self.references.append(value)


class PortalAssets(unittest.TestCase):
    def test_all_role_pages_have_local_resources_and_no_legacy_backend(self):
        for page in PAGES:
            with self.subTest(page=page):
                source = (PUBLIC / (page + ".html")).read_text(encoding="utf-8")
                refs = AssetReferences()
                refs.feed(source)
                for url in refs.references:
                    self.assertFalse(urlsplit(url).netloc, url)
                self.assertNotRegex(source.lower(), r"google\.script\.run|supabase|drive\.google\.com")

    def test_worker_never_registers_api_responses_for_caching(self):
        worker = (PUBLIC / "sw.js").read_text(encoding="utf-8")
        self.assertIn("zuntutor-lab07", worker)
        self.assertIn("/api/", worker)
        self.assertIn("GET", worker)
