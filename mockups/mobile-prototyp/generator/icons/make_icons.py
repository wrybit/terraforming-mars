"""Erzeugt fünf App-Icon-Varianten (512 px, maskable) aus den echten Spiel-Assets.

Ausgabe: icons/idea-<n>.png und eine Übersicht icons/overview.png.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance

ASSETS = Path('/home/claude/tm/assets')
PLANET = Path(__file__).parent.parent / 'assets-extra' / 'mars-planet.png'
OUT = Path(__file__).parent
SIZE = 512


def planet(size):
    image = Image.open(PLANET).convert('RGBA').crop((92, 85, 541, 534))
    return image.resize((size, size), Image.LANCZOS)


def asset(name, height):
    image = Image.open(ASSETS / name).convert('RGBA')
    image = image.crop(image.getbbox())
    return image.resize((round(image.width * height / image.height), height), Image.LANCZOS)


def space(dark=(8, 10, 16)):
    # Sternenhimmel aus stars.jpg, abgedunkelt, damit der Planet leuchtet
    stars = Image.open(ASSETS / 'stars.jpg').convert('RGB')
    side = min(stars.size)
    stars = stars.crop((0, 0, side, side)).resize((SIZE, SIZE), Image.LANCZOS)
    stars = ImageEnhance.Brightness(stars).enhance(0.55)
    return Image.blend(Image.new('RGB', (SIZE, SIZE), dark), stars, 0.8).convert('RGBA')


def glow(base, center, radius, color):
    layer = Image.new('RGBA', base.size, (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse((center[0] - radius, center[1] - radius, center[0] + radius, center[1] + radius), fill=color)
    return Image.alpha_composite(base, layer.filter(ImageFilter.GaussianBlur(radius // 3)))


def paste_center(base, image, center):
    base.alpha_composite(image, (round(center[0] - image.width / 2), round(center[1] - image.height / 2)))


def idea_planet():
    # 1: Freigestellter Mars im All, mit leichtem Atmosphären-Schein
    base = glow(space(), (256, 256), 210, (230, 110, 60, 120))
    paste_center(base, planet(360), (256, 256))
    return base


def idea_planet_greenery():
    # 2: Mars mit Grünfläche davor – Terraforming auf einen Blick
    base = glow(space(), (236, 236), 190, (230, 110, 60, 110))
    paste_center(base, planet(330), (236, 236))
    paste_center(base, asset('tiles/greenery.png', 190), (360, 360))
    return base


def idea_tiles():
    # 3: Die drei Plättchen Stadt, Grünfläche, Ozean als Wabe auf Rostrot
    base = Image.new('RGBA', (SIZE, SIZE), (150, 62, 30, 255))
    base = glow(base, (256, 256), 260, (214, 110, 60, 255))
    for name, center in (('tiles/ocean.png', (256, 150)), ('tiles/greenery.png', (170, 300)), ('tiles/city.png', (342, 300))):
        paste_center(base, asset(name, 175), center)
    return base


def idea_terraform_rating():
    # 4: TW-Symbol des Spiels vor dem Mars
    base = glow(space(), (256, 256), 210, (230, 110, 60, 100))
    paste_center(base, planet(380), (256, 256))
    shade = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 90))
    base = Image.alpha_composite(base, shade)
    paste_center(base, asset('resources/tr.png', 170), (256, 256))
    return base


def idea_horizon():
    # 5: Mars als Horizont unten, Ozean-Plättchen und Temperatur darüber
    base = space((6, 8, 20))
    big = planet(760)
    base = glow(base, (256, 560), 360, (230, 110, 60, 140))
    paste_center(base, big, (256, 700))
    paste_center(base, asset('tiles/ocean.png', 170), (206, 220))
    paste_center(base, asset('global-parameters/temperature.png', 190), (338, 200))
    return base


IDEAS = [idea_planet, idea_planet_greenery, idea_tiles, idea_terraform_rating, idea_horizon]


def rounded(image, radius=112):
    mask = Image.new('L', image.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, image.width - 1, image.height - 1), radius, fill=255)
    out = Image.new('RGBA', image.size, (0, 0, 0, 0))
    out.paste(image, (0, 0), mask)
    return out


def main():
    icons = []
    for number, make in enumerate(IDEAS, start=1):
        icon = make().convert('RGB')
        icon.save(OUT / f'idea-{number}.png')
        icons.append(icon)
    # Übersicht: groß als App-Icon, darunter klein wie ein Favicon im Tab
    sheet = Image.new('RGB', (5 * 230 + 20, 330), (30, 32, 40))
    draw = ImageDraw.Draw(sheet)
    for index, icon in enumerate(icons):
        x = 20 + index * 230
        sheet.paste(rounded(icon.resize((190, 190), Image.LANCZOS), 42), (x, 20), rounded(icon.resize((190, 190), Image.LANCZOS), 42))
        small = icon.resize((32, 32), Image.LANCZOS)
        sheet.paste(small, (x + 79, 240))
        tiny = icon.resize((16, 16), Image.LANCZOS)
        sheet.paste(tiny, (x + 87, 290))
        draw.text((x, 230), str(index + 1), fill=(236, 233, 226))
    sheet.save(OUT / 'overview.png')



def export_chosen(target: Path):
    """Gewählte Idee 1 als App-Icons, Favicon ohne Hintergrund (bei 16 px klarer)."""
    target.mkdir(parents=True, exist_ok=True)
    app_icon = idea_planet().convert('RGB')
    for size in (512, 192):
        app_icon.resize((size, size), Image.LANCZOS).save(target / f'icon-{size}.png')
    app_icon.resize((180, 180), Image.LANCZOS).save(target / 'apple-touch-icon.png')
    favicon = planet(64)
    favicon.resize((32, 32), Image.LANCZOS).save(target / 'favicon-32.png')
    favicon.save(target / 'favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])


if __name__ == '__main__':
    main()
    export_chosen(OUT / 'chosen')
