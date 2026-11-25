"""Account-scoped activity and goals for the dashboard overview."""
from datetime import date, datetime, timedelta, timezone


VIETNAM_TIME = timezone(timedelta(hours=7))


def local_now():
    return datetime.now(VIETNAM_TIME)


def initialize(db):
    db.execute('''CREATE TABLE IF NOT EXISTS dashboard_visits (
        account_id TEXT NOT NULL, local_day TEXT NOT NULL,
        PRIMARY KEY(account_id, local_day))''')
    db.execute('''CREATE TABLE IF NOT EXISTS cooked_meals (
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        day INTEGER NOT NULL, slot INTEGER NOT NULL, local_day TEXT NOT NULL,
        PRIMARY KEY(plan_id, day, slot))''')
    db.execute('''CREATE TABLE IF NOT EXISTS skipped_meals (
        plan_id TEXT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
        day INTEGER NOT NULL, slot INTEGER NOT NULL,
        PRIMARY KEY(plan_id, day, slot))''')
    db.execute('''CREATE TABLE IF NOT EXISTS dashboard_goals (
        account_id TEXT PRIMARY KEY NOT NULL,
        metric TEXT NOT NULL CHECK(metric IN ('cooked', 'purchases')),
        target INTEGER NOT NULL CHECK(target BETWEEN 1 AND 28))''')
    if 'recorded_at' not in {row[1] for row in db.execute('PRAGMA table_info(purchases)')}:
        db.execute('ALTER TABLE purchases ADD COLUMN recorded_at INTEGER')
    if 'calendar_start' not in {row[1] for row in db.execute('PRAGMA table_info(plans)')}:
        db.execute('ALTER TABLE plans ADD COLUMN calendar_start TEXT')
        db.execute("""UPDATE plans SET calendar_start=date(?, '-' || (day-1) || ' days')
            WHERE active=1 AND completed_at IS NULL""", (local_now().date().isoformat(),))


def sync_plan_day(db, plan, settings):
    if plan['completed_at'] is not None:
        return
    now = local_now()
    if plan['calendar_start'] is None:
        start = datetime.fromtimestamp(plan['created_at'], VIETNAM_TIME).date()
        plan['calendar_start'] = start.isoformat()
        db.execute('UPDATE plans SET calendar_start=? WHERE id=?', (plan['calendar_start'], plan['id']))
    else:
        start = date.fromisoformat(plan['calendar_start'])
    elapsed = (now.date() - start).days
    day = min(plan['days'], max(plan['day'], elapsed + 1))
    if day == plan['day'] and elapsed < plan['days']:
        return
    if elapsed >= plan['days']:
        end = datetime.combine(start + timedelta(days=plan['days']), datetime.min.time(), VIETNAM_TIME)
        plan['completed_at'] = int(end.timestamp())
    plan['day'] = day
    db.execute('UPDATE plans SET day=?,completed_at=? WHERE id=?', (day, plan['completed_at'], plan['id']))
    db.execute('UPDATE account_settings SET version=version+1,read_notifications=0 WHERE account_id=?',
               (plan['account_id'],))
    settings['version'] += 1
    settings['read_notifications'] = 0


def streak(days, today, allow_yesterday=False):
    days = set(days)
    expected = today
    if allow_yesterday and today.isoformat() not in days:
        expected -= timedelta(days=1)
    count = 0
    while expected.isoformat() in days:
        count += 1
        expected -= timedelta(days=1)
    return count


def activity(db, account, plan_id, day):
    now = local_now()
    today = now.date()
    monday = (now - timedelta(days=now.weekday())).replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6)
    monday_key = monday.date().isoformat()
    today_key = today.isoformat()
    visits = db.execute('SELECT local_day FROM dashboard_visits WHERE account_id=? AND local_day<=?',
                        (account, today_key))
    cooking = db.execute('''SELECT c.plan_id,c.day,c.slot,c.local_day FROM cooked_meals c
        JOIN plans p ON p.id=c.plan_id WHERE p.account_id=? AND c.local_day<=?''',
                         (account, today_key)).fetchall()
    purchases = db.execute('''SELECT COUNT(*) FROM purchases r
        JOIN plans p ON p.id=r.plan_id WHERE p.account_id=? AND r.recorded_at>=? AND r.recorded_at<=?''',
                           (account, int(monday.timestamp()), int(now.timestamp()))).fetchone()[0]
    goal = db.execute('SELECT target FROM dashboard_goals WHERE account_id=?', (account,)).fetchone()
    progress = {'cooked': sum(row['local_day'] >= monday_key for row in cooking), 'purchases': purchases}
    return {
        'calendarRefreshInMs': int(((now + timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0) - now).total_seconds() * 1000),
        'accessStreak': streak((row[0] for row in visits), today),
        'cookingStreak': streak((row['local_day'] for row in cooking), today, allow_yesterday=True),
        'cookedSlots': sorted(row['slot'] for row in cooking if row['plan_id'] == plan_id and row['day'] == day),
        'skippedSlots': [row['slot'] for row in db.execute(
            'SELECT slot FROM skipped_meals WHERE plan_id=? AND day=? ORDER BY slot', (plan_id, day))],
        'week': {'start': monday_key, 'end': sunday.date().isoformat()},
        'progress': progress,
        'goal': {'metric': 'cooked', 'target': goal['target']} if goal else None,
    }


def record_meal(db, state, payload, *, cooked):
    day, slot = payload.get('day'), payload.get('slot')
    if (not state['hasPlan'] or state['completed'] or payload.get('planId') != state['planId']
            or type(day) is not int or day != state['day']):
        raise ValueError('Chỉ ghi nhận bữa trong ngày hiện tại của kế hoạch.')
    meals = state['dailyMenus'][str(day)]
    if type(slot) is not int or not 0 <= slot < len(meals) or not meals[slot]:
        raise ValueError('Bữa này chưa có món để ghi nhận.')
    key = (state['planId'], day, slot)
    other = 'skipped_meals' if cooked else 'cooked_meals'
    if db.execute(f'SELECT 1 FROM {other} WHERE plan_id=? AND day=? AND slot=?', key).fetchone():
        raise ValueError('Bữa này đã được ghi nhận.')
    if cooked:
        db.execute('INSERT OR IGNORE INTO cooked_meals (plan_id,day,slot,local_day) VALUES (?,?,?,?)',
                   (*key, local_now().date().isoformat()))
    else:
        db.execute('INSERT OR IGNORE INTO skipped_meals (plan_id,day,slot) VALUES (?,?,?)', key)


def save_goal(db, account, payload):
    target = payload.get('target')
    if type(target) is not int or not 1 <= target <= 28:
        raise ValueError('Số bữa tự nấu mỗi tuần phải từ 1 đến 28.')
    db.execute('''INSERT INTO dashboard_goals (account_id,metric,target) VALUES (?,'cooked',?)
        ON CONFLICT(account_id) DO UPDATE SET metric=excluded.metric,target=excluded.target''',
               (account, target))
