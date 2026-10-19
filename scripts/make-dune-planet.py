#!/usr/bin/env python3
# Builds the planet pictures of the Dune theme (assets/themes/dune/arrakis-planet*.png) from the square map
# assets/themes/dune/source/arrakis-map.jpg (planet circle inscribed in the square). Needs only Pillow.
#
# Why: the board lays its hexes over assets/board/mars-planet*.png. Arrakis takes exactly the same place, so the
# pictures have the same size and the planet circle sits where Mars sits; the hexes then line up with the map.
# Never edit the PNGs by hand – change this script and run it again: python3 scripts/make-dune-planet.py
import colorsys
import math
import os
from PIL import Image, ImageChops, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SOURCE = os.path.join(ROOT, 'assets/themes/dune/source/arrakis-map.jpg')
SUPERSAMPLE = 4

# Mars picture, the planet-only picture that gives the planet circle (its alpha box), Dune picture to write.
# The board pictures with scale rings keep their rings; only the planet is painted over.
TARGETS = [
    ('assets/board/mars-planet.png', 'assets/board/mars-planet.png', 'assets/themes/dune/arrakis-planet.png'),
    ('assets/board/mars-planet-large.png', 'assets/board/mars-planet-large.png', 'assets/themes/dune/arrakis-planet-large.png'),
    ('assets/board/mars-clean.png', 'assets/board/mars-planet.png', 'assets/themes/dune/arrakis-clean.png'),
    ('assets/board/mars-without-venus-clean.png', 'assets/board/mars-planet.png', 'assets/themes/dune/arrakis-without-venus-clean.png'),
    ('assets/board/mars-large.png', 'assets/board/mars-planet-large.png', 'assets/themes/dune/arrakis-large.png'),
    ('assets/board/mars-large-without-venus.png', 'assets/board/mars-planet-large.png', 'assets/themes/dune/arrakis-large-without-venus.png'),
]


def limb_darkening(distance: int) -> int:
    # distance 0 (centre) … 255 (rim) → brightness; the outer 45 % darken softly, so the map reads as a sphere
    relative = distance / 255
    dark = max(0.0, (relative - 0.55) / 0.45) ** 1.6
    return round(255 * (1 - 0.45 * dark))


def sphere(size: int) -> Image.Image:
    planet = Image.open(SOURCE).convert('RGB').resize((size, size), Image.LANCZOS)
    shade = Image.radial_gradient('L').resize((size, size), Image.BICUBIC).point(limb_darkening)
    planet = ImageChops.multiply(planet, Image.merge('RGB', (shade, shade, shade)))
    # Round cut-out, drawn larger and scaled down for a smooth edge
    mask = Image.new('L', (size * SUPERSAMPLE, size * SUPERSAMPLE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, size * SUPERSAMPLE - 1, size * SUPERSAMPLE - 1), fill=255)
    planet.putalpha(mask.resize((size, size), Image.LANCZOS))
    return planet


# Scale rings around the planet: oxygen (left) becomes the green vegetation scale, temperature (right) the blue water
# storage, the Venus arc on top is removed. Hue of every ring pixel is replaced, brightness and saturation stay, so the scale steps keep their look.
OXYGEN_HUE = 95 / 360
WATER_HUE = 205 / 360
# The Mars labels "O2" and "t°C" below the scale ends (Board.vue shows the Dune symbols there instead): boxes in the
# 620 × 600 pictures, scaled for the others
MARS_LABELS = [(176, 530, 205, 557), (420, 524, 455, 559)]
# The Mars ocean marker below the planet (left of the ocean count): erased, Board.vue puts the spice field tile there.
# Boxes per picture size (the large pictures have their own layout, so no scaling)
OCEAN_MARKERS = {(620, 600): (271, 541, 298, 572), (740, 680): (314, 650, 341, 681)}


def recolor_rings(picture: Image.Image, left: int, top: int, size: int) -> None:
    centre_x, centre_y, radius = left + size / 2, top + size / 2, size / 2
    pixels = picture.load()
    width, height = picture.size
    for y in range(height):
        for x in range(width):
            red, green, blue, alpha = pixels[x, y]
            if alpha == 0:
                continue
            distance = math.hypot(x - centre_x, y - centre_y)
            if distance < radius + 6 or distance > radius + 80:
                continue
            # Arrakis has no Venus: the top arc goes completely (Jens), not even faded
            if y < centre_y - radius * 0.83:
                pixels[x, y] = (0, 0, 0, 0)
                continue
            hue, lightness, saturation = colorsys.rgb_to_hls(red / 255, green / 255, blue / 255)
            # The pale ends of the Venus arc reach down next to the side rings
            # (the faded Venus arc of the pictures without Venus is semi-transparent, the side rings are opaque)
            pale = lightness > 0.6 or (saturation < 0.3 and lightness > 0.45)
            # (the white label at the top end of the oxygen ring stays)
            if y < centre_y - radius * 0.7 and (alpha < 120 or (pale and x > centre_x - radius * 0.82)):
                pixels[x, y] = (0, 0, 0, 0)
                continue
            target = OXYGEN_HUE if x < centre_x else WATER_HUE
            new_red, new_green, new_blue = colorsys.hls_to_rgb(target, lightness, max(saturation, 0.35))
            pixels[x, y] = (round(new_red * 255), round(new_green * 255), round(new_blue * 255), alpha)


def erase_labels(picture: Image.Image) -> None:
    scale_x, scale_y = picture.size[0] / 620, picture.size[1] / 600
    draw = ImageDraw.Draw(picture)
    for x0, y0, x1, y1 in MARS_LABELS:
        draw.rectangle((x0 * scale_x, y0 * scale_y, x1 * scale_x, y1 * scale_y), fill=(0, 0, 0, 0))
    marker = OCEAN_MARKERS.get(picture.size)
    if marker is not None:
        draw.rectangle(marker, fill=(0, 0, 0, 0))


for mars_path, planet_path, dune_path in TARGETS:
    mars = Image.open(os.path.join(ROOT, mars_path)).convert('RGBA')
    left, top, right, bottom = Image.open(os.path.join(ROOT, planet_path)).split()[3].getbbox()
    size = max(right - left, bottom - top)
    if mars_path != planet_path:
        canvas = mars.copy()
        recolor_rings(canvas, left, top, size)
        erase_labels(canvas)
    else:
        canvas = Image.new('RGBA', mars.size, (0, 0, 0, 0))
    canvas.alpha_composite(sphere(size), (left, top))
    canvas.save(os.path.join(ROOT, dune_path), optimize=True)
    print(dune_path, mars.size, (left, top, size))

# Small planet for the page heads (MarsHomeLink.vue) instead of assets/stats/mars.png
ICON_SIZE = 128
sphere(ICON_SIZE).save(os.path.join(ROOT, 'assets/themes/dune/arrakis-icon.png'), optimize=True)
print('assets/themes/dune/arrakis-icon.png', ICON_SIZE)
