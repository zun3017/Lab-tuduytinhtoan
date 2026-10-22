s = list((input("Nhap toa do ban dau cua vua: ")))
t = list((input("Nhap toa do vua muon den: ")))
word = {'a' : 1, 'b' : 2, 'c' : 3, 'd' : 4, 'e' : 5, 'f' : 6, 'g' : 7, 'h': 8 }
x1, y1 = word[s[0]], int(s[1])
x2, y2 = word[t[0]], int(t[1])
# So nuoc di cua cot ngang va doc
dx = x2 - x1
dy = y2 - y1

# So nuoc di toi thieu la so nuoc cao nhat cua cot ngang va doc
n = max(abs(dx), abs(dy))
print(n)

while x1 != x2 or y1 != y2:
    move = ""
    # Xac dinh huong doc (U hoac D)
    if y1 < y2:
        move += "U"
        y1 += 1
    elif y1 > y2:
        move += "D"
        y1 -= 1
    # Xac dinh huong ngang (R hoac L)
    if x1 < x2:
        move += "R"
        x1 += 1
    elif x1 > x2:
        move += "L"
        x1 -= 1
        
    print(move)