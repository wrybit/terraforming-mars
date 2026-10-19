#!/usr/bin/env python3
# Builds the planet pictures of the Dune theme (assets/themes/dune/arrakis-planet*.png) from the globe of the mockup
# assets/themes/dune/source/arrakis-globe.png (cut-out sphere, square; copied by scripts/sync-dune-graphics.sh).
# Needs only Pillow.
#
# Why: the board lays its hexes over assets/board/mars-planet*.png. Arrakis takes exactly the same place, so the
# pictures have the same size and the planet circle sits where Mars sits; the hexes then line up with the map.
# Never edit the PNGs by hand – change this script and run it again: python3 scripts/make-dune-planet.py
import os
from PIL import Image

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SOURCE = os.path.join(ROOT, 'assets/themes/dune/source/arrakis-globe.png')

# Mars picture, the planet-only picture that gives the planet circle (its alpha box), Dune picture to write.
TARGETS = [
    ('assets/board/mars-planet.png', 'assets/board/mars-planet.png', 'assets/themes/dune/arrakis-planet.png'),
    ('assets/board/mars-planet-large.png', 'assets/board/mars-planet-large.png', 'assets/themes/dune/arrakis-planet-large.png'),
    ('assets/board/mars-clean.png', 'assets/board/mars-planet.png', 'assets/themes/dune/arrakis-clean.png'),
    ('assets/board/mars-without-venus-clean.png', 'assets/board/mars-planet.png', 'assets/themes/dune/arrakis-without-venus-clean.png'),
    ('assets/board/mars-large.png', 'assets/board/mars-planet-large.png', 'assets/themes/dune/arrakis-large.png'),
    ('assets/board/mars-large-without-venus.png', 'assets/board/mars-planet-large.png', 'assets/themes/dune/arrakis-large-without-venus.png'),
]


def sphere(size: int) -> Image.Image:
    # The globe is already a cut-out sphere with a darker rim (drawn in the mockup); only scaled here
    return Image.open(SOURCE).convert('RGBA').resize((size, size), Image.LANCZOS)


# The board pictures of Mars carry the scale rings; Arrakis draws its scales as vectors (ArrakisScales.vue), sharp at
# every zoom. So every Dune picture is only the planet, at the place of the Mars planet.
for mars_path, planet_path, dune_path in TARGETS:
    mars = Image.open(os.path.join(ROOT, mars_path)).convert('RGBA')
    left, top, right, bottom = Image.open(os.path.join(ROOT, planet_path)).split()[3].getbbox()
    size = max(right - left, bottom - top)
    canvas = Image.new('RGBA', mars.size, (0, 0, 0, 0))
    canvas.alpha_composite(sphere(size), (left, top))
    canvas.save(os.path.join(ROOT, dune_path), optimize=True)
    print(dune_path, mars.size, (left, top, size))

# Small planet for the page heads (MarsHomeLink.vue) instead of assets/stats/mars.png
ICON_SIZE = 128
sphere(ICON_SIZE).save(os.path.join(ROOT, 'assets/themes/dune/arrakis-icon.png'), optimize=True)
print('assets/themes/dune/arrakis-icon.png', ICON_SIZE)
