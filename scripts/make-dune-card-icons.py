#!/usr/bin/env python3
# Pictures for the Dune cards (Jens 22 Oct 2026), written to assets/themes/dune/graphics/:
# - choam.svg: the CHOAM sign (red dome with three drips on black) in the gold rim of the tags, for the CHOAM cards and
#   the CHOAM tab (Jens: variant A)
# - bazaar.svg: the stall of the bazaar tile as a symbol in the gold rim of the resources – it is no tile (variant B)
# - agenda-back.svg: the back of a secret agenda (House schemes): burgundy with the eye seal, with the oriental frame
#   of the card back res-card.svg in gold (variant A)
# - agenda-swap.svg: Mentat Calculation – your 2 agendas above, the top 3 below, one of yours (red) swapped for one
#   of them (green)
# - agenda-peek.svg: Tleilaxu Spy – the 2 agendas of another player, outlined red
# - tile-planting-special.svg: the greenery of the Dune Stabiliser as a special tile: the planting in the yellow
#   border of the special tiles (tile-special.svg)
#   python3 scripts/make-dune-card-icons.py
import re
from pathlib import Path

GRAPHICS = Path(__file__).resolve().parent.parent / 'assets/themes/dune/graphics'
GIVEN, TAKEN, ARROW = '#c0301c', '#3c9a24', '#3a2716'


def write(name: str, width: float, height: float, body: str, comment: str) -> None:
    svg = (f'<?xml version="1.0" encoding="UTF-8"?>\n<!-- {comment}; scripts/make-dune-card-icons.py -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" width="{width:g}" height="{height:g}">'
           f'{body}</svg>\n')
    (GRAPHICS / name).write_text(svg)


# Gold rim and inner shadow of the tag and resource symbols (tag-*.svg, res-*.svg)
RIM = ('<defs><linearGradient id="rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff0c0"/>'
       '<stop offset=".45" stop-color="#d8b070"/><stop offset="1" stop-color="#7a5a2e"/></linearGradient>'
       '<radialGradient id="inner" cx=".5" cy=".42" r=".6"><stop offset=".68" stop-color="#000" stop-opacity="0"/>'
       '<stop offset="1" stop-color="#000" stop-opacity=".32"/></radialGradient>'
       '<radialGradient id="sand" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#f0c48a"/>'
       '<stop offset="1" stop-color="#9a6234"/></radialGradient>'
       '<clipPath id="face"><circle cx="50" cy="50" r="37"/></clipPath></defs>')


def choam() -> str:
    # Dome: upper half of the black face; drips: three bars hanging from its flat edge, the middle one longest
    red = '#b51e2c'
    return (RIM + '<circle cx="50" cy="50" r="50" fill="#1d140c"/><circle cx="50" cy="50" r="46.5" fill="url(#rim)"/>'
            '<circle cx="50" cy="50" r="42" fill="#0b0b0b"/>'
            f'<g clip-path="url(#face)"><path d="M13 50A37 37 0 0 1 87 50Z" fill="{red}"/>'
            f'<rect x="30.5" y="49" width="7.7" height="23" fill="{red}"/><rect x="46.2" y="49" width="7.7" height="35" fill="{red}"/>'
            f'<rect x="61.8" y="49" width="7.7" height="23" fill="{red}"/></g>'
            '<circle cx="50" cy="50" r="41.5" fill="url(#inner)"/>')


def bazaar() -> str:
    # The stall of special-bazaar.svg (drawn in 22–110 × 30–118 of its 132 × 152), without the hex rings
    tile = re.sub(r'^<\?xml[^>]*>\s*', '', (GRAPHICS / 'special-bazaar.svg').read_text())
    stall = re.sub(r'<svg[^>]*>', '<svg x="14" y="12" width="72" height="72" viewBox="22 30 88 88">', tile, count=1)
    stall = re.sub(r'<polygon[^>]*/>', '', stall)
    return (RIM + '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1d140c"/>'
            '<rect x="5.5" y="5.5" width="89" height="89" rx="15" fill="url(#rim)"/>'
            '<rect x="10" y="10" width="80" height="80" rx="11" fill="url(#sand)"/>' + stall
            + '<rect x="10" y="10" width="80" height="80" rx="11" fill="url(#inner)"/>')


def agenda_back() -> str:
    # Burgundy with a gold frame and a wax seal with the eye of the schemes – clearly not the blue card back
    # The frame: the double octagon with the diamond on top of the card back res-card.svg, here in gold
    gold = '#d9a441'
    return ('<rect x="2" y="2" width="66" height="96" rx="8" fill="#1d140c"/>'
            '<rect x="5" y="5" width="60" height="90" rx="6" fill="#5a1626"/>'
            f'<path d="M16 9H54L61 16V84L54 91H16L9 84V16Z" fill="none" stroke="{gold}" stroke-width="3.2"/>'
            f'<path d="M22 15H48L55 22V78L48 85H22L15 78V22Z" fill="none" stroke="{gold}" stroke-width="1.6"/>'
            f'<path d="M35 4L42 11L35 18L28 11Z" fill="#5a1626" stroke="{gold}" stroke-width="2.4"/>'
            f'<path d="M35 8L38 11L35 14L32 11Z" fill="{gold}"/>'
            f'<path d="M35 96L42 89L35 82L28 89Z" fill="#5a1626" stroke="{gold}" stroke-width="2.4"/>'
            '<circle cx="35" cy="50" r="15" fill="#d9a441"/><circle cx="35" cy="50" r="12" fill="#8c2a1c"/>'
            '<path d="M25 50Q35 41 45 50Q35 59 25 50Z" fill="#f3d9a0"/><circle cx="35" cy="50" r="3.6" fill="#2a0e10"/>')


