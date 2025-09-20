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

levels = [int(l) for l in data[:, 4]]

fig, ax = plt.subplots()
ax.set(xlabel="level", ylabel="games")

x = list(range(0, max(levels) + 1))
y = [levels.count(n) for n in x]

plt.bar(x, y)

plt.savefig("plots/" + "games_by_level.png", dpi=300, bbox_inches="tight")

matplotlib.use("pgf")
matplotlib.rcParams.update({
    "pgf.texsystem": "pdflatex",
    'font.family': 'serif',
    'text.usetex': True,
    'pgf.rcfonts': False,
})

plt.savefig("plots/tex/" + "games_by_level.pgf", dpi=300, bbox_inches="tight")

plt.show()
