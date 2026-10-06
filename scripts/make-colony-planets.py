#!/usr/bin/env python3
# Builds the round planet pictures of the colony tiles (assets/colonies-planets-round/<name>.webp)
# from the original photos in assets/colonies-planets.
#
# Each photo is cropped to a square around the planet disc, padded with black where the disc
# reaches past the photo edge, scaled to at most SIZE pixels and saved as WebP. The app then
# shows the picture as is in a round frame (colonyView.ts) – no positioning in CSS any more.
# The originals stay untouched: upstream still uses them for its own colony tiles (colonies.less).
#
# Change a crop: adjust FIT (e.g. with the planet-fit tool), run
#   python3 scripts/make-colony-planets.py
# and commit the changed WebP files. Never edit the WebP files by hand.
import os
from PIL import Image

SOURCE = 'assets/colonies-planets'
TARGET = 'assets/colonies-planets-round'
# 80 px frame on screen, 3x for sharp phone displays
SIZE = 240
# Crop 3 % inside the disc so no dark photo edge shows in the round frame
EDGE = 0.97
QUALITY = 82

# Disc in the photo: centre x/y and diameter as shares of the photo width/height.
# Missing = the whole photo (centred square).
FIT = {
    'callisto.png': (0.502, 0.498, 0.870, 0.870),
    'enceladus.png': (0.490, 0.497, 0.860, 0.860),
    'europa.png': (0.500, 0.500, 0.791, 0.791),
    'ceres.png': (0.518, 0.488, 0.892, 0.975),
    'deimos.jpg': (0.427, 0.535, 0.721, 0.760),
    'ganymede.jpg': (0.515, 0.487, 0.984, 0.984),
    'io.jpg': (0.618, 0.463, 0.887, 0.887),
    'kuiper.jpg': (0.634, 0.521, 0.760, 1.013),
    'leavitt.jpg': (0.503, 0.521, 1.111, 1.686),
    'pallas.jpg': (0.500, 0.500, 0.983, 0.983),
    'luna.jpg': (0.518, 0.503, 0.830, 0.864),
    'mercury.jpg': (0.502, 0.501, 0.903, 0.932),
    'miranda.jpg': (0.514, 0.515, 0.868, 0.834),
    'pluto.jpg': (0.499, 0.489, 0.860, 0.860),
    'terra.jpg': (0.497, 0.503, 0.971, 0.966),
    'titan.jpg': (0.517, 0.489, 0.797, 0.857),
    'triton.jpg': (0.500, 0.506, 0.951, 0.951),
    'venus.jpg': (0.510, 0.498, 0.870, 0.870),
    'hygiea.jpg': (0.498, 0.514, 0.918, 0.872),
    'iapetus.jpg': (0.500, 0.500, 0.613, 0.817),
    'titania.jpg': (0.505, 0.498, 0.615, 0.819),
}


def build(file_name):
    image = Image.open(os.path.join(SOURCE, file_name)).convert('RGBA')
    width, height = image.size
    centre_x, centre_y, diameter_width, _ = FIT.get(file_name, (0.5, 0.5, min(width, height) / width, 0))
    side = diameter_width * width * EDGE
    left = centre_x * width - side / 2
    top = centre_y * height - side / 2
    # Black canvas first: discs reaching past the photo edge get space instead of a stretched picture
    canvas = Image.new('RGBA', (round(side), round(side)), (0, 0, 0, 255))
    canvas.alpha_composite(image, (round(-left), round(-top)))
    out_size = min(SIZE, round(side))
    canvas = canvas.convert('RGB').resize((out_size, out_size), Image.LANCZOS)
    name = os.path.splitext(file_name)[0] + '.webp'
    canvas.save(os.path.join(TARGET, name), 'WEBP', quality=QUALITY, method=6)
    return name, out_size


if __name__ == '__main__':
    os.makedirs(TARGET, exist_ok=True)
    for file_name in sorted(os.listdir(SOURCE)):
        name, size = build(file_name)
        print(f'{name}  {size} px  {os.path.getsize(os.path.join(TARGET, name)) // 1024} KB')
