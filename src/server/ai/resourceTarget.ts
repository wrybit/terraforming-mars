import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {cardPrior} from './cardPriors';

// Which card a resource goes onto or comes off. The quick rule sorted by "has victory points" and then by the
// card statistics, whatever the move was: Ants removed a microbe from itself (net nothing) instead of from an
// opponent, and Mohole Lake put the last-generation animal on Tardigrades (1 VP per 4) instead of Venusian
// Animals (1 VP each). Removing now hurts the opponent most; adding goes where one more resource scores most.

/** The player whose tableau holds the card, undefined if nobody's. */
function ownerOf(card: ICard, player: IPlayer): IPlayer | undefined {
  // The tableau holds corporations and project cards alike.
  return player.game.players.find((candidate) => candidate.tableau.has(card.name));
}

/** Resources needed per VP for cards that score per resource here ("1 VP per 4 microbes"), undefined otherwise. */
function resourcesPerPoint(card: ICard): {each: number, per: number} | undefined {
  const points = card.victoryPoints;
  if (typeof points !== 'object' || points === null || !('resourcesHere' in points)) {
    return undefined;
  }
  const {each = 1, per = 1} = points as {each?: number, per?: number};
  return {each, per};
}

/**
 * VP the owner gains (positive) or loses (negative) when `delta` resources are added to the card. A step that
 * does not cross the next VP threshold still counts its share (3 of 4 microbes is closer to a VP than 2).
 */
export function resourcePointChange(card: ICard, owner: IPlayer, delta: number): number {
  const before = card.resourceCount;
  const pointsBefore = card.getVictoryPoints(owner);
  card.resourceCount = Math.max(0, before + delta);
  const pointsAfter = card.getVictoryPoints(owner);
  card.resourceCount = before;
  const exact = pointsAfter - pointsBefore;
  if (exact !== 0) {
    return exact;
  }
  const rate = resourcesPerPoint(card);
  if (rate === undefined || (delta < 0 && before === 0)) {
    return 0;
  }
  // Fractional share: how close the step brings the next VP (adding) or how far it sets it back (removing).
  return delta * rate.each / rate.per;
}

/** Whether the card choice is about adding or removing resources, judged by its title. */
export function resourceChoiceKind(title: string): 'add' | 'remove' | undefined {
  const lower = title.toLowerCase();
  if (!lower.includes('card')) {
    return undefined;
  }
  if (lower.includes('remove')) {
    return 'remove';
  }
  if (lower.includes(' add ') || lower.startsWith('add ') || lower.includes('to add')) {
    return 'add';
  }
  return undefined;
}

/**
 * Cards of a resource choice in the order the AI wants them. Removing: opponents' cards first, the biggest VP loss
 * for them first (then the most resources); own cards last, the smallest own VP loss first. Adding: the biggest
 * own VP gain first, then the card statistics.
 */
export function orderResourceTargets<T extends ICard>(cards: ReadonlyArray<T>, player: IPlayer, kind: 'add' | 'remove', amount = 1): Array<T> {
  const scored = cards.map((card) => {
    const owner = ownerOf(card, player) ?? player;
    const own = owner.id === player.id;
    const change = resourcePointChange(card, owner, kind === 'add' ? amount : -amount);
    // Higher is better for the deciding player.
    const score = own ? change : -change;
    return {card, score, own};
  });
  if (kind === 'remove') {
    scored.sort((a, b) => Number(a.own) - Number(b.own) || b.score - a.score || b.card.resourceCount - a.card.resourceCount);
  } else {
    scored.sort((a, b) => b.score - a.score || cardPrior(b.card.name) - cardPrior(a.card.name));
  }
  return scored.map((entry) => entry.card);
}
