import numpy as np
import csv, json
from tqdm import tqdm
from scipy.spatial import cKDTree
import torch
import torchquad
from constants import FILE, MODELS


torchquad.set_log_level('WARNING')

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
torch.set_default_device(device)
if torch.cuda.is_available():
    torch.set_default_dtype(torch.float32)

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

#edge correction
def cap(a, t):
    r = np.sqrt(t**2 - a**2)
    h = t-a

    return (np.pi*h)*(3*r**2+h**2)/6

def wedge(a, b, t):
    h = np.sqrt(t**2 - b**2)

    def f(x):
        u = x[:, 0]
        v = x[:, 1]

        t_ = t if isinstance(t, torch.Tensor) else torch.tensor(t, device=x.device)
        b_ = b if isinstance(b, torch.Tensor) else torch.tensor(b, device=x.device)

        operand = t_ ** 2 - u ** 2 - v ** 2
        return torch.sqrt(torch.clamp(operand, min=0.0)) - b_

    integrator = torchquad.Simpson()
    i = float(integrator.integrate(f,dim=2,N=999999,integration_domain=[[-np.sqrt(t**2 - b**2),np.sqrt(t**2 - b**2)],[a,h]]))
    return i

def semi_wedge(a, b, c, t):
    h = np.sqrt(t**2 - b**2)

    def f(x):
        u = x[:, 0]
        v = x[:, 1]

        t_ = t if isinstance(t, torch.Tensor) else torch.tensor(t, device=x.device)
        b_ = b if isinstance(b, torch.Tensor) else torch.tensor(b, device=x.device)

        operand = t_ ** 2 - u ** 2 - v ** 2
        return torch.sqrt(torch.clamp(operand, min=0.0)) - b_

    integrator = torchquad.Simpson()
    i = float(integrator.integrate(f,dim=2,N=999999,integration_domain=[[-np.sqrt(t**2 - b**2),c],[a,h]]))
    return i


def c_i(t, pos):
    out = 0.0
    faces = [
        255-pos[0],
        pos[0],
        255-pos[1],
        pos[1],
        255-pos[2],
        pos[2]
    ]
    for a in faces:
        if a < t:
            out += cap(a, t)
    return out

def w_i(t, pos):
    out = 0.0
    edges = [
        ((255-pos[0]), (255-pos[1])),
        ((255-pos[0]), pos[1]),
        ((255-pos[0]), (255-pos[2])),
        ((255-pos[0]), pos[2]),
        (pos[0], (255-pos[1])),
        (pos[0], pos[1]),
        (pos[0], (255-pos[2])),
        (pos[0], pos[2]),
        ((255-pos[1]), (255-pos[2])),
        ((255-pos[1]), pos[2]),
        (pos[1], (255-pos[2])),
        (pos[1], pos[2]),
    ]
    for a,b in edges:
        if a*a + b*b < t*t:
            out += wedge(a, b, t)
    return out

def s_i(t, pos):
    out = 0.0
    corners = [
        (255-pos[0], 255-pos[1], 255-pos[2]),
        (255-pos[0], 255-pos[1], pos[2]),
        (255-pos[0], pos[1], 255-pos[2]),
        (255-pos[0], pos[1], pos[2]),
        (pos[0], 255-pos[1], 255-pos[2]),
        (pos[0], 255-pos[1], pos[2]),
        (pos[0], pos[1], 255-pos[2]),
        (pos[0], pos[1], pos[2]),
    ]
    for a,b,c in corners:
        if a*a + b*b + c*c < t*t:
            out += semi_wedge(a, b, c, t)
    return out

def e_i(t, pos):
    c=c_i(t,pos)
    w=w_i(t,pos)
    s=s_i(t,pos)
    return 1-(c-w+s)/(4*np.pi*t**3/3)

#calculation
def K(t, points, tree):
    n = len(points)

    k = 0
    for i in points:
        dist = tree.query(i, k=len(points), distance_upper_bound=t)[0]
        k+=(np.sum(np.isfinite(dist))-1)/e_i(t, i)

    return k*255**3/n**2

def L(t, points, tree):
    return abs(t-np.cbrt(3*K(t, points, tree)/(4*np.pi)))


def Uniformity(points, range):
        tree = cKDTree(points)
        l=[L(t, points, tree) for t in tqdm(range)]
        return sum(l)

distr = np.arange(5,65)
for model in MODELS:
    print(f'{model}: {abs(1-Uniformity(mistakes[model],distr)/Uniformity(total[model],distr))}')