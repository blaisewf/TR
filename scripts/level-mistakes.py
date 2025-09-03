import matplotlib.pyplot as plt
import numpy as np
import csv,json

with open('Data.csv','r') as r:
    data = np.array(list(csv.reader(r))[1:])

levels = [int(l) for l in data[:,4]]
rounds = [json.JSONDecoder().decode(r) for r in data[:,5]]

mistakes = []
for g in rounds:
    for r in g:
        if not r['correct']:
            mistakes.append(int(r['level']))

fig,ax = plt.subplots()
ax.set(xlabel='level',ylabel='mistakes')

x = list(range(1,max(mistakes)+1))
y = [mistakes.count(n) for n in x]

plt.bar(x,y)

plt.show()