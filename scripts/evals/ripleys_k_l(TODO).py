import matplotlib
matplotlib.use('TkAgg') #open plot viewer
import matplotlib.pyplot as plt
import numpy as np
import csv, json
from tqdm import tqdm
from scipy.integrate import nquad
import sys, os

now_dir = os.getcwd()
sys.path.append(now_dir)

from scripts.constants import MODELS, FILE

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

#edge correction
def cap(a, t):
    r = np.sqrt(t**2 - a**2)
    h = t-a

    return (np.pi*h)*(3*r**2+h**2)/6

def wedge(a, b, t):
    h = np.sqrt(t**2 - b**2)

    def f(u, v):
        if t**2 - u**2 - v**2 < 0:
            print(t,a,b,v,u)
        return np.sqrt(t**2 - u**2 - v**2) - b

    return nquad(f,[lambda v: [-np.sqrt(t**2 - v**2 - b**2),np.sqrt(t**2 - v**2 - b**2)],[a,h]])[0]

def semi_wedge(a, b, c, t):
    h = np.sqrt(t**2 - b**2)

    def f(v, u):
        if t**2 - u**2 - v**2 < 0:
            return 0
        return np.sqrt(t**2 - v**2 - u**2) - b

    return nquad(f,[lambda v: [-np.sqrt(t**2 - v**2 - b**2),c],[a,h]])[0]


def c_i(t, pos): #cap correction
    out = 0

    if pos[0]+t > 255:
        out+=cap(255-pos[0],t)
    if pos[0]-t < 0:
        out+=cap(pos[0],t)

    if pos[1]+t > 255:
        out+=cap(255-pos[1],t)
    if pos[1]-t < 0:
        out+=cap(pos[1],t)

    if pos[2]+t > 255:
        out+=cap(255-pos[2],t)
    if pos[2]-t < 0:
        out+=cap(pos[2],t)

    return out

def w_i(t, pos):
    out = 0

    if (255-pos[0])**2 + (255-pos[1])**2 < t**2:
        out+=wedge(255-pos[0],255-pos[1],t)
    if (255-pos[0])**2 + pos[1]**2 < t**2:
        out+=wedge(255-pos[0],pos[1],t)
    if (255-pos[0])**2 + (255-pos[2])**2 < t**2:
        out+=wedge(255-pos[0],255-pos[2],t)
    if (255-pos[0])**2 + pos[2]**2 < t**2:
        out+=wedge(255-pos[0],pos[2],t)

    if pos[0]**2 + (255-pos[1])**2 < t**2:
        out+=wedge(pos[0],255-pos[1],t)
    if pos[0]**2 + pos[1]**2 < t**2:
        out+=wedge(pos[0],pos[1],t)
    if pos[0]**2 + (255-pos[2])**2 < t**2:
        out+=wedge(pos[0],255-pos[2],t)
    if pos[0]**2 + pos[2]**2 < t**2:
        out+=wedge(pos[0],pos[2],t)

    if (255-pos[1])**2 + (255-pos[2])**2 < t**2:
        out+=wedge(255-pos[1],255-pos[2],t)
    if (255-pos[1])**2 + pos[2]**2 < t**2:
        out+=wedge(255-pos[1],pos[2],t)

    if pos[1]**2 + (255-pos[2])**2 < t**2:
        out+=wedge(pos[1],255-pos[2],t)
    if pos[1]**2 + pos[2]**2 < t**2:
        out+=wedge(pos[1],pos[2],t)

    return out

def s_i(t, pos):
    out = 0

    if (255-pos[0])**2 + (255-pos[1])**2 + (255-pos[2])**2 < t**2:
        out+=semi_wedge(255-pos[0],255-pos[1],255-pos[2],t)
    if (255-pos[0])**2 + (255-pos[1])**2 + pos[2]**2 < t**2:
        out+=semi_wedge(255-pos[0],255-pos[1],pos[2],t)
    if (255-pos[0])**2 + pos[1]**2 + (255-pos[2])**2 < t**2:
        out+=semi_wedge(255-pos[0],pos[1],255-pos[2],t)
    if (255-pos[0])**2 + pos[1]**2 + pos[2]**2 < t**2:
        out+=semi_wedge(255-pos[0],pos[1],pos[2],t)

    if pos[0]**2 + (255-pos[1])**2 + (255-pos[2])**2 < t**2:
        out+=semi_wedge(pos[0],255-pos[1],255-pos[2],t)
    if pos[0]**2 + (255-pos[1])**2 + pos[2]**2 < t**2:
        out+=semi_wedge(pos[0],255-pos[1],pos[2],t)
    if pos[0]**2 + pos[1]**2 + (255-pos[2])**2 < t**2:
        out+=semi_wedge(pos[0],pos[1],255-pos[2],t)
    if pos[0]**2 + pos[1]**2 + pos[2]**2 < t**2:
        out+=semi_wedge(pos[0],pos[1],pos[2],t)

    return out

def e_i(t, pos):
    return 1-(c_i(t, pos)-w_i(t, pos)+s_i(t, pos))/(4*np.pi*t**3/3)

#calculation
def dist(p1, p2):
    return np.sqrt((p1[0]-p2[0])**2 + (p1[1]-p2[1])**2 + (p1[2]-p2[2])**2)

def I(bool):
    if bool: return 1
    else: return 0

def K(t, points):
    n = len(points)

    k = 0
    for i in points:
        k+=(sum([I(dist(i,j)<=t) for j in points])-1)/e_i(t, i)

    return k*255**3/n**2

def L(t, points):
    return abs(t-np.cbrt(3*K(t, points)/(4*np.pi)))

fig, ax = plt.subplots()

ax.set(xlabel='t',ylabel='K(t)')

distr = [2*n+1 for n in range(75)]

values = []

for model in MODELS:
    k=[L(t, mistakes[model]) for t in tqdm(distr)]
    values.append([model,k])
    plt.plot(distr,k,label=model)

print(values)

for m in values:
    print(f'{m[0]}: {sum(m[1])}')

plt.plot(distr,[0 for t in distr],label='expected')

plt.legend()
plt.savefig('../../plots/'+'ripleys_k_l.png', dpi=300, bbox_inches='tight')
plt.show()
