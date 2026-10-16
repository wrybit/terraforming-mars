import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {isIProjectCard} from '../cards/IProjectCard';
import {maximumExceeded} from './requirementOutlook';
import {remainingProductionPhases} from './gameProgress';

// Which hand cards go first when cards must be discarded (Jens' order, 2026-10-16):
// 1. cards whose maximum requirement is exceeded (can never be played again)
// 2. cards with negative VP that bring little
// 3. cards with little impact
// 4. attack cards whose targets do not meet the condition (they bring little now)
// 5. cards without VP
// 6. cards with VP – kept longest; cards that collect their VP (animals, microbes) only if the rest of the game
//    still fills them to about 3 VP (card + purchase ≈ 23 M€ pay off from 3–4 VP). Tardigrades needs 4 generations per
//    VP, so late in the game they are low-impact cards (Jens, 2026-10-16).
// Within a group the lower card value goes first.

// Below this value (M€) a card has "little impact".
const LOW_VALUE = 3;
// A collecting card is a VP card when the rest of the game brings it at least this many VP.
const WORTHWHILE_COLLECTED_POINTS = 3;
// Resources a collecting card gains per generation from its own action (other feeders not counted).
const COLLECTED_PER_GENERATION = 1;

/** Behaviour that acts on another player (remove plants, lower production, steal resources). */
function attacksOpponents(card: ICard): boolean {
  return /"(decreaseAnyProduction|removeAnyPlants|stealResource|removeAnyResource)"/.test(JSON.stringify(card.behavior ?? {}));
}

/**
 * VP the card is worth for keeping: printed VP, or for cards collecting resources (1 VP per `per` resources) what
 * the remaining generations still bring – fewer than WORTHWHILE_COLLECTED_POINTS count as a card without VP.
 */
function victoryPointsOf(card: ICard, player: IPlayer): number | undefined {
  const points = card.victoryPoints;
  if (typeof points === 'number' || points === undefined) {
    return points;
  }
  if (typeof points === 'object' && 'resourcesHere' in points) {
    const per = typeof points.per === 'number' && points.per > 0 ? points.per : 1;
    // Actions in this generation and every remaining one
    const generations = remainingProductionPhases(player.game, player) + 1;
    const collected = Math.floor(((card.resourceCount ?? 0) + COLLECTED_PER_GENERATION * generations) / per);
    return collected >= WORTHWHILE_COLLECTED_POINTS ? collected : 0;
  }
  // Other variable VP (per tag, per tile …): counted as a VP card
  return 1;
}

/** Discard group 1–6 (lower goes first). */
export function discardGroup(card: ICard, player: IPlayer, value: number): number {
  const points = victoryPointsOf(card, player);
  if (isIProjectCard(card) && maximumExceeded(card, player)) {
    return 1;
  }
  if (points !== undefined && points < 0 && value < LOW_VALUE) {
    return 2;
  }
  if (value < LOW_VALUE && !attacksOpponents(card) && (points === undefined || points <= 0)) {
    return 3;
  }
  if (attacksOpponents(card) && value < LOW_VALUE) {
    return 4;
  }
  return points === undefined || points <= 0 ? 5 : 6;
}

/** Hand cards in discard order: group, then value. */
export function discardOrder<T extends ICard>(cards: ReadonlyArray<T>, player: IPlayer, valueOf: (card: T) => number): Array<T> {
  const keyed = cards.map((card) => ({card, value: valueOf(card), group: discardGroup(card, player, valueOf(card))}));
  return keyed.sort((a, b) => a.group - b.group || a.value - b.value).map((entry) => entry.card);
}
