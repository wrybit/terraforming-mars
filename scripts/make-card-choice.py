#!/usr/bin/env python3
# Pictures "look at N cards, keep M" for the Dune theme (Invention Contest, Business Contacts – Jens 21 Oct 2026):
# N card backs from res-card.svg side by side, the kept ones outlined in orange, the discarded ones with the red
# cross of the theme. Writes assets/themes/dune/graphics/cards-keep-<M>-of-<N>.svg and the cross alone, cross.svg.
#   python3 scripts/make-card-choice.py
import re
from pathlib import Path

GRAPHICS = Path(__file__).resolve().parent.parent / 'assets/themes/dune/graphics'
CARD_WIDTH, CARD_HEIGHT, GAP, PADDING = 35, 50, 7, 4
KEPT_OUTLINE = '#f0a050'
CROSS, CROSS_HALO = '#b51616', '#fffdf8'
CROSS_WIDTH, CROSS_HALO_WIDTH = 5, 9
# Width and height of the cross on a card back (card minus 6 px left and right, 10 px top and bottom)
CROSS_SIZE = (CARD_WIDTH - 12, CARD_HEIGHT - 20)


def card_inner() -> str:
    source = (GRAPHICS / 'res-card.svg').read_text()
    return re.search(r'<g transform[^>]*>(.*)</g></svg>', source, re.S).group(1)


def cross_paths(left: float, top: float, right: float, bottom: float) -> list:
    """The red cross with its light halo, the one cross of the theme (cards, requirements, cancelled icons)."""
    return [f'<path d="M{left} {top}L{right} {bottom}M{right} {top}L{left} {bottom}" stroke="{colour}" '
            f'stroke-width="{stroke}" stroke-linecap="round"/>' for colour, stroke in ((CROSS_HALO, CROSS_HALO_WIDTH), (CROSS, CROSS_WIDTH))]


def make_cross() -> None:
    """The cross alone (graphics/cross.svg) for the X on cards (.card-x, theme-extra.css): same shape as on the cards."""
    inset = CROSS_HALO_WIDTH / 2
    width, height = CROSS_SIZE[0] + 2 * inset, CROSS_SIZE[1] + 2 * inset
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<!-- The red cross of the theme (cancelled, ignored); scripts/make-card-choice.py -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" width="{width:g}" height="{height:g}">'
           + ''.join(cross_paths(inset, inset, inset + CROSS_SIZE[0], inset + CROSS_SIZE[1])) + '</svg>\n')
    (GRAPHICS / 'cross.svg').write_text(svg)


def make(total: int, keep: int) -> None:
    inner = card_inner()
    width = PADDING * 2 + total * CARD_WIDTH + (total - 1) * GAP
    height = PADDING * 2 + CARD_HEIGHT
    parts = []
    for index in range(total):
        x, y = PADDING + index * (CARD_WIDTH + GAP), PADDING
        parts.append(f'<svg x="{x}" y="{y}" width="{CARD_WIDTH}" height="{CARD_HEIGHT}" viewBox="0 0 70 100">{inner}</svg>')
        if index < keep:
            parts.append(f'<rect x="{x - 2}" y="{y - 2}" width="{CARD_WIDTH + 4}" height="{CARD_HEIGHT + 4}" rx="6" fill="none" '
                         f'stroke="{KEPT_OUTLINE}" stroke-width="3"/>')
        else:
            parts.extend(cross_paths(x + 6, y + 10, x + CARD_WIDTH - 6, y + CARD_HEIGHT - 10))
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           f'<!-- Look at {total} cards, keep {keep} (outlined), discard the others (red cross); scripts/make-card-choice.py -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">'
           + ''.join(parts) + '</svg>\n')
    (GRAPHICS / f'cards-keep-{keep}-of-{total}.svg').write_text(svg)


if __name__ == '__main__':
    make(3, 1)
    make(4, 2)
    make_cross()
