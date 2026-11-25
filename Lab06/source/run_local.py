"""Chạy hai trang Lab06 bằng Python và SQLite."""
import argparse
import json
import math
import mimetypes
import sqlite3
from contextlib import closing
from collections import defaultdict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit

from backend import overview

ROOT = Path(__file__).resolve().parent
DATABASE = ROOT / 'backend/data/catalog.sqlite3'
PROFILE = 'demo'


def catalog(db):
    dishes = {row['id']: dict(row, recipeIngredients=[]) for row in db.execute(
        'SELECT id,name,cost,image,description AS desc,recipe FROM dishes ORDER BY id')}
    for row in db.execute('SELECT dish_id,name,quantity,unit FROM recipe_ingredients ORDER BY dish_id,position'):
        item = dict(row)
        dishes[item.pop('dish_id')]['recipeIngredients'].append(item)
    return list(dishes.values())


def snapshot(db):
    plan = dict(db.execute('SELECT * FROM plans WHERE account_id=? AND active=1', (PROFILE,)).fetchone())
    settings = dict(db.execute('SELECT * FROM account_settings WHERE account_id=?', (PROFILE,)).fetchone())
    overview.sync_plan_day(db, plan, settings)
    day, plan_id = plan['day'], plan['id']
    completed = plan['completed_at'] is not None
    setup = json.loads(plan['setup_json'])
    counts = setup.get('dayMealCounts', {})
    meals = [[] for _ in range(counts.get(str(day), plan['meals']))]
    for row in db.execute('SELECT slot,dish_id FROM plan_meals WHERE plan_id=? AND day=? ORDER BY slot,position', (plan_id, day)):
        if row['slot'] < len(meals):
            meals[row['slot']].append(row['dish_id'])
    receipts = [dict(row) for row in db.execute('SELECT day,coverage_end,planned,actual FROM purchases WHERE plan_id=? ORDER BY day', (plan_id,))]
    spent = sum(row['actual'] for row in receipts)
    receipt = next((row for row in receipts if row['day'] <= day <= (row['coverage_end'] or row['day'])), None)
    fridge = [dict(row) for row in db.execute('''SELECT i.name,l.quantity,i.unit,l.expiry FROM inventory_lots l
        JOIN ingredients i ON i.id=l.ingredient_id WHERE l.account_id=? AND l.expiry>=? ORDER BY l.expiry,i.name''',
        (PROFILE, day))]
    first = (day - 1) // 3 * 3 + 1
    last = min(plan['days'], first + 2)
    left = 0 if completed else plan['days'] - day + 1
    remaining = plan['budget'] - spent
    before = plan['budget'] - sum(row['actual'] for row in receipts if row['day'] < first)
    cycle_budget = before * (last - first + 1) // (plan['days'] - first + 1)
    cycle_remaining = cycle_budget - sum(row['actual'] for row in receipts if first <= row['day'] <= last)
    spending = dict(start=first, end=last, actual=None, planned=None)
    if receipt:
        spending.update(start=receipt['day'], end=receipt['coverage_end'] or receipt['day'],
                        planned=receipt['planned'], actual=receipt['actual'])
    elif not completed:
        spending['planned'] = projected_purchase(db, plan_id, day, last)
    return dict(hasPlan=True, planId=plan_id, day=day, days=plan['days'], completed=completed,
                version=settings['version'], dailyMenus={str(day): meals}, budget=plan['budget'],
                confirmed=day in json.loads(plan['confirmed_days_json']), checkedOut=receipt is not None,
                setupProfile=setup.get('setupProfile'), fridge=fridge, spending=spending,
                summary=dict(remaining=remaining, spent=spent, daysLeft=left, allowance=remaining//left if left else 0,
                             cycleStart=first, cycleBudget=cycle_budget, cycleRemaining=cycle_remaining),
                overview=overview.activity(db, PROFILE, plan_id, day))


