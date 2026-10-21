import os
path = "EX2.txt"
if (os.path.isfile(path)): #kiem tra mo file
    f = open(path, "r") # doc file
    lines = f.read().splitlines() # dua cac dong vao danh sach
    n = int(lines[0])
    round = []
    final_score = {}
    for line in lines[1: n + 1]:
        part = line.split() #dua tung phan tu vao danh sach
        name, score = part[0], int(part[1])
        round.append((name, score))
        final_score[name] = final_score.get(name, 0) + score 
    max_score = max(final_score.values())
    winner = None
    current_score = {}
    for name, score in round:
        current_score[name] = current_score.get(name, 0) + score
        if current_score[name] == max_score and final_score[name] == max_score:
            winner = name
            break
    print(winner)
else:
    print(f"file {path} khong mo duoc")