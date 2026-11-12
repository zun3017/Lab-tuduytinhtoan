import os
path = "EX8.txt"
if (os.path.isfile(path)):
    f = open(path, "r")
    line = f.read().strip()
    part = []
    for c in line:
        part.append(c)
    coordinate = [(0, 0)]
    for go in part:
        x, y = coordinate[-1]
        if go == 'U':
            x += 1
        elif go == 'D':
            x -= 1
        elif go == 'R':
            y += 1
        elif go == 'L':
            y -= 1
        coordinate.append((x,y))
    dir = [(1, 0), (-1, 0), (0, 1), (0, -1)] # tren, duoi, phai, trai
    flag = True
    for i in coordinate:
        if coordinate.count(i) >= 2:
            flag = False
            break
        neighborhood = 0
        for x, y in dir:
            nx, ny = i
            if coordinate[coordinate.index(i):].count((x + nx, y + ny)) == 1:
                neighborhood += 1
            print(neighborhood)
            if neighborhood >= 2:
                flag = False
                break
    if(flag):
        print("OK")
    else:
        print("BUG")
else:
    print(f"file {path} khong mo duoc")