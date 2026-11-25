import secrets
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlsplit

from dotenv import dotenv_values
from flask import Flask, jsonify, request
from werkzeug.exceptions import HTTPException

from . import db
from . import demo


ROOT = Path(__file__).resolve().parent.parent


def create_app(config=None):
    app = Flask(__name__, static_folder=str(ROOT / "public"), static_url_path="")
    app.config.from_mapping(
        DATABASE=str(ROOT / "instance" / "lab07.sqlite3"),
        GOOGLE_TRANSLATE_API_KEY=dotenv_values(ROOT / ".env", encoding="utf-8-sig",
                                              interpolate=False).get("GOOGLE_TRANSLATE_API_KEY") or "",
        MAX_CONTENT_LENGTH=45 * 1024 * 1024,
        SESSION_COOKIE_NAME="lab07_session",
        SESSION_COOKIE_HTTPONLY=True,
        SESSION_COOKIE_SAMESITE="Lax",
        PERMANENT_SESSION_LIFETIME=timedelta(hours=8),
        TRUSTED_HOSTS=["localhost", "127.0.0.1", "[::1]"],
    )
    if config:
        app.config.update(config)

    Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)
    db.init_app(app)
    with app.app_context():
        connection = db.get_db()
        connection.executescript((ROOT / "server" / "translation.sql").read_text(encoding="utf-8"))
        with connection:
            demo.init_schema(connection)
            connection.execute("CREATE TABLE IF NOT EXISTS lab_secrets (name TEXT PRIMARY KEY, value TEXT NOT NULL)")
            connection.execute("INSERT OR IGNORE INTO lab_secrets VALUES ('session', ?)", (secrets.token_hex(32),))
            app.secret_key = connection.execute("SELECT value FROM lab_secrets WHERE name='session'").fetchone()[0]

    from .domain import bp as domain
    from .translation import bp as translation
    app.register_blueprint(domain)
    app.register_blueprint(translation)
    app.register_blueprint(demo.bp)

    @app.get("/")
    def homepage():
        return app.send_static_file("index.html")

    @app.before_request
    def check_origin():
        if request.method not in {"GET", "HEAD", "OPTIONS"}:
            origin = request.headers.get("Origin")
            if origin and (urlsplit(origin).netloc != request.host or urlsplit(origin).scheme != request.scheme):
                return jsonify(error="Yêu cầu phải đến từ trang Lab07."), 403
            if request.headers.get("Sec-Fetch-Site") == "cross-site":
                return jsonify(error="Yêu cầu phải đến từ trang Lab07."), 403

    @app.after_request
    def response_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers.setdefault("Content-Security-Policy", "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; "
            "frame-src 'self' blob:; object-src 'none'; form-action 'self'; base-uri 'self'; frame-ancestors 'self'")
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "private, no-store"
        return response

    @app.errorhandler(HTTPException)
    def http_error(error):
        if request.path.startswith("/api/"):
            return jsonify(error=error.name), error.code
        return error

    return app
