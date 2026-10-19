# Erzeugt den Rahmen der leeren Spicefelder im Dune-Theme (assets/themes/dune/graphics/hex-spice.png) aus dem blauen
# Ozean-Rahmen von Mars (assets/hex_blue.png): gleiche Form, hellem Spice-Orange und kräftiger – auf Arrakis kommen
# dorthin keine Ozeane, sondern Spice-Ernter.
# Aufruf: python3 scripts/make-spice-hex.py
from PIL import Image

SOURCE = 'assets/hex_blue.png'
TARGET = 'assets/themes/dune/graphics/hex-spice.png'
SPICE = (255, 168, 72)
# The blue frame is half transparent; on the orange planet the spice frame needs more cover to stand out
ALPHA_BOOST = 1.8

image = Image.open(SOURCE).convert('RGBA')
pixels = image.load()
for x in range(image.size[0]):
    for y in range(image.size[1]):
        alpha = pixels[x, y][3]
        if alpha > 0:
            pixels[x, y] = (*SPICE, min(255, round(alpha * ALPHA_BOOST)))
image.save(TARGET, optimize=True)
print('wrote', TARGET)
