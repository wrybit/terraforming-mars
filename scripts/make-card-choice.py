#!/usr/bin/env python3
# Pictures "look at N cards, keep M" for the Dune theme (Invention Contest, Business Contacts – Jens 21 Oct 2026):
# N card backs from res-card.svg side by side, the kept ones outlined in orange, the discarded ones with the red
# cross of the theme. Writes assets/themes/dune/graphics/cards-keep-<M>-of-<N>.svg.
#   python3 scripts/make-card-choice.py
import re
from pathlib import Path

GRAPHICS = Path(__file__).resolve().parent.parent / 'assets/themes/dune/graphics'
CARD_WIDTH, CARD_HEIGHT, GAP, PADDING = 35, 50, 7, 4
KEPT_OUTLINE = '#f0a050'
CROSS, CROSS_HALO = '#b51616', '#fffdf8'


def card_inner() -> str:
    source = (GRAPHICS / 'res-card.svg').read_text()
    return re.search(r'<g transform[^>]*>(.*)</g></svg>', source, re.S).group(1)


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
            left, top, right, bottom = x + 6, y + 10, x + CARD_WIDTH - 6, y + CARD_HEIGHT - 10
            for colour, stroke in ((CROSS_HALO, 9), (CROSS, 5)):
                parts.append(f'<path d="M{left} {top}L{right} {bottom}M{right} {top}L{left} {bottom}" stroke="{colour}" '
                             f'stroke-width="{stroke}" stroke-linecap="round"/>')
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           f'<!-- Look at {total} cards, keep {keep} (outlined), discard the others (red cross); scripts/make-card-choice.py -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">'
           + ''.join(parts) + '</svg>\n')
    (GRAPHICS / f'cards-keep-{keep}-of-{total}.svg').write_text(svg)


if __name__ == '__main__':
    make(3, 1)
    make(4, 2)
