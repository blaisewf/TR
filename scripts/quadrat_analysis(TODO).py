import numpy as np
import csv,json
from scripts.constants import FILE, MODELS

resolution = 4

def quadrats(res, points):
    cuboids = np.zeros(res**3)

    for point in points:
        print(point)
        print(((point[0]*res)//255),((point[1]*res)//255)*res,((point[2]*res)//255)*res**2)
        cuboids[int(((point[0]*res)//255)+((point[1]*res)//255)*res+((point[2]*res)//255)*res**2)]+=1

    return cuboids

with open('data/'+FILE,'r') as r:
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

print(quadrats(resolution, mistakes['RGB']))


#fig,ax = plt.subplots()
#plt.savefig('plots/mistakes_by_level.png', dpi=300, bbox_inches='tight')
#plt.close()