import os
path = "EX6.txt"
if (os.path.isfile(path)):
    f = open(path, "r")
    lines = f.read().splitlines()
    part = lines[0].split()
    n, m, color = int(part[0]), int(part[1]), part[2]
    print(n, m, color)
    room = [list(line) for line in lines[1 : n + 1]] #Tao ma tran
    find = set()
    dir = [(1, 0), (-1, 0), (0, 1), (0, -1)] # tren, duoi, phai, trai
    print(room)
    for i in range (n):
        for j in range(m):
            for di, dj in dir:
                ni = di + i
                nj = dj + i
                if 0 <= ni < n and 0 <= nj < m: # Kiem tra o dang xet co hop le
                    if room[ni][nj] != color and room[ni][nj] not in find and room[ni][nj] != '.':
                        find.add(room[ni][nj])

    print(len(find))
else:
    print(f"file {path} khong mo duoc")