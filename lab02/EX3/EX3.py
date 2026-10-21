s = list((input("Nhap toa do ban dau cua vua: ")))
t = list((input("Nhap toa do vua muon den: ")))
word = {'a' : 1, 'b' : 2, 'c' : 3, 'd' : 4, 'e' : 5, 'f' : 6, 'g' : 7, 'h': 8 }
x1, y1 = word[s[0]], int(s[1])
x2, y2 = word[t[0]], int(t[1])

# Tính số bước đi tối thiểu theo chiều ngang và dọc
dx = x2 - x1
dy = y2 - y1

# Số nước đi tối thiểu là giá trị lớn nhất giữa độ lệch hoành độ và tung độ
n = max(abs(dx), abs(dy))
print(n)

# Vòng lặp in ra từng hướng đi
while x1 != x2 or y1 != y2:
    move = ""
    # Xác định hướng dọc (U hoặc D)
    if y1 < y2:
        move += "U"
        y1 += 1
    elif y1 > y2:
        move += "D"
        y1 -= 1
        
    # Xác định hướng ngang (R hoặc L)
    if x1 < x2:
        move += "R"
        x1 += 1
    elif x1 > x2:
        move += "L"
        x1 -= 1
        
    print(move)