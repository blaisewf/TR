"""
import matplotlib
matplotlib.use('TkAgg') #open plot viewer
import matplotlib.pyplot as plt
import numpy as np
import csv, json
import colour.models
from tqdm import tqdm
from scipy.spatial import cKDTree

import sys, os

now_dir = os.getcwd()
sys.path.append(now_dir)
from scripts.constants import FILE, MODELS


with open('data/' + FILE,'r') as r:
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

def F(points, location, r):
    pass

#fig,ax = plt.subplots()
#plt.legend()
#plt.show()
"""
