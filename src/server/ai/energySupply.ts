import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {CardName} from '../../common/cards/CardName';

// Cards whose action spends energy (Physics Complex 6, Ironworks 4, Steelworks 4, Water Splitting Plant 3,
// Teslaract, Development Center …) only pay off with enough energy production. A player in a test game
// on the public server: "you need to restrict AI playing these cards which need energy – when it plays
// them, it has no energy production at all". In the recorded games the AI played Physics Complex and
// Ironworks in generation 5 with 1 energy production and never used either; a card in play counted a flat
// action value per generation, energy or not.
//
// The energy an action needs is read from the card's icon row (energy before the action arrow), so every
// such card is covered without a card list.

type Token = {type?: string, amount?: number, rows?: unknown};

function tokens(node: unknown, out: Array<Token> = []): Array<Token> {
  if (Array.isArray(node)) {
    node.forEach((child) => tokens(child, out));
  } else if (node !== null && typeof node === 'object') {
    const item = node as Token;
    if (item.rows !== undefined) {
      tokens(item.rows, out);
    } else {
      out.push(item);
    }
  }
  return out;
}

const needCache = new Map<CardName, number>();

/** Energy one use of the card's action spends (0 for cards without such an action). */
export function energyPerAction(card: ICard): number {
  const cached = needCache.get(card.name);
  if (cached !== undefined) {
    return cached;
  }
  const list = tokens(card.metadata?.renderData);
  let need = 0;
  list.forEach((token, index) => {
    if (token.type !== '->') {
      return;
    }
    const energy = list.slice(Math.max(0, index - 3), index).find((before) => before.type === 'energy');
    if (energy !== undefined) {
      need = Math.max(need, energy.amount ?? 1);
    }
  });
  needCache.set(card.name, need);
  return need;
}

/**
 * Share of the action's energy the player can supply each generation (0–1): energy production after the
 * other energy actions already in play, plus the stored energy spread over the remaining generations.
 */
export function energySupplyRatio(player: IPlayer, card: ICard, remaining: number): number {
  const need = energyPerAction(card);
  if (need === 0) {
    return 1;
  }
  let otherNeeds = 0;
  for (const played of player.playedCards) {
    if (played.name !== card.name) {
      otherNeeds += energyPerAction(played);
    }
  }
  const production = Math.max(0, player.production.energy - otherNeeds);
  const supply = production + player.energy / Math.max(1, remaining);
  return Math.max(0, Math.min(1, supply / need));
}
