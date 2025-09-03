import matplotlib.pyplot as plt
import numpy as np
import csv

with open('Data.csv','r') as r:
    data = np.array(list(csv.reader(r))[1:])

levels = [int(l) for l in data[:,4]]

fig,ax = plt.subplots()
ax.set(xlabel='level',ylabel='games')

x = list(range(0,max(levels)+1))
y = [levels.count(n) for n in x]

plt.bar(x,y)

plt.show()