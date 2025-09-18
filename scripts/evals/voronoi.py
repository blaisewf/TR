import pandas as pd
import numpy as np
from scipy.spatial import Voronoi, ConvexHull
import json
import sys, os

now_dir = os.getcwd()
sys.path.append(now_dir)

from scripts.constants import MODELS, FILE

def process_data():
    try:
        df = pd.read_csv('data/' + FILE)
    except Exception as e:
        print(f"Error: {e}")
        return None
    error_points = {m: [] for m in MODELS}
    for _, row in df.iterrows():
        try:
            for r in json.loads(row['rounds']):
                if not r.get('correct', True):
                    m = r.get('color_model')
                    b, c = np.array(r.get('base_color', [])), np.array(r.get('changed_color', []))
                    if m in error_points and b.size == 3 and c.size == 3:
                        error_points[m].append((b + c) / 2)
        except:
            continue
    return {m: np.array(p) for m, p in error_points.items()}

def analyze_voronoi_uniformity(points, name=""):
    if points.shape[0] < 4:
        return None
    try:
        vor = Voronoi(points)
    except:
        return None
    volumes = []
    for ri in vor.point_region:
        if -1 not in vor.regions[ri] and vor.regions[ri]:
            try:
                volumes.append(ConvexHull(vor.vertices[vor.regions[ri]]).volume)
            except:
                pass
    if not volumes:
        return None
    volumes = np.array(volumes)
    return {
        "model": name,
        "std_deviation": np.std(volumes),
        "mean_volume": np.mean(volumes),
        "cells_analyzed": len(volumes)
    }


data = process_data()
if data:
  results = []
  for m, p in data.items():
            r = analyze_voronoi_uniformity(p, m)
            if r:
                results.append(r)
  if results:
            results = sorted(results, key=lambda x: x['std_deviation'])
            for r in results:
                print(f"{r['model']}: {r['std_deviation']:.2f}")