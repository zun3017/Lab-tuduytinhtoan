import os
path = "EX5.txt"
if (os.path.isfile(path)):
    f = open(path, "r") # Mo file ra 
    lines = f.read().splitlines() # Doc file va dua vao danh sach tung dong
    count = 0 # Dem so luong byte
    name = [] # Them va xoa thanh vien
    for line in lines:
        if line[0] == '+': # Them thanh vien
            name.append(line[1:])
        elif line[0] == '-': # Xoa thanh vien
            name.remove(line[1:])
        else:
            part = line.split(':') # Doc tin nhan
            mess = str(part[1]) 
            count += len(name) * len(mess) # Tinh so nguoi trong nhom * so byte tin nhan 
    print(count)
else:
    print(f"file {path} khong mo duoc")
            