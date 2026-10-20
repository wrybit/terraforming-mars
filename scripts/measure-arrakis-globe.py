#!/usr/bin/env python3
# Misst das Gelände der Arrakis-Karte (assets/themes/dune/source/arrakis-globe.png) unter jedem Feld beider Bretter und
# schreibt scripts/data/arrakis-globe-terrain.json.
#
# Warum: Felsen, Eis, Spice-Flecken und Becken der Brettfelder sollen zur gezeichneten Karte passen. Die Karte ist die
# Quelle; scripts/make-arrakis-terrain.ts (61) und scripts/make-arrakis-91.ts (91) lesen nur diese Messwerte.
# Neue Karte → dieses Skript, dann beide Generatoren laufen lassen. Braucht numpy, scipy und Pillow:
#   pip3 install numpy scipy pillow && python3 scripts/measure-arrakis-globe.py
import json
import os
import sys

import numpy as np
from PIL import Image
from scipy import ndimage

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SOURCE = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'assets/themes/dune/source/arrakis-globe.png')
TARGET = sys.argv[2] if len(sys.argv) > 2 else os.path.join(ROOT, 'scripts/data/arrakis-globe-terrain.json')

# Feldraster wie arrakisCoordinates.ts (erstes Feld 6/34, 49 px nach rechts, 41 px je Zeile, 46 × 51 je Feld).
# planet: Durchmesser des Planeten auf dem Brett; offset: Lage des Rasters zum Planeten (auf dem Brett gemessen,
# board.less verschiebt das große Brett um 1,5/15 px)
BOARDS = {
    '61': {'rows': [5, 6, 7, 8, 9, 8, 7, 6, 5], 'planet': 449, 'offset': (0, -1)},
    '91': {'rows': [6, 7, 8, 9, 10, 11, 10, 9, 8, 7, 6], 'planet': 549, 'offset': (0.5, 10)},
}
SPACE_WIDTH, SPACE_HEIGHT = 46, 51

image = np.asarray(Image.open(SOURCE).convert('RGB')).astype(float)
size = image.shape[0]
luminance = image @ [0.299, 0.587, 0.114]
brightest = image.max(axis=2)
saturation = (brightest - image.min(axis=2)) / np.maximum(brightest, 1)
rows, columns = np.mgrid[0:size, 0:size]
radius = np.hypot(columns - size / 2, rows - size / 2) / (size / 2)

# Fels: das Gebirge hat starkes Relief, der Sand nicht – Feinstruktur im Verhältnis zur Helligkeit, damit der
# Kugelschatten am Rand nicht als Fels gilt
detail = np.abs(luminance - ndimage.gaussian_filter(luminance, 2.5))
texture = ndimage.gaussian_filter(detail, 8) / np.maximum(ndimage.gaussian_filter(luminance, 8), 20)
rock = ndimage.binary_opening((texture > 0.08) & (radius < 0.95), iterations=3)


def without_small(mask, minimum):
    labels, count = ndimage.label(mask)
    sizes = ndimage.sum(mask, labels, range(1, count + 1))
    return np.isin(labels, [index + 1 for index in range(count) if sizes[index] > minimum])


# Eis: heller als die Umgebung und kaum farbig; der Lichtschein oben am Rand ist kein Eis
ice = (saturation < 0.45) & (luminance / np.maximum(ndimage.gaussian_filter(luminance, 40), 1) > 1.0) & (radius < 0.97)
ice = ndimage.binary_closing(ndimage.binary_opening(ice, iterations=2), iterations=4) & (rows > size * 0.15)
ice = without_small(ice, 1500)

# Spice: Flecken, deutlich röter als der Sand der Umgebung, nicht im Gebirge und nicht im Randschatten
redness = (image[..., 0] - image[..., 1]) / np.maximum(image[..., 0], 1)
spice = (redness - ndimage.gaussian_filter(redness, 60) > 0.05) & (saturation > 0.6)
spice = ndimage.binary_opening(spice & ~ndimage.binary_dilation(rock, iterations=8) & (radius < 0.88), iterations=3)

# Becken: offene Flächen, die das Gebirge umschließt (Hagga- und Imperialbecken)
closed = ndimage.binary_closing(rock, iterations=30)
basin = without_small(ndimage.binary_fill_holes(closed) & ~closed, 8000)

MASKS = {'rock': rock, 'ice': ice, 'spice': spice, 'basin': basin}
result = {}
for board, grid in BOARDS.items():
    middle = len(grid['rows']) // 2
    scale = size / grid['planet']
    spaces = {}
    number = 3
    for row, length in enumerate(grid['rows']):
        for column in range(length):
            x = 6 + abs(row - middle) * 24.5 + column * 49 + grid['offset'][0] + SPACE_WIDTH / 2
            y = 34 + row * 41 + grid['offset'][1] + SPACE_HEIGHT / 2
            dx = np.abs(columns - x * scale) / scale
            dy = np.abs(rows - y * scale) / scale
            hexagon = (dx <= SPACE_WIDTH / 2) & (dy <= SPACE_HEIGHT / 2 - dx * SPACE_HEIGHT / 2 / SPACE_WIDTH)
            spaces[str(number).zfill(2)] = {
                'u': round(x / grid['planet'], 4), 'v': round(y / grid['planet'], 4),
                **{name: round(float(mask[hexagon].mean()), 3) for name, mask in MASKS.items()},
            }
            number += 1
    result[board] = spaces

os.makedirs(os.path.dirname(TARGET), exist_ok=True)
with open(TARGET, 'w') as file:
    json.dump(result, file, indent=1)
print('wrote', TARGET, {board: len(spaces) for board, spaces in result.items()})