def card(inner: str, x: float, y: float, width: float, height: float) -> str:
    return f'<svg x="{x:g}" y="{y:g}" width="{width:g}" height="{height:g}" viewBox="0 0 70 100">{inner}</svg>'


def outline(x: float, y: float, width: float, height: float, colour: str) -> str:
    return (f'<rect x="{x - 2:g}" y="{y - 2:g}" width="{width + 4:g}" height="{height + 4:g}" rx="6" fill="none" '
            f'stroke="{colour}" stroke-width="3"/>')


def agenda_swap() -> str:
    back = agenda_back()
    width, height, gap, row_gap, pad = 30, 43, 7, 20, 4
    bottom_width = 3 * width + 2 * gap
    top_left = pad + (bottom_width - (2 * width + gap)) / 2
    parts = []
    top_y, bottom_y = pad, pad + height + row_gap
    for index in range(2):
        x = top_left + index * (width + gap)
        parts.append(card(back, x, top_y, width, height))
        if index == 1:
            parts.append(outline(x, top_y, width, height, GIVEN))
            given = (x + width / 2, top_y + height + 2)
    for index in range(3):
        x = pad + index * (width + gap)
        parts.append(card(back, x, bottom_y, width, height))
        if index == 2:
            parts.append(outline(x, bottom_y, width, height, TAKEN))
            taken = (x + width / 2, bottom_y - 2)
    # Double arrow in the gap between the rows, from the given agenda to the taken one
    (x1, y1), (x2, y2) = given, taken
    parts.append(f'<path d="M{x1:g} {y1 + 3:g}L{x2:g} {y2 - 3:g}" stroke="{ARROW}" stroke-width="2.4"/>')
    parts.append(f'<path d="M{x1 - 4:g} {y1 + 7:g}L{x1:g} {y1 + 1:g}L{x1 + 4:g} {y1 + 7:g}" fill="none" stroke="{ARROW}" '
                 'stroke-width="2.4" stroke-linejoin="round"/>')
    parts.append(f'<path d="M{x2 - 4:g} {y2 - 7:g}L{x2:g} {y2 - 1:g}L{x2 + 4:g} {y2 - 7:g}" fill="none" stroke="{ARROW}" '
                 'stroke-width="2.4" stroke-linejoin="round"/>')
    return ''.join(parts), pad * 2 + bottom_width, pad * 2 + 2 * height + row_gap


def agenda_peek() -> str:
    back = agenda_back()
    width, height, gap, pad = 35, 50, 7, 4
    parts = []
    for index in range(2):
        x = pad + index * (width + gap)
        parts.append(card(back, x, pad, width, height))
        parts.append(outline(x, pad, width, height, GIVEN))
    return ''.join(parts), pad * 2 + 2 * width + gap, pad * 2 + height


def special_planting() -> str:
    planting = (GRAPHICS / 'tile-planting.svg').read_text()
    planting = re.sub(r'^<\?xml[^>]*>\s*', '', planting)
    # The planting's own ids would clash with nothing here, but keep them unique all the same
    planting = planting.replace('id="p', 'id="sp').replace('url(#p', 'url(#sp').replace('id="hexclip', 'id="sphexclip') \
        .replace('url(#hexclip', 'url(#sphexclip')
    inner = re.sub(r'<svg[^>]*>', '<svg x="34" y="39" width="345" height="399" viewBox="0 0 413 477">', planting, count=1)
    return ('<polygon points="206.5,0.0 413.0,119.2 413.0,357.8 206.5,477.0 0.0,357.8 0.0,119.2" fill="#1d140c"/>'
            '<polygon points="206.5,14.5 398.5,126.5 398.5,350.5 206.5,462.5 14.5,350.5 14.5,126.5" fill="#ffcc1a"/>'
            + inner)


if __name__ == '__main__':
    write('choam.svg', 100, 100, choam(), 'CHOAM sign')
    write('bazaar.svg', 100, 100, bazaar(), 'Bazaar symbol')
    write('agenda-back.svg', 70, 100, f'<g>{agenda_back()}</g>', 'Back of a secret agenda')
    body, width, height = agenda_swap()
    write('agenda-swap.svg', width, height, body, 'Mentat Calculation: swap one of your 2 agendas for one of the top 3')
    body, width, height = agenda_peek()
    write('agenda-peek.svg', width, height, body, 'Tleilaxu Spy: the 2 agendas of another player')
    write('tile-planting-special.svg', 413, 477, special_planting(), 'Greenery of the Dune Stabiliser as a special tile')
