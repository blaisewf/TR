import matplotlib.pyplot as plt
import matplotlib
import numpy as np
import csv
from constants import FILE
import sys, os

now_dir = os.getcwd()
sys.path.append(now_dir)

with open("data/" + FILE, "r") as r:
    data = np.array(list(csv.reader(r))[1:])

levels = []
levels_vc = []
for row in data:
    if row[7] == "true":
        levels_vc.append(int(row[4]))
    else:
        levels.append(int(row[4]))

fig, ax = plt.subplots()
ax.set(xlabel="level", ylabel="games")

x = np.arange(max(levels) + 1)
y = [levels.count(n) for n in x]
y = [sum(y[n:]) for n in x]

x2 = np.arange(max(levels) + 1)
y2 = [levels_vc.count(n) for n in x2]
y2 = [sum(y2[n:]) * y[0] / sum(y2) for n in x2]

plt.bar(x, y, color="blue", label="regular")
plt.bar(x2, y2, color="red", label="visual condition (1:27)")

plt.legend()
plt.savefig("plots/" + "games_comparison_by_levels.png", dpi=300, bbox_inches="tight")

matplotlib.use("pgf")
matplotlib.rcParams.update({
    "pgf.texsystem": "pdflatex",
    'font.family': 'serif',
    'text.usetex': True,
    'pgf.rcfonts': False,
})
plt.savefig("plots/tex/" + "games_comparison_by_levels.pgf", dpi=300, bbox_inches="tight")

plt.show()
