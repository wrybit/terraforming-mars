#!/usr/bin/env python3
# Picture "add 1 resource to a card that already holds one" for the Dune theme (CEO's Favorite Project, Jens 23 Oct 2026):
# a resource with a plus, a slim black arrow, a card back with a resource already lying on it – turned, off the middle
# and with a shadow, so it reads as a placed piece and not as part of the card design.
# Writes assets/themes/dune/graphics/resource-onto-card.svg.
#   python3 scripts/make-resource-onto-card.py
import re
from pathlib import Path

GRAPHICS = Path(__file__).resolve().parent.parent / 'assets/themes/dune/graphics'
INK = '#1d140c'
# Ring around the plus: the dark blue of the card back (res-card.svg), not white
PLUS_RING = '#1a1d3a'
WIDTH, HEIGHT = 112, 68


def inner(name: str) -> tuple[str, str]:
    source = (GRAPHICS / name).read_text()
    match = re.search(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg>', source, re.S)
    return match.group(1), match.group(2)


def main() -> None:
    card_box, card = inner('res-card.svg')
    token_box, token = inner('res-any.svg')

    def place_token(x: float, y: float, size: float) -> str:
        return f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="{token_box}">{token}</svg>'

    # Resource to add, with a black plus in the dark blue ring
    parts = [place_token(4, 23, 22),
             f'<circle cx="24" cy="26" r="9" fill="{INK}" stroke="{PLUS_RING}" stroke-width="2"/>',
             '<path d="M19.5 26H28.5M24 21.5V30.5" stroke="#fffdf8" stroke-width="2.6" stroke-linecap="round"/>']
    # Arrow as one slim shape, shaft and head together
    x, y, length = 38, 34, 24
    parts.append(f'<path d="M{x} {y - 1.3}H{x + length - 7}V{y - 5}L{x + length} {y}L{x + length - 7} {y + 5}V{y + 1.3}H{x}Z" fill="{INK}"/>')
    # Card with the resource lying on it
    parts.append(f'<svg x="62" y="4" width="42" height="60" viewBox="{card_box}">{card}</svg>')
    parts.append('<g transform="rotate(-16 88 46)">'
                 '<rect x="79" y="39" width="20" height="20" rx="4" fill="#000" opacity=".35" transform="translate(1.5 2.5)"/>'
                 + place_token(78, 36, 20) + '</g>')
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<!-- Add a resource to a card that already holds one; scripts/make-resource-onto-card.py -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="{WIDTH}" height="{HEIGHT}">'
           + ''.join(parts) + '</svg>\n')
    (GRAPHICS / 'resource-onto-card.svg').write_text(svg)


if __name__ == '__main__':
    main()
