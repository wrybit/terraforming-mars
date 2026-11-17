import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {LogEffect} from '@/client/components/logpanel/logActions';
import {DecisionMove, DecisionPlayer} from '@/client/components/decisionLog/decisionLogModel';

// What an option would change, worked out when the log is shown (the record keeps only the move): like the effect
// chips of the game log. Card data comes from this game server's card manifest, so it matches the cards on hover.

// Payment fields of the record -> icon names of the game log (log.less)
const PAYMENT_ICONS: Record<string, string> = {megacredits: 'megacredit', steel: 'steel', titanium: 'titanium', heat: 'heat', plants: 'plant', microbes: 'microbe', floaters: 'floater'};

// Standard projects of the base game: what they bring besides their price (paid as payment)
const STANDARD_PROJECT_GAINS: Record<string, ReadonlyArray<LogEffect>> = {
  'Power Plant': [{resource: 'power', amount: 1, production: true}],
  'Asteroid': [{resource: 'tr', amount: 1}],
  'Aquifer': [{tile: 'ocean', amount: 1}, {resource: 'tr', amount: 1}],
  'Greenery': [{tile: 'greenery', amount: 1}, {resource: 'tr', amount: 1}],
  'City': [{tile: 'city', amount: 1}, {resource: 'megacredit', amount: 1, production: true}],
};

const CONVERSIONS: Record<string, ReadonlyArray<LogEffect>> = {
  // 8 plants without discounts (Ecoline pays 7): close enough for a quick look
  'Convert plants': [{resource: 'plant', amount: -8}, {tile: 'greenery', amount: 1}, {resource: 'tr', amount: 1}],
  'Convert heat': [{resource: 'heat', amount: -8}, {resource: 'tr', amount: 1}],
};

function payment(move: DecisionMove): Array<LogEffect> {
  return Object.entries(move.payment ?? {})
    .filter(([key, amount]) => PAYMENT_ICONS[key] !== undefined && amount > 0)
    .map(([key, amount]) => ({resource: PAYMENT_ICONS[key], amount: -amount, cost: true}));
}

// Fixed effects of playing the card (CardPlayEffect, exported with the card data)
function cardEffects(cardName: string | undefined): Array<LogEffect> {
  return [...(cardName === undefined ? undefined : getCard(cardName as CardName)?.playEffects) ?? []];
}

/** Gains first (production, tiles, TR), costs last, as in the game log rows */
export function moveEffects(move: DecisionMove, kind: string): Array<LogEffect> {
  if (kind === 'research') {
    const count = move.cards?.length ?? 0;
    return count === 0 ? [] : [{resource: 'card', amount: count}, {resource: 'megacredit', amount: -3 * count, cost: true}];
  }
  if (move.kind === 'payment') {
    return payment(move);
  }
  if (move.kind === 'projectCard') {
    return [...cardEffects(move.card), ...payment(move)];
  }
  if (move.kind !== 'menu') {
    return [];
  }
  switch (move.option) {
  case 'Play project card': return [...cardEffects(move.card), ...payment(move)];
  case 'Standard projects': return [...STANDARD_PROJECT_GAINS[move.project ?? ''] ?? [], ...payment(move)];
  case 'Sell patents': {
    const count = move.cards?.length ?? 0;
    return [{resource: 'megacredit', amount: count}, {resource: 'card', amount: -count}];
  }
  case 'Claim a milestone': return [{resource: 'megacredit', amount: -8, cost: true}];
  default: return [...CONVERSIONS[move.option ?? ''] ?? []];
  }
}

/** Card type of the move's card for the coloured stripe of the game log (none: no card) */
export function moveCardType(move: DecisionMove, kind: string): CardType | undefined {
  const card = move.kind === 'menu' ? move.card ?? (move.option === 'Perform an action from a played card' ? move.cards?.[0] : undefined) :
    kind === 'draft' ? move.cards?.[0] : undefined;
  return card === undefined ? undefined : getCard(card as CardName)?.type;
}

// Order of stock and production in the record's player snapshot (Rust core: M€, steel, titanium, plants, energy, heat)
const SNAPSHOT_ICONS = ['megacredit', 'steel', 'titanium', 'plant', 'power', 'heat'];

/**
 * What the played move really changed for its player, from the state before it and at the next decision: includes
 * discounts, triggered effects and counted effects that the card data alone does not tell.
 */
export function playedChanges(move: DecisionMove, before: DecisionPlayer, after: DecisionPlayer | undefined): Array<LogEffect> {
  if (after === undefined) {
    return [];
  }
  const effects: Array<LogEffect> = [];
  const add = (amount: number, effect: Omit<LogEffect, 'amount'>) => {
    if (amount !== 0) {
      effects.push({...effect, amount});
    }
  };
  SNAPSHOT_ICONS.forEach((resource, index) => add((after.production[index] ?? 0) - (before.production[index] ?? 0), {resource, production: true}));
  add(after.tr - before.tr, {resource: 'tr'});
  // Gains before losses, as in the game log
  const stock = SNAPSHOT_ICONS.map((resource, index) => ({resource, amount: (after.stock[index] ?? 0) - (before.stock[index] ?? 0)})).filter((entry) => entry.amount !== 0);
  stock.filter((entry) => entry.amount > 0).forEach((entry) => effects.push(entry));
  // The played card itself leaves the hand: the game log does not count that as losing a card
  const played = move.kind === 'menu' && move.option === 'Play project card' ? 1 : 0;
  add(after.hand.length - before.hand.length + played, {resource: 'card'});
  stock.filter((entry) => entry.amount < 0).forEach((entry) => effects.push({...entry, cost: true}));
  return effects;
}
