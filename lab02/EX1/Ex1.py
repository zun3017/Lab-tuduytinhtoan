from math import ceil
print("Nhap 3 so n, m, a lien tiep")
n, m, a = map(int, input().split())
sl = ceil(n / a) + ceil(m / a)
print("So luong gach can thiet de lat:", sl)
 
