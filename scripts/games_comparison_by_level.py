import matplotlib.pyplot as plt
import numpy as np
import csv
from constants import FILE

with open("data/" + FILE, "r") as r:
    data = np.array(list(csv.reader(r))[1:])

levels = [int(l) for l in data[:, 4]]
levels2 = [levels[l] for l in range(len(levels)) if data[:, 7][l] == "true"]

fig, ax = plt.subplots()
ax.set(xlabel="level", ylabel="games")

x = list(range(0, max(levels) + 1))
y = [levels.count(n) for n in x]
y = [sum(y[n:]) for n in x]

x2 = list(range(0, max(levels2) + 1))
y2 = [levels2.count(n) for n in x2]
y2 = [sum(y2[n:]) * y[0] / sum(y2) for n in x2]

plt.bar(x, y, color="blue")
plt.bar(x2, y2, color="red")

plt.savefig("plots/games_comparison_by_level.png", dpi=300, bbox_inches="tight")
plt.close()
