import numpy as np
import csv, json
from scipy.spatial import cKDTree
from scipy.stats import ecdf
from constants import FILE, MODELS


models = ["RGB", "CIELAB", "JzAzBz", "Oklab"]

res = 255

with open("../data/" + FILE, "r") as r:
    data = np.array(list(csv.reader(r))[1:])

rounds = [json.JSONDecoder().decode(r) for r in data[:, 5]]

mistakes = {c: [] for c in models}
total = {c: [] for c in models}
for g in rounds:
    for r in g:
        if not r["correct"] and int(r["level"]) > 6:
            mistakes[r["color_model"]].append([r["base_color"], r["changed_color"]])
        total[r["color_model"]].append([r["base_color"], r["changed_color"]])

mistakes = {i: (np.array(j)[:, 0] + np.array(j)[:, 1]) / 2 for i, j in mistakes.items()}
total = {i: (np.array(j)[:, 0] + np.array(j)[:, 1]) / 2 for i, j in total.items()}


def F(points, distr):
    tree = cKDTree(points)

    grid = np.indices((res + 1, res + 1, res + 1)).reshape(3, -1).transpose()

    f = tree.query(grid)[0]

    cdf = ecdf(f)
    return np.array(
        [(cdf.cdf.evaluate(n) if cdf.cdf.evaluate(n) < 1 else 1 - 1e-10) for n in distr]
    )


def G(points, distr):
    tree = cKDTree(points)

    f = tree.query(points, k=2)[0][:, 1]

    cdf = ecdf(f)
    return np.array([cdf.cdf.evaluate(n) for n in distr])


def J(points, distr):
    g = G(points, distr)
    f = F(points, distr)

    return np.abs(f - g)


distr = np.arange(1, 65)

for model in MODELS:
    print(f"{model}: {1 - sum(J(mistakes[model],distr))/sum(J(total[model],distr))}")
