import numpy as np
import csv, json
from scipy.spatial import ConvexHull, Voronoi
from constants import FILE, MODELS


with open('../data/' + FILE,'r') as r:
    data = np.array(list(csv.reader(r))[1:])

rounds = [json.JSONDecoder().decode(r) for r in data[:,5]]

mistakes = {c:[] for c in MODELS}
total = {c:[] for c in MODELS}
for g in rounds:
    for r in g:
        if not r['correct'] and int(r['level']) > 6:
            mistakes[r['color_model']].append([r['base_color'],r['changed_color']])
        total[r['color_model']].append([r['base_color'],r['changed_color']])

mistakes = {i:(np.array(j)[:,0]+np.array(j)[:,1])/2 for i,j in mistakes.items()}
total = {i:(np.array(j)[:,0]+np.array(j)[:,1])/2 for i,j in total.items()}


def voronoi_volumes(points):
    voronoi = Voronoi(points)

    volumes = []
    for r in voronoi.regions:
        if r == -1 or -1 in r:
            continue
        vertices = np.array(voronoi.vertices[r])

        if len(vertices) == 0 or np.any(vertices<0) or np.any(vertices>255):
            continue
        volumes.append(ConvexHull(vertices).volume)

    return np.array(volumes)

def Uniformity(points):
    volumes = np.cbrt(voronoi_volumes(points))

    dev = abs(volumes-np.mean(volumes))

    return np.sum(dev)


for model in MODELS:
    print(f'{model}: {Uniformity(mistakes[model])/Uniformity(total[model])}')