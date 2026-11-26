"""Translate authenticated student portals using Google Cloud Translation Basic v2."""
import hashlib
import html
import json
from threading import Lock
from urllib.error import HTTPError, URLError
from urllib.request import HTTPRedirectHandler, Request, build_opener

from flask import Blueprint, current_app, jsonify, request
from .db import get_db

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


class TranslationError(Exception):
    def __init__(self, code, status):
        self.code = code
        self.status = status


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
    provider = "google"
    cache_prefix = "google.v2."
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
        previous = stored.get(cache_prefix + item_key)
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
    batch_size = 128
    for start in range(0, len(missing), batch_size):
        batch = missing[start:start + batch_size]
        values = google_batch([value for _, value, _ in batch], target, key)
        updates = []
        for (item_key, _, digest), value in zip(batch, values):
            result[item_key] = value
            updates.append((target, cache_prefix + item_key, digest, value))
        with db:
            db.executemany("""
                INSERT INTO homepage_translations(language, item_key, source_hash, translated_text)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(language, item_key) DO UPDATE SET
                   source_hash=excluded.source_hash, translated_text=excluded.translated_text
            """, updates)
        logger.info("%s_translation target=%s cache=miss source=%s items=%d", scope_name, target, provider, len(batch))
    return jsonify(target=target, translations=result, source=provider)



@bp.post("/api/translate/ui")
def ui_translation():
    from .domain_store import actor, require
    user = actor()
    require(user, "student", "homework")
    body = request.get_json(silent=True)
    page = body.get("page") if isinstance(body, dict) else None
    if page not in ("student-dashboard", "homework"):
        return jsonify(error="invalid_page"), 400
    if page == "student-dashboard":
        require(user, "student")
    target = body.get("target")
    if target not in ("vi", "en", "ja", "ko"):
        return jsonify(error="invalid_target"), 400
    texts = body.get("texts")
    if texts is not None:
        if (not isinstance(texts, list) or len(texts) > 500
                or any(not isinstance(text, str) or not text.strip() or len(text) > 10000 for text in texts)
                or sum(map(len, texts)) > 100000):
            return jsonify(error="invalid_texts"), 400
        catalog = {"portal." + hashlib.sha256(text.encode()).hexdigest(): text for text in texts}
    else:
        return jsonify(error="invalid_texts"), 400
    if target == "vi":
        return jsonify(target=target, translations=catalog, originals=catalog, source="original")
    try:
        with TARGET_LOCKS[target]:
            response = _translate_catalog(target, catalog, page)
            data = response.get_json()
            data["originals"] = catalog
            return jsonify(data), response.status_code
    except TranslationError as exc:
        return jsonify(error=exc.code, originals=catalog), exc.status

