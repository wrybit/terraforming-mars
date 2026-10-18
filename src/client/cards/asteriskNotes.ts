// Card texts whose "*" rule is shown as a separate, highlighted note (format: splitAsteriskNote.ts).
// Keyed by the card's original English text, so the card files stay untouched for upstream merges:
// when upstream rewords a text, its entry no longer matches and the card falls back to the plain
// text. tests/client/cards/asteriskNotes.spec.ts reports such stale entries.
export const ASTERISK_NOTES: Readonly<Record<string, string>> = {
  // Mangrove
  'Requires +4 C or warmer. Place a greenery tile ON AN AREA RESERVED FOR OCEAN and raise oxygen 1 step. Disregard normal placement restrictions for this.':
    'Requires +4 C or warmer. Raise oxygen 1 step. Disregard normal placement restrictions for this.<note>Place a greenery tile <b>on an area reserved for ocean</b>.</note>',
  // Natural Preserve
  'Oxygen must be 4% or less. Place this tile NEXT TO NO OTHER TILE. Increase your M€ production 1 step.':
    'Oxygen must be 4% or less. Increase your M€ production 1 step.<note>Place this tile <b>next to no other tile</b>.</note>',
  // Research Outpost
  'Place a city tile NEXT TO NO OTHER TILE.':
    '<note>Place a city tile <b>next to no other tile</b>.</note>',
  // Imported Hydrogen
  'Gain 3 plants, or add 3 microbes or 2 animals to ANOTHER card. Place an ocean tile.':
    'Place an ocean tile.<note>Gain 3 plants, or add 3 microbes or 2 animals <b>to another card</b>.</note>',
  // Noctis City
  'Decrease your energy production 1 step and increase your M€ production 3 steps. Place a city tile ON THE RESERVED AREA, disregarding normal placement restrictions.':
    'Decrease your energy production 1 step and increase your M€ production 3 steps. Disregard normal placement restrictions for this.<note>Place a city tile <b>on the reserved area</b>.</note>',
  // Martian Rails
  'Action: Spend 1 energy to gain 1 M€ for each city tile ON MARS.':
    '<note>Action: Spend 1 energy to gain 1 M€ for each city tile <b>on Mars</b>.</note>',
  // Urbanized Area
  'Decrease your energy production 1 step and increase your M€ production 2 steps. Place a city tile ADJACENT TO AT LEAST 2 OTHER CITY TILES.':
    'Decrease your energy production 1 step and increase your M€ production 2 steps.<note>Place a city tile <b>adjacent to at least 2 other city tiles</b>.</note>',
};
