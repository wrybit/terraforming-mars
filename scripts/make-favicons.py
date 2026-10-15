#!/usr/bin/env python3
# Builds the favicons the admin can choose as tab icon (settings FAVICON_ICON and FAVICON_COLOR,
# ServeAsset.ts): every icon in every color as assets/favicon/<icon>-<color>.png, 64 px.
#
# Icons and colors come from src/common/admin/favicons.json – the same list the admin page and the
# server read, so both sides always know the same files. Two ways to color an icon:
#   turn – for colored pictures (the Mars photo): every hue is turned by the same angle, so the
#          surface keeps its light and dark areas
#   tint – for white or grey pictures (tiles, tags, acrylic figures): the color is laid over the
#          brightness, dark lines stay dark
# withoutShadow drops the half transparent floor shadow of the acrylic figures: at 16 px it only
# makes the figure smaller.
# The first icon in the first color is the original favicon, copied unchanged.
#
# Change or add an icon or color: edit the JSON, run
#   python3 scripts/make-favicons.py
# and commit the changed PNG files. Never edit the PNG files by hand.
import colorsys
import json
import math
import os
from PIL import Image

LIST = 'src/common/admin/favicons.json'
TARGET = 'assets/favicon'
SIZE = 64


def pixels(image):
    # Pillow 12 renamed getdata; older versions only know the old name
    return list(image.get_flattened_data() if hasattr(image, 'get_flattened_data') else image.getdata())


def square(path, without_shadow):
    # Cut away the empty border, centre on a square and scale to the favicon size
    image = Image.open(path).convert('RGBA')
    if without_shadow:
        image.putalpha(image.getchannel('A').point(lambda alpha: alpha if alpha >= 128 else 0))
    image = image.crop(image.getbbox())
    side = max(image.size)
    canvas = Image.new('RGBA', (side, side))
    canvas.paste(image, ((side - image.width) // 2, (side - image.height) // 2))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def mean_hue(image):
    # Mean of the hues weighted by saturation (on the circle, so 350° and 10° average to 0°, not 180°)
    x = y = 0.0
    for red, green, blue, alpha in pixels(image):
        if alpha > 200:
            hue, saturation, _ = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
            x += math.cos(2 * math.pi * hue) * saturation
            y += math.sin(2 * math.pi * hue) * saturation
    return (math.atan2(y, x) / (2 * math.pi)) % 1


def recolor(image, mode, color):
    target_hue = color['hue'] / 360
    shift = target_hue - mean_hue(image)
    result = []
    for red, green, blue, alpha in pixels(image):
        hue, saturation, value = colorsys.rgb_to_hsv(red / 255, green / 255, blue / 255)
        if mode == 'turn':
            hue = (hue + shift) % 1
            saturation = min(1, saturation * color['saturation'])
        else:
            # Bright areas get a little less color than mid tones, so white keeps a highlight
            hue = target_hue
            saturation = min(1, 0.95 * (1 - value * 0.3) * color['saturation'])
            value *= 0.9
        value = min(1, value * color['brightness'])
        red, green, blue = colorsys.hsv_to_rgb(hue, saturation, value)
        result.append((round(red * 255), round(green * 255), round(blue * 255), alpha))
    recolored = Image.new('RGBA', image.size)
    recolored.putdata(result)
    return recolored


def main():
    with open(LIST, encoding='utf-8') as file:
        favicons = json.load(file)
    os.makedirs(TARGET, exist_ok=True)
    original = (favicons['icons'][0]['id'], favicons['colors'][0]['id'])
    for icon in favicons['icons']:
        base = square(icon['source'], icon.get('withoutShadow', False))
        for color in favicons['colors']:
            image = base if (icon['id'], color['id']) == original else recolor(base, icon['mode'], color)
            image.save(os.path.join(TARGET, f"{icon['id']}-{color['id']}.png"), optimize=True)
        print(icon['id'])


main()
