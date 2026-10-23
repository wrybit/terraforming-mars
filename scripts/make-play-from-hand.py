#!/usr/bin/env python3
# Picture "play a card from your hand for 25 less" for the Dune theme (Eccentric Sponsor, Jens 23 Oct 2026): a fan of
# three cards from the hand with the chosen one raised and outlined, a slim black arrow standing free between them,
# the played card with a gold coin "−25" where the cost sits.
# Writes assets/themes/dune/graphics/play-from-hand-discount.svg.
#   python3 scripts/make-play-from-hand.py
import re
from pathlib import Path

GRAPHICS = Path(__file__).resolve().parent.parent / 'assets/themes/dune/graphics'
INK = '#1d140c'
CHOSEN_OUTLINE = '#f0a050'
DISCOUNT = '−25'
WIDTH, HEIGHT = 148, 66


def inner(name: str) -> tuple[str, str]:
    source = (GRAPHICS / name).read_text()
    match = re.search(r'<svg[^>]*viewBox="([^"]+)"[^>]*>(.*)</svg>', source, re.S)
    return match.group(1), match.group(2)


def main() -> None:
    card_box, card = inner('res-card.svg')
    coin_box, coin = inner('coin.svg')

    def place_card(x: float, y: float, width: float, turn: float = 0, pivot: tuple[float, float] = (0, 0), chosen: bool = False) -> str:
        height = width * 100 / 70
        body = f'<svg x="{x}" y="{y}" width="{width}" height="{height:.1f}" viewBox="{card_box}">{card}</svg>'
        if chosen:
            body += (f'<rect x="{x - 2}" y="{y - 2}" width="{width + 4}" height="{height + 4:.1f}" rx="6" fill="none" '
                     f'stroke="{CHOSEN_OUTLINE}" stroke-width="3"/>')
        if turn:
            body = f'<g transform="rotate({turn} {pivot[0]} {pivot[1]})">{body}</g>'
        return body

    # Hand: three cards in a fan, the middle one raised and outlined
    parts = [place_card(4, 16, 32, -14, (20, 70)), place_card(28, 16, 32, 14, (44, 70)), place_card(16, 4, 32, chosen=True)]
    # Arrow as one slim shape, free between fan and card
    x, y, length = 74, 40, 20
    parts.append(f'<path d="M{x} {y - 1.3}H{x + length - 7}V{y - 5}L{x + length} {y}L{x + length - 7} {y + 5}V{y + 1.3}H{x}Z" fill="{INK}"/>')
    # Played card with the discount coin on its cost corner
    parts.append(place_card(102, 10, 38))
    parts.append(f'<svg x="90" y="0" width="32" height="32" viewBox="{coin_box}">{coin}</svg>'
                 f'<text x="106" y="20.5" text-anchor="middle" font-family="Ubuntu, sans-serif" font-weight="700" font-size="12" '
                 f'fill="{INK}">{DISCOUNT}</text>')
    # Shifted right: the turned left card of the fan reaches past x = 0
    svg = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<!-- Play a card from the hand for 25 less; scripts/make-play-from-hand.py -->\n'
           f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {WIDTH} {HEIGHT}" width="{WIDTH}" height="{HEIGHT}">'
           '<g transform="translate(4 0)">' + ''.join(parts) + '</g></svg>\n')
    (GRAPHICS / 'play-from-hand-discount.svg').write_text(svg)


if __name__ == '__main__':
    main()
