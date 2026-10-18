// Module A – Bazaar of Arrakeen: the 32 wares (source: mockup data/bazaar-wares.js).
// Each generation fewer wares lie out than players sit at the table; whoever hesitates goes without.
// The goods are game resources under their Dune names: water = heat, moisture = energy, plasteel = steel,
// spice = titanium, influence = terraform rating. No M€ (you pay in M€) and no VP (wares never enter a tableau).

export const BAZAAR_GOODS = ['steel', 'titanium', 'plants', 'energy', 'heat', 'cards', 'tr'] as const;
export type BazaarGood = typeof BAZAAR_GOODS[number];

/** Worth of one unit in M€: regression over 96 simple cards of the base game and Corporate Era (concept, module A) */
export const BAZAAR_GOOD_VALUE: Record<BazaarGood, number> = {
  steel: 2,
  titanium: 3,
  plants: 1,
  energy: 1,
  heat: 1,
  cards: 3,
  tr: 8,
};

/** A ware always costs less than the regular way, but without the discount of its slot it is still dear. */
export const BAZAAR_PRICE_FACTOR = 0.9;

/** Price change of the five slots from left (newest) to right (oldest): wares get cheaper while they wait */
export const BAZAAR_SLOT_PRICE_CHANGE: ReadonlyArray<number> = [2, 0, -2, -4, -6];

/** The owner of the Bazaar special tile (Commercial District) buys first and pays this much less */
export const BAZAAR_TILE_DISCOUNT = 2;

export type BazaarWare = {
  /** English name, also the translation key */
  name: string,
  content: Partial<Record<BazaarGood, number>>,
};

export const BAZAAR_WARES: ReadonlyArray<BazaarWare> = [
  {name: 'Water Rings', content: {heat: 24}},
  {name: 'Cistern of Tabr', content: {heat: 16, energy: 8}},
  {name: 'Dew Collector Harvest', content: {energy: 14, heat: 10}},
  {name: 'Stillsuit Depot', content: {heat: 12, energy: 8, cards: 3}},
  {name: 'Smuggled Spice', content: {titanium: 8}},
  {name: 'Guild Reserve', content: {titanium: 6, cards: 4}},
  {name: 'Spice Exchange', content: {titanium: 10}},
  {name: 'Spice Caravan', content: {titanium: 4, heat: 8, steel: 3}},
  {name: 'Plasteel Ingots', content: {steel: 12}},
  {name: 'Ixian Components', content: {steel: 8, cards: 4}},
  {name: 'Carthag Building Materials', content: {steel: 10, plants: 6}},
  {name: 'Ornithopter Fleet', content: {steel: 6, titanium: 5}},
  {name: 'Seed Bales', content: {plants: 24}},
  {name: 'Kynes\' Seedlings', content: {plants: 18, heat: 8}},
  {name: 'Greenhouse Crates', content: {plants: 18, energy: 12}},
  {name: 'Botanical Samples', content: {plants: 15, cards: 4}},
  {name: 'Mentat Report', content: {cards: 7, heat: 2}},
  {name: 'Missionaria Archive', content: {cards: 8}},
  {name: 'Ixian Blueprints', content: {cards: 4, steel: 5}},
  {name: 'Bene Gesserit Dossier', content: {cards: 4, tr: 2}},
  {name: 'Landsraad Favour', content: {tr: 3}},
  {name: 'Bought Votes', content: {tr: 2, cards: 3}},
  {name: 'Imperial Audience', content: {tr: 2, energy: 8}},
  {name: 'Council Decree', content: {tr: 2, heat: 8}},
  {name: 'Fremen Relic', content: {tr: 2, heat: 6}},
  {name: 'Title of Honour', content: {tr: 2, plants: 8}},
  {name: 'Crysknife', content: {tr: 1, titanium: 5}},
  {name: 'Caladan Art Treasure', content: {tr: 2, cards: 2, heat: 4}},
  {name: 'Smuggler\'s Crate', content: {titanium: 3, steel: 3, heat: 10}},
  {name: 'Desert Gear', content: {heat: 8, plants: 12, energy: 4}},
  {name: 'CHOAM Parcel', content: {titanium: 3, steel: 5, cards: 3}},
  {name: 'Court Gift', content: {tr: 1, cards: 4, plants: 5}},
];

const WARE_BY_NAME = new Map(BAZAAR_WARES.map((ware) => [ware.name, ware]));

export function bazaarWare(name: string): BazaarWare {
  const ware = WARE_BY_NAME.get(name);
  if (ware === undefined) {
    throw new Error(`Unknown bazaar ware ${name}`);
  }
  return ware;
}

/** Worth of a ware in M€ */
export function bazaarWareValue(ware: BazaarWare): number {
  return (Object.entries(ware.content) as Array<[BazaarGood, number]>)
    .reduce((sum, [good, amount]) => sum + BAZAAR_GOOD_VALUE[good] * amount, 0);
}

/** Card price of a ware, before the slot */
export function bazaarBasePrice(ware: BazaarWare): number {
  return Math.ceil(bazaarWareValue(ware) * BAZAAR_PRICE_FACTOR);
}

/** What a ware costs in `slot` (0 = newest); the tile owner pays BAZAAR_TILE_DISCOUNT less. Never below 0. */
export function bazaarPrice(ware: BazaarWare, slot: number, ownsBazaarTile: boolean = false): number {
  const price = bazaarBasePrice(ware) + (BAZAAR_SLOT_PRICE_CHANGE[slot] ?? 0) - (ownsBazaarTile ? BAZAAR_TILE_DISCOUNT : 0);
  return Math.max(0, price);
}

/** How many wares lie out for this many players: one fewer than players, between 1 and the number of slots */
export function bazaarWareCount(playerCount: number): number {
  return Math.min(BAZAAR_SLOT_PRICE_CHANGE.length, Math.max(1, playerCount - 1));
}
