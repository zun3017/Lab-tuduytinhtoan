"""Start ZunTutor Lab07 on loopback, or initialize a separate demo database."""
import argparse
import logging
from pathlib import Path

from server import ROOT, create_app


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["run", "init-db"], default="run", nargs="?")
    parser.add_argument("--database", type=Path, default=ROOT / "instance" / "lab07.sqlite3")
    parser.add_argument("--port", type=int, default=5000)
    args = parser.parse_args()
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    database = args.database.resolve()
    app = create_app({"DATABASE": str(database)})
    if args.command == "init-db":
        print(f"SQLite: {database}")
    else:
        app.run(host="127.0.0.1", port=args.port, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
