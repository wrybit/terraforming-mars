// What playing a card changes at once, as far as it is a fixed number (production, stock, TR, tiles, cards drawn):
// worked out from the card's behavior when the client card data is exported (export_card_rendering.ts). The decision
// log of the new AI shows it like the effect chips of the game log. Counted or chosen effects are left out.
export type CardPlayEffect = {
  /** Icon name of the game log (log.less): megacredit, steel, titanium, plant, power, heat, card, tr, venus */
  resource?: string;
  /** Tile image name: city, greenery, ocean */
  tile?: string;
  amount: number;
  production?: boolean;
};

/** Unit names of a card's behavior -> icon names of the game log */
export const UNIT_ICONS: Readonly<Record<string, string>> = {
  megacredits: 'megacredit', steel: 'steel', titanium: 'titanium', plants: 'plant', energy: 'power', heat: 'heat',
};