def projected_purchase(db, plan_id, first, last):
    needs = db.execute('''SELECT m.day,r.ingredient_id,SUM(r.stock_quantity) AS need,i.pack,i.price,i.price_known
        FROM plan_meals m JOIN recipe_ingredients r ON r.dish_id=m.dish_id
        JOIN ingredients i ON i.id=r.ingredient_id
        WHERE m.plan_id=? AND m.day BETWEEN ? AND ?
        GROUP BY m.day,r.ingredient_id ORDER BY m.day DESC''', (plan_id, first, last)).fetchall()
    lots = defaultdict(list)
    for row in db.execute('SELECT ingredient_id,quantity,expiry FROM inventory_lots WHERE account_id=? AND expiry>=? ORDER BY expiry',
                          (PROFILE, first)):
        lots[row['ingredient_id']].append([row['quantity'], row['expiry']])
    missing = defaultdict(float)
    prices = {}
    for row in needs:
        if not row['price_known']:
            return None
        ingredient = row['ingredient_id']
        need = row['need']
        for lot in lots[ingredient]:
            if lot[1] >= row['day']:
                used = min(need, lot[0])
                need -= used
                lot[0] -= used
        missing[ingredient] += need
        prices[ingredient] = row['pack'], row['price']
    return sum(math.ceil(max(0, need - 1e-9) / prices[key][0]) * prices[key][1] for key, need in missing.items())


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, mime):
        self.send_response(status)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(body)

    def json(self, status, payload):
        self.send(status, json.dumps(payload, ensure_ascii=False).encode(), 'application/json; charset=utf-8')

    def dispatch(self):
        host = self.headers.get('Host')
        port = self.server.server_port
        if host not in (f'127.0.0.1:{port}', f'localhost:{port}'):
            return self.json(403, {'error': 'Chỉ dùng địa chỉ cục bộ.'})
        route = unquote(urlsplit(self.path).path)
        if route.startswith('/api/'):
            return self.api(route, host)
        if self.command != 'GET':
            return self.json(405, {'error': 'Phương thức không phù hợp.'})
        path = (ROOT / (route.lstrip('/') or 'tong-quan.html')).resolve()
        allowed = path.parent == ROOT and path.name in ('tong-quan.html', 'kham-pha-mon-an.html')
        allowed |= any(path.is_relative_to(ROOT / folder) for folder in ('assets', 'css', 'js'))
        if not allowed or not path.is_file():
            return self.json(404, {'error': 'Không tìm thấy trang hoặc tài nguyên.'})
        self.send(200, path.read_bytes(), mimetypes.guess_type(path.name)[0] or 'application/octet-stream')

    def api(self, route, host):
        if self.command == 'POST':
            if self.headers.get('Origin') != f'http://{host}' or self.headers.get('X-Bep-Request') != '1':
                return self.json(403, {'error': 'Yêu cầu ghi dữ liệu không hợp lệ.'})
        try:
            with closing(sqlite3.connect(DATABASE)) as db, db:
                db.row_factory = sqlite3.Row
                db.execute('PRAGMA foreign_keys=ON')
                if route == '/api/public/dishes' and self.command == 'GET':
                    data = catalog(db)
                elif route == '/api/state' and self.command == 'GET':
                    db.execute('BEGIN IMMEDIATE')
                    data = snapshot(db)
                elif route == '/api/dashboard-visit' and self.command == 'POST':
                    self.read_payload()
                    db.execute('INSERT OR IGNORE INTO dashboard_visits VALUES (?,?)',
                               (PROFILE, overview.local_now().date().isoformat()))
                    data = snapshot(db)['overview']
                elif route == '/api/commands' and self.command == 'POST':
                    command = self.read_payload()
                    db.execute('BEGIN IMMEDIATE')
                    state = snapshot(db)
                    if command.get('version') != state['version']:
                        return self.json(409, {'error': 'Dữ liệu đã thay đổi. Hãy thử lại.'})
                    action, payload = command.get('action'), command.get('payload')
                    if not isinstance(payload, dict):
                        raise ValueError('Dữ liệu ghi nhận không hợp lệ.')
                    if action == 'save_overview_goal':
                        overview.save_goal(db, PROFILE, payload)
                    elif action in ('record_cooked_meal', 'skip_cooked_meal'):
                        overview.record_meal(db, state, payload, cooked=action == 'record_cooked_meal')
                    else:
                        raise ValueError('Thao tác không được hỗ trợ.')
                    db.execute('UPDATE account_settings SET version=version+1 WHERE account_id=?', (PROFILE,))
                    data = snapshot(db)
                else:
                    return self.json(404, {'error': 'Không tìm thấy API.'})
            return self.json(200, {'data': data})
        except (ValueError, UnicodeError) as error:
            return self.json(422, {'error': str(error)})
        except sqlite3.Error:
            return self.json(500, {'error': 'Không đọc hoặc ghi được cơ sở dữ liệu SQLite.'})

    def read_payload(self):
        size = int(self.headers.get('Content-Length', '0'))
        if not 0 < size <= 4096:
            raise ValueError('Kích thước yêu cầu không hợp lệ.')
        payload = json.loads(self.rfile.read(size))
        if not isinstance(payload, dict):
            raise ValueError('Dữ liệu gửi lên phải là một đối tượng.')
        return payload

    do_GET = dispatch
    do_POST = dispatch


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=8001)
    args = parser.parse_args()
    with ThreadingHTTPServer(('127.0.0.1', args.port), Handler) as server:
        print(f'Bep Sinh Vien Lab06: http://127.0.0.1:{server.server_port}', flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
