"""SQLite connection lifetime and the non-destructive Windows init-db command."""
from pathlib import Path
import sqlite3

import click
from flask import current_app, g

from .seed import seed_demo


def get_db():
    if "lab_db" not in g:
        connection = sqlite3.connect(current_app.config["DATABASE"], timeout=15)
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys=ON")
        g.lab_db = connection
    return g.lab_db


def init_db():
    db = get_db()
    db.executescript(Path(__file__).with_name("schema.sql").read_text(encoding="utf-8"))
    with db:
        db.execute("BEGIN IMMEDIATE")
        if db.execute("SELECT 1 FROM lab_meta WHERE key='demo_seed_1'").fetchone() is None:
            seed_demo(db)
            db.execute("INSERT INTO lab_meta(key,value) VALUES('demo_seed_1','1')")


def init_app(app):
    @app.teardown_appcontext
    def close_db(_error):
        db = g.pop("lab_db", None)
        if db is not None:
            db.close()

    @app.cli.command("init-db")
    def init_command():
        init_db()
        click.echo("SQLite ready. Existing application data preserved.")

    Path(app.config["DATABASE"]).parent.mkdir(parents=True, exist_ok=True)
    with app.app_context():
        init_db()

