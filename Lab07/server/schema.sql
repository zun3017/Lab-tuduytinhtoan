CREATE TABLE IF NOT EXISTS lab_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);

CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY, role TEXT NOT NULL CHECK(role IN ('admin','tutor','student')),
    login TEXT COLLATE NOCASE UNIQUE NOT NULL, phone TEXT UNIQUE, name TEXT NOT NULL,
    password_hash TEXT NOT NULL, recovery_hash TEXT, auth_version INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','locked')),
    theme TEXT NOT NULL DEFAULT '', deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS centers (
    id INTEGER PRIMARY KEY, code TEXT COLLATE NOCASE UNIQUE NOT NULL, name TEXT NOT NULL,
    contact TEXT NOT NULL DEFAULT '', deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS tutors (
    id INTEGER PRIMARY KEY REFERENCES accounts ON DELETE CASCADE,
    center_id INTEGER REFERENCES centers ON DELETE SET NULL,
    account_type TEXT NOT NULL DEFAULT 'trial', registered_date TEXT NOT NULL DEFAULT CURRENT_DATE,
    next_billing_date TEXT, custom_fee INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS classes (
    id INTEGER PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE,
    center_id INTEGER REFERENCES centers ON DELETE SET NULL, name TEXT NOT NULL, deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY REFERENCES accounts ON DELETE CASCADE,
    tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE,
    class_id INTEGER REFERENCES classes ON DELETE SET NULL,
    parent_name TEXT NOT NULL DEFAULT '', tuition INTEGER NOT NULL DEFAULT 0,
    homework_code TEXT NOT NULL COLLATE NOCASE UNIQUE, announcement TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students ON DELETE CASCADE,
    tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE, date TEXT NOT NULL,
    week TEXT NOT NULL DEFAULT '', subject TEXT NOT NULL DEFAULT '', content TEXT NOT NULL DEFAULT '',
    evaluation TEXT NOT NULL DEFAULT '', homework_status TEXT NOT NULL DEFAULT '',
    start_score REAL, exam_score REAL, status TEXT NOT NULL DEFAULT 'Đã học',
    amount INTEGER NOT NULL DEFAULT 0, paid INTEGER NOT NULL DEFAULT 0 CHECK(paid IN (0,1)), deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE,
    student_id INTEGER REFERENCES students ON DELETE CASCADE, weekday INTEGER CHECK(weekday BETWEEN 1 AND 7),
    date TEXT, start_time TEXT NOT NULL, end_time TEXT NOT NULL, subject TEXT NOT NULL DEFAULT '',
    color TEXT NOT NULL DEFAULT '#2563eb', note TEXT NOT NULL DEFAULT '', deleted_at TEXT,
    CHECK (date IS NOT NULL OR weekday IS NOT NULL)
);
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students ON DELETE CASCADE, title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '', release_date TEXT NOT NULL DEFAULT CURRENT_DATE, due_date TEXT, deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS submissions (
    id INTEGER PRIMARY KEY, assignment_id INTEGER NOT NULL REFERENCES assignments ON DELETE CASCADE,
    student_id INTEGER NOT NULL REFERENCES students ON DELETE CASCADE, content TEXT NOT NULL DEFAULT '',
    submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, score REAL CHECK(score BETWEEN 0 AND 10),
    comment TEXT NOT NULL DEFAULT '', graded_at TEXT, deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES students ON DELETE CASCADE,
    tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE, content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY, tutor_id INTEGER NOT NULL REFERENCES tutors ON DELETE CASCADE,
    date TEXT NOT NULL DEFAULT CURRENT_DATE, amount INTEGER NOT NULL, note TEXT NOT NULL DEFAULT '',
    previous_date TEXT, next_date TEXT NOT NULL, previous_type TEXT NOT NULL, previous_status TEXT NOT NULL,
    deleted_at TEXT
);
CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY, assignment_id INTEGER REFERENCES assignments ON DELETE CASCADE,
    submission_id INTEGER REFERENCES submissions ON DELETE CASCADE, avatar_id INTEGER UNIQUE REFERENCES accounts ON DELETE CASCADE,
    name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, content BLOB NOT NULL,
    CHECK ((assignment_id IS NOT NULL)+(submission_id IS NOT NULL)+(avatar_id IS NOT NULL) = 1)
);
CREATE INDEX IF NOT EXISTS idx_students_tutor ON students(tutor_id);
CREATE INDEX IF NOT EXISTS idx_lessons_student_date ON lessons(student_id,date);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_files_submission ON files(submission_id);
CREATE INDEX IF NOT EXISTS idx_files_assignment ON files(assignment_id);

CREATE VIEW IF NOT EXISTS student_profiles AS
SELECT a.id,a.name,a.login,a.phone,a.status,a.deleted_at,s.tutor_id,s.class_id,s.parent_name,s.tuition,s.homework_code,s.announcement
FROM accounts a JOIN students s ON s.id=a.id;
CREATE VIEW IF NOT EXISTS tutor_profiles AS
SELECT a.id,a.name,a.login,a.phone,a.status,a.theme,a.deleted_at,t.center_id,t.registered_date,t.next_billing_date,t.account_type,t.custom_fee,
    (SELECT '/api/files/' || f.id FROM files f WHERE f.avatar_id=a.id) AS avatar_url
FROM accounts a JOIN tutors t ON t.id=a.id;

