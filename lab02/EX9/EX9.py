import math
import os

path = "EX9.txt"

if os.path.isfile(path):
    f = open(path, "r")
    lines = f.read().splitlines()
    part = lines[0].split()     # Dong 1: n (so tram), vb (van toc bus), vs (van toc chay bo)
    n, vb, vs = int(part[0]), float(part[1]), float(part[2])
    x = [float(val) for val in lines[1].split()]     # Dong 2: toa do x cua n tram dung
    coord = lines[2].split() # Dong 3: Toa do truong hoc (xu, yu)
    xu, yu = float(coord[0]), float(coord[1])
    best_stop = -1
    min_time = 10000
    min_dist = 10000
    # Sinh vien chi co the xuong tu tram thu 2 tro di ( tu 2 den n)
    for i in range(1, n):
        dist = math.hypot(xu - x[i], yu) # Khoang cach chay tu tram (x[i], 0) den truong (xu, yu)
        total_time = (x[i] / vb) + (dist / vs)  # Tong thoi gian: di xe buyt + chay bo
        if total_time < min_time: # Uu tien thoi gian nho nhat; neu thoi gian bang nhau thi chon tram gan truong hon
            min_time = total_time
            min_dist = dist
            best_stop = i + 1
        elif abs(total_time - min_time) == 0:
            if dist < min_dist:
                min_dist = dist
                best_stop = i + 1
    print(best_stop)
else:
    print(f"File {path} khong mo duoc")