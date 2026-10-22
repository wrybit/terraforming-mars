#!/usr/bin/env python3
# Pictures for the Dune cards (Jens 22 Oct 2026), written to assets/themes/dune/graphics/:
# - choam.svg: the CHOAM sign (red dome with three drips on black) in the gold rim of the tags, for the CHOAM cards and
#   the CHOAM tab (Jens: variant A)
# - smuggler.svg: the smuggler – a hooded figure with glowing Ibad eyes on night blue (the smugglers' market), in the
#   gold rim of the resources: the smuggling module, its tab and suspicion (Jens: variant C)
# - bribe.svg: the same smuggler holding up a Solari coin: the bribe (Smuggler Network)
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
       '<clipPath id="face"><circle cx="50" cy="50" r="37"/></clipPath>'
       '<radialGradient id="night" cx=".42" cy=".3" r=".85"><stop offset="0" stop-color="#5a6aa0"/>'
       '<stop offset=".55" stop-color="#2c3770"/><stop offset="1" stop-color="#141838"/></radialGradient>'
       '<linearGradient id="cloak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a4a32"/>'
       '<stop offset="1" stop-color="#2e1e14"/></linearGradient>'
       '<radialGradient id="gold" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fff2c0"/>'
       '<stop offset=".6" stop-color="#f2c44c"/><stop offset="1" stop-color="#b8861c"/></radialGradient></defs>')


def resource_frame(face: str, body: str) -> str:
    # Rounded square of the resource symbols: dark edge, gold rim, the face, the drawing, the inner shadow
    return (RIM + '<rect x="2" y="2" width="96" height="96" rx="18" fill="#1d140c"/>'
            '<rect x="5.5" y="5.5" width="89" height="89" rx="15" fill="url(#rim)"/>'
            f'<rect x="10" y="10" width="80" height="80" rx="11" fill="{face}"/>' + body
            + '<rect x="10" y="10" width="80" height="80" rx="11" fill="url(#inner)"/>')


def hood(dx: float = 0) -> str:
    # Cloak with a hood, the face in shadow, two glowing blue eyes
    return (f'<path d="M{24 + dx} 88Q{22 + dx} 48 {50 + dx} 24Q{78 + dx} 48 {76 + dx} 88Z" fill="url(#cloak)" stroke="#1d140c" '
            'stroke-width="2.6" stroke-linejoin="round"/>'
            f'<path d="M{36 + dx} 60Q{38 + dx} 40 {50 + dx} 36Q{62 + dx} 40 {64 + dx} 60Q{50 + dx} 68 {36 + dx} 60Z" fill="#0c0a14"/>'
            f'<path d="M{42 + dx} 52l5 1M{53 + dx} 53l5-1" stroke="#7fb8ff" stroke-width="2.6" stroke-linecap="round"/>')


def smuggler() -> str:
    return resource_frame('url(#night)', hood())


def bribe() -> str:
    coin = ('<circle cx="70" cy="66" r="14" fill="url(#gold)" stroke="#1d140c" stroke-width="2.4"/>'
            '<circle cx="70" cy="66" r="8.7" fill="none" stroke="#a87418" stroke-width="1.6"/>')
    return resource_frame('url(#night)', hood(-8) + coin)


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


def arrow(x: float, top: float, bottom: float, down: bool, colour: str) -> str:
    # A thick vertical arrow with a filled head, pointing down or up
    head = 7
    if down:
        return (f'<path d="M{x:g} {top:g}V{bottom - head:g}" stroke="{colour}" stroke-width="3.6"/>'
                f'<path d="M{x - 5.5:g} {bottom - head - 1:g}H{x + 5.5:g}L{x:g} {bottom:g}Z" fill="{colour}"/>')
    return (f'<path d="M{x:g} {bottom:g}V{top + head:g}" stroke="{colour}" stroke-width="3.6"/>'
            f'<path d="M{x - 5.5:g} {top + head + 1:g}H{x + 5.5:g}L{x:g} {top:g}Z" fill="{colour}"/>')


def agenda_swap() -> str:
    # Your 2 agendas above, the top 3 below; the right one of yours (red) goes down, the middle one below (green)
    # comes up – two separate arrows in the gap between the rows (Jens 22 Oct 2026)
    back = agenda_back()
    width, height, gap, row_gap, pad = 30, 43, 7, 26, 4
    bottom_width = 3 * width + 2 * gap
    top_left = pad + (bottom_width - (2 * width + gap)) / 2
    parts = []
    top_y, bottom_y = pad, pad + height + row_gap
    for index in range(2):
        x = top_left + index * (width + gap)
        parts.append(card(back, x, top_y, width, height))
        if index == 1:
            parts.append(outline(x, top_y, width, height, GIVEN))
    for index in range(3):
        x = pad + index * (width + gap)
        parts.append(card(back, x, bottom_y, width, height))
        if index == 1:
            parts.append(outline(x, bottom_y, width, height, TAKEN))
    middle = pad + bottom_width / 2
    gap_top, gap_bottom = top_y + height + 4, bottom_y - 4
    parts.append(arrow(middle + 8, gap_top, gap_bottom, True, GIVEN))
    parts.append(arrow(middle - 6, gap_top, gap_bottom, False, TAKEN))
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
    write('smuggler.svg', 100, 100, smuggler(), 'Smuggler symbol')
    write('bribe.svg', 100, 100, bribe(), 'Bribe symbol')
    write('agenda-back.svg', 70, 100, f'<g>{agenda_back()}</g>', 'Back of a secret agenda')
    body, width, height = agenda_swap()
    write('agenda-swap.svg', width, height, body, 'Mentat Calculation: swap one of your 2 agendas for one of the top 3')
    body, width, height = agenda_peek()
    write('agenda-peek.svg', width, height, body, 'Tleilaxu Spy: the 2 agendas of another player')
    write('tile-planting-special.svg', 413, 477, special_planting(), 'Greenery of the Dune Stabiliser as a special tile')
