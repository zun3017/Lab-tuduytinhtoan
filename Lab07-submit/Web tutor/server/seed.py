"""An invented school, generated once inside the initial database transaction."""
from datetime import date, timedelta

from werkzeug.security import generate_password_hash


def seed_demo(db):
    today = date.today()

    def day(offset):
        return (today + timedelta(days=offset)).isoformat()

    def account(role, login, phone, name, password):
        return db.execute(
            "INSERT INTO accounts(role,login,phone,name,password_hash) VALUES(?,?,?,?,?)",
            (role, login, phone, name, generate_password_hash(password)),
        ).lastrowid

    first = account("tutor", "GS0701", "0000700001", "Lâm Nhật Quỳnh", "741963")
    second = account("tutor", "GS0702", "0000700002", "Vũ Hạ Đan", "684219")
    account("admin", "QT0701", "0000709001", "Đỗ Nguyên Khôi", "963852")
    center = db.execute(
        "INSERT INTO centers(code,name,contact) VALUES(?,?,?)",
        ("TRAM07", "Trạm Tri Thức", "Quầy tiếp nhận Lab07"),
    ).lastrowid
    db.executemany(
        "INSERT INTO tutors(id,center_id,account_type,registered_date,next_billing_date) VALUES(?,?,?,?,?)",
        [(first, center, "standard", day(-63), day(27)), (second, center, "trial", day(-7), day(23))],
    )
    math = db.execute("INSERT INTO classes(tutor_id,center_id,name) VALUES(?,?,?)",
                      (first, center, "Toán · Quỹ đạo xanh")).lastrowid
    science = db.execute("INSERT INTO classes(tutor_id,center_id,name) VALUES(?,?,?)",
                         (second, center, "Khoa học · Mầm pha lê")).lastrowid
    students = []
    for i, (name, parent, group, tutor, code, tuition) in enumerate([
        ("Phạm Hải Miên", "Phạm Lưu An", math, first, "BT-SAO-07", 140000),
        ("Mai Khánh Tường", "Mai Hà Vân", math, first, "BT-QUE-07", 125000),
        ("Hồ Ngọc Lam", "Hồ Duy Nam", science, second, "BT-LAM-07", 160000),
    ], 1):
        sid = account("student", f"HS070{i}", f"000070100{i}", name, ["258147","369258","486291"][i-1])
        students.append(sid)
        db.execute("INSERT INTO students VALUES(?,?,?,?,?,?,?)",
                   (sid, tutor, group, parent, tuition, code, "Mang sổ ghi chép đến buổi học tới."))
        for n, offset in enumerate([-17, -10, -3]):
            db.execute("""
                INSERT INTO lessons(student_id,tutor_id,date,week,subject,content,evaluation,homework_status,
                                   start_score,exam_score,status,amount,paid)
                VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)""",
                (sid,tutor,day(offset),str(n+1), "Toán" if group==math else "Khoa học",
                 ["Đọc biểu đồ thời tiết", "Ước lượng từ dữ liệu", "Trình bày lập luận"][n],
                 ["Cần ghi rõ đơn vị", "So sánh được hai cách giải", "Trình bày tiến bộ"][n],
                 ["Đã làm", "Hoàn thành", "Hoàn thành"][n],6.5+n,8 if n==2 else None,
                 "Đã học",tuition,int(n==0)))
        db.execute("""
            INSERT INTO schedules(tutor_id,student_id,weekday,start_time,end_time,subject,note)
            VALUES(?,?,?,?,?,?,?)""", (tutor,sid,[2,4,6][i-1],"17:30","19:00",
                                       "Toán" if group==math else "Khoa học", "Ôn và sửa bài cuối buổi"))
    for index, (title, description) in enumerate([
        ("Đường đi của giọt mưa", "Dựng biểu đồ từ số đo lượng mưa trong năm ngày."),
        ("Một tuần quan sát mây", "Viết lời giải thích cho sự thay đổi theo ngày."),
        ("Góc đọc biểu đồ", "Tìm trung vị và so sánh hai nhóm quan sát."),
    ]):
        aid = db.execute("""INSERT INTO assignments(tutor_id,student_id,title,description,release_date,due_date)
                            VALUES(?,?,?,?,?,?)""", (first,students[0],title,description,day(-1-7*index),day(6-7*index))).lastrowid
        data = (description+"\nDữ liệu tự tạo (mm): 4, 7, 5, 9, 6.\n").encode()
        db.execute("INSERT INTO files(assignment_id,name,mime,size,content) VALUES(?,?,?,?,?)",
                   (aid,f"du-lieu-{index+1}.txt","text/plain",len(data),data))
        if index:
            graded = index == 2
            sub = db.execute("""INSERT INTO submissions(assignment_id,student_id,content,submitted_at,score,comment,graded_at)
                                VALUES(?,?,?,?,?,?,?)""", (aid,students[0],"Em gửi bảng tính và nhận xét.",day(-7*index),
                                8.5 if graded else None, "Đặt tiêu đề trục rất rõ. Bổ sung đơn vị nhé." if graded else "",
                                day(-7*index+1) if graded else None)).lastrowid
            data = "Kết quả quan sát: trung vị là 6 mm.\n".encode()
            db.execute("INSERT INTO files(submission_id,name,mime,size,content) VALUES(?,?,?,?,?)",
                       (sub,"nhan-xet.txt","text/plain",len(data),data))
    db.execute("INSERT INTO assignments(tutor_id,student_id,title,description,release_date,due_date) VALUES(?,?,?,?,?,?)",
               (second,students[2],"Quan sát tinh thể muối","Ghi lại hình dạng tinh thể trong hai mẫu.",day(-2),day(4)))
    db.execute("INSERT INTO feedback(student_id,tutor_id,content) VALUES(?,?,?)",
               (students[0],first,"Em muốn luyện thêm cách ghi chú trục tung."))
    db.executemany("INSERT INTO settings(key,value) VALUES(?,?)",
                   [("marquee","Chào mừng đến với tuần học khám phá ở Trạm Tri Thức."),
                    ("contact","Quầy hỗ trợ hư cấu · Trạm Tri Thức · Lab07")])

