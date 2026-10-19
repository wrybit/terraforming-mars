# Erzeugt den Wurm-Token des Dune-Themes (assets/themes/dune/graphics/token-worm.svg): der Schlund von oben –
# zerfurchter Rand, dahinter ein dichter Kranz feiner Barthaare, die in den dunklen Schlund laufen. Fester Zufallswert, damit jeder Lauf dieselbe Datei schreibt.
# Aufruf: python3 scripts/make-worm-token.py
import math
import random

random.seed(7)
CENTER = 100
TARGET = 'assets/themes/dune/graphics/token-worm.svg'


def rough(radius, count, jitter):
    """Geschlossene, leicht unregelmäßige Kurve um die Mitte (Catmull-Rom als Bézier)."""
    points = []
    for index in range(count):
        angle = index / count * 2 * math.pi
        r = radius + random.uniform(-jitter, jitter)
        points.append((CENTER + r * math.cos(angle), CENTER + r * math.sin(angle)))
    path = f'M{points[0][0]:.1f},{points[0][1]:.1f} '
    for index in range(count):
        p0, p1, p2, p3 = points[index - 1], points[index], points[(index + 1) % count], points[(index + 2) % count]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        path += f'C{c1[0]:.1f},{c1[1]:.1f} {c2[0]:.1f},{c2[1]:.1f} {p2[0]:.1f},{p2[1]:.1f} '
    return path + 'Z'


parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">', '''<defs>
<radialGradient id="sand" cx="50%" cy="50%" r="50%"><stop offset=".75" stop-color="#d9b07a"/><stop offset=".92" stop-color="#e6c48e"/><stop offset="1" stop-color="#c99a5b" stop-opacity=".6"/></radialGradient>
<radialGradient id="flesh" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#c9a27a"/><stop offset=".65" stop-color="#9a7656"/><stop offset="1" stop-color="#5a4130"/></radialGradient>
<radialGradient id="gum" cx="50%" cy="50%" r="50%"><stop offset=".3" stop-color="#140c07"/><stop offset=".8" stop-color="#3a2a1d"/><stop offset="1" stop-color="#6b5240"/></radialGradient>
<radialGradient id="throat" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#050302" stop-opacity="1"/><stop offset=".35" stop-color="#0d0805" stop-opacity=".95"/><stop offset=".7" stop-color="#1e140d" stop-opacity=".5"/><stop offset="1" stop-color="#1e140d" stop-opacity="0"/></radialGradient>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 .2  0 0 0 0 .1  0 0 0 0 .04  0 0 0 .45 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
<filter id="shadow" x="-15%" y="-15%" width="130%" height="135%"><feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#000" flood-opacity=".6"/></filter>
</defs>''']

# Sand rund um den Wurm: weicher, aufgeworfener Hof mit Körnern; der Wurm selbst etwas kleiner darin
parts.append(f'<path d="{rough(97, 24, 2.5)}" fill="url(#sand)"/>')
for index in range(160):
    angle = random.uniform(0, 2 * math.pi)
    r = random.uniform(80, 97)
    parts.append(f'<circle cx="{CENTER + r * math.cos(angle):.1f}" cy="{CENTER + r * math.sin(angle):.1f}" '
                 f'r="{random.uniform(.4, 1.1):.2f}" fill="{random.choice(("#f3dcae", "#a8783f", "#e8c88f"))}" opacity="{random.uniform(.5, .9):.2f}"/>')
parts.append(f'<g transform="translate({CENTER} {CENTER}) scale(.8) translate({-CENTER} {-CENTER})">')

# Zerfurchter Rand mit Körnung, dunklen Rillen und wenigen hellen Kanten
outer = rough(94, 30, 3)
parts.append(f'<g filter="url(#shadow)"><path d="{outer}" fill="url(#flesh)"/></g><path d="{outer}" fill="#000" filter="url(#grain)"/>')
for index in range(40):
    angle = index / 40 * 2 * math.pi + random.uniform(-.08, .08)
    r = random.uniform(77, 91)
    spread = random.uniform(.05, .16)
    x1, y1 = CENTER + r * math.cos(angle - spread), CENTER + r * math.sin(angle - spread)
    x2, y2 = CENTER + r * math.cos(angle + spread), CENTER + r * math.sin(angle + spread)
    parts.append(f'<path d="M{x1:.1f},{y1:.1f} A{r:.0f},{r:.0f} 0 0 1 {x2:.1f},{y2:.1f}" stroke="{"#d9bd96" if index % 3 == 0 else "#3a2a1e"}" '
                 f'stroke-width="{random.uniform(1, 2.6):.1f}" fill="none" opacity="{random.uniform(.3, .6):.2f}" stroke-linecap="round"/>')

# Zahnfleisch mit Ringfalten
parts.append(f'<path d="{rough(74, 26, 2)}" fill="url(#gum)" stroke="#3b190b" stroke-width="2"/>')
for r in (71,):
    parts.append(f'<path d="{rough(r, 22, 1.2)}" fill="none" stroke="#24100a" stroke-width="2.5" opacity=".6"/>'
                 f'<path d="{rough(r - 2, 22, 1.2)}" fill="none" stroke="#c98a55" stroke-width="1" opacity=".4"/>')

# Barthaare: viele feine, leicht gebogene Borsten vom Zahnfleisch in den Schlund, hell und dunkel gemischt
for layer, (count, outer_r, inner_min, inner_max, width, shades) in enumerate((
        (150, 72, 20, 34, 1.1, ('#5a4a3a', '#6e5c48', '#3e3227')),
        (130, 66, 14, 26, 0.9, ('#8a7660', '#a28c72', '#6b5a48')),
        (110, 58, 10, 20, 0.7, ('#c4b096', '#b39d82', '#d8c6aa')))):
    for index in range(count):
        angle = index / count * 2 * math.pi + random.uniform(-.02, .02) + layer * .013
        bend = random.uniform(-.12, .12)
        start = outer_r + random.uniform(-2, 1)
        end = random.uniform(inner_min, inner_max)
        sx, sy = CENTER + start * math.cos(angle), CENTER + start * math.sin(angle)
        cx, cy = CENTER + (start + end) / 2 * math.cos(angle + bend), CENTER + (start + end) / 2 * math.sin(angle + bend)
        ex, ey = CENTER + end * math.cos(angle + bend * 1.5), CENTER + end * math.sin(angle + bend * 1.5)
        parts.append(f'<path d="M{sx:.1f},{sy:.1f} Q{cx:.1f},{cy:.1f} {ex:.1f},{ey:.1f}" stroke="{random.choice(shades)}" '
                     f'stroke-width="{width * random.uniform(.7, 1.3):.2f}" stroke-linecap="round" fill="none" opacity="{random.uniform(.55, .95):.2f}"/>')

# Dunkler Schlund in der Mitte, weich auslaufend über die Spitzen der Barthaare
parts.append(f'<circle cx="{CENTER}" cy="{CENTER}" r="40" fill="url(#throat)"/>')
parts.append('</g>')

# Sand rieselt über den Rand: helle Verwehungen auf dem Leib
for index in range(9):
    angle = index / 9 * 2 * math.pi + random.uniform(-.2, .2)
    r = random.uniform(70, 78)
    x, y = CENTER + r * math.cos(angle), CENTER + r * math.sin(angle)
    parts.append(f'<ellipse cx="{x:.1f}" cy="{y:.1f}" rx="{random.uniform(6, 11):.1f}" ry="{random.uniform(2.5, 4):.1f}" '
                 f'transform="rotate({math.degrees(angle) + 90:.0f} {x:.1f} {y:.1f})" fill="#e2bd85" opacity="{random.uniform(.45, .75):.2f}"/>')
parts.append('</svg>')

with open(TARGET, 'w') as file:
    file.write('\n'.join(parts) + '\n')
print('wrote', TARGET)
