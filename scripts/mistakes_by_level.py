import matplotlib.pyplot as plt
import numpy as np
import csv,json
from constants import FILE

with open('../data/' + FILE,'r') as r:
    data = np.array(list(csv.reader(r))[1:])

rounds = [json.JSONDecoder().decode(r) for r in data[:,5]]

mistakes = []
for g in rounds:
    for r in g:
        if not r['correct']:
            mistakes.append(r['level'])

fig,ax = plt.subplots()
ax.set(xlabel='level',ylabel='mistakes')

x = np.arange(1,max(mistakes)+1)
y = [mistakes.count(n) for n in x]

plt.bar(x,y)

plt.savefig('../plots/'+'mistakes_by_level.png', dpi=300, bbox_inches='tight')
plt.show()