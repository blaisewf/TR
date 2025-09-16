import matplotlib
matplotlib.use('TkAgg')
from matplotlib import pyplot as plt
import numpy as np
import csv,json
from tqdm import tqdm
from scripts.constants import FILE, MODELS

resolution = 2

def quadrats(res, points):
    cuboids = np.zeros(res**3)

    for point in points:
        cuboids[int((np.ceil(point[0]*res/255)-1)+(np.ceil(point[1]*res/255)-1)*res+(np.ceil(point[2]*res/255)-1)*res**2)]+=1

    cuboids-=np.ones_like(cuboids)*(len(points)/len(cuboids))

    cuboids = np.abs(cuboids)

    if sum(cuboids) != 0:
        return sum(cuboids)/len(points)
    else:
        return 1*10**(-16)

with open('../data/' + FILE,'r') as r:
    data = np.array(list(csv.reader(r))[1:])

rounds = [json.JSONDecoder().decode(r) for r in data[:,5]]

mistakes = {model:[] for model in MODELS}
total = {model:[] for model in MODELS}
for g in rounds:
    for r in g:
        if not r['correct'] and r['level'] > 6:
            mistakes[r['color_model']].append([r['base_color'],r['changed_color']])
        total[r['color_model']].append([r['base_color'],r['changed_color']])

mistakes = {model:(np.array(data)[:,0]+np.array(data)[:,1])/2 for model,data in mistakes.items()}
total = {model:(np.array(data)[:,0]+np.array(data)[:,1])/2 for model,data in total.items()}

fig,ax = plt.subplots()

x = np.arange(1,255)
for model in MODELS:
    y = [abs(quadrats(r,mistakes[model])/quadrats(r,total[model])) for r in tqdm(x)]
    print(f'{model}: {sum(y)}')
    plt.plot(x,y,label=model)

plt.legend()
plt.savefig('../plots/'+'quadrat_analysis.png', dpi=300, bbox_inches='tight')
plt.show()
