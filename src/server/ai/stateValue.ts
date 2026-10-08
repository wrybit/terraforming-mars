import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {CardName} from '../../common/cards/CardName';
import {PlayerId} from '../../common/Types';
import {CardType} from '../../common/cards/CardType';
import {isIActionCard} from '../cards/ICard';
import {isTemperatureMaxed, remainingProductionPhases, terraformingProgress, victoryPointValue} from './gameProgress';
import {boardPotential} from './boardPotential';
import {milestoneRacePoints} from './milestoneRace';

// Values a player's whole position in M€ equivalents. The AI compares these values between
// copies of the game in which different moves were made. Weights: docs/ai/bot-heuristics.md §1.

// Future income is worth about half of money in hand (experts: 1 M€ production ≈ 5 M€ in
// generation 1, ≈ 2 M€ late). A higher value made the AI buy production far too dearly.
const PRODUCTION_DISCOUNT = 0.55;
// In the last generation money only counts for what it can still buy: VP. Kept a little
// above 0 so the AI does not throw money at worthless moves.
const MONEY_VALUE_IN_LAST_GENERATION = 0.3;
// Money beyond a working reserve has no card to go into; it is only worth what standard
// projects turn it into later. Without this the AI hoarded 200 M€ and passed.
const MONEY_RESERVE = 30;
const EXCESS_MONEY_VALUE = 0.7;
const HAND_CARD_VALUE = 2;
// An action or effect card keeps paying off every generation it stays in play.
const ACTION_CARD_VALUE_PER_GENERATION = 1.5;
const EFFECT_CARD_VALUE_PER_GENERATION = 1;
// Opponents' gains count against us, but less than our own (we want to win, not to hurt).
const OPPONENT_WEIGHT = 0.5;
// Without this, adding a microbe was worth nothing and the AI passed instead.
const RESOURCE_ON_CARD_VALUE = 0.8;

/**
 * Game-phase numbers frozen at decision time. Copies that run into the next generation must
 * not look better just because a VP became more expensive there.
 */
export type ValuationContext = {
  generation: number,
  remaining: number,
  victoryPoint: number,
  temperatureMaxed: boolean,
  /** How much a current award lead is worth as final VP (leads early in the game rarely hold). */
  awardConfidence: number,
  /** Value of each hand card of `handOwner` when kept for later (others count HAND_CARD_VALUE). */
  handValues?: ReadonlyMap<CardName, number>,
  handOwner?: PlayerId,
};

/**
 * Award VP are only certain at game end. Strong players fund between half and two thirds of
 * the game: before half the terraforming a lead counts nothing, then it grows to full value
 * at about 75 % (the AI funded awards in generation 1 and later still too early).
 */
function awardConfidence(progress: number): number {
  return Math.max(0, Math.min(1, (progress - 0.5) / 0.25));
}

/**
 * Expected VP from funded awards. A lead only counts as far as it is safe: the opponent can
 * still catch up while the game lasts, so a small lead is worth about a coin flip.
 */
function expectedAwardPoints(player: IPlayer, context: ValuationContext): number {
  let points = 0;
  for (const {award} of player.game.fundedAwards) {
    const own = award.getScore(player);
    const best = Math.max(0, ...player.opponents.map((opponent) => award.getScore(opponent)));
    const margin = own - best;
    // How much an opponent can still gain: more early, and more for awards with big numbers.
    const swing = 2 + Math.max(own, best) * 0.25 * (1 - context.awardConfidence);
    const firstPlaceChance = Math.max(0, Math.min(1, 0.5 + margin / (2 * swing)));
    points += 5 * firstPlaceChance * context.awardConfidence;
  }
  return points;
}

export function valuationContext(game: IGame): ValuationContext {
  return {
    generation: game.generation,
    remaining: remainingProductionPhases(game),
    victoryPoint: victoryPointValue(game),
    temperatureMaxed: isTemperatureMaxed(game),
    awardConfidence: awardConfidence(terraformingProgress(game)),
  };
}

/** Same context, but production phases that already happened inside a copy no longer count. */
function contextFor(game: IGame, context: ValuationContext): ValuationContext {
  const elapsed = Math.max(0, game.generation - context.generation);
  return {...context, remaining: Math.max(0, context.remaining - elapsed)};
}

function productionValue(player: IPlayer, context: ValuationContext): number {
  const production = player.production;
  const heatFactor = context.temperatureMaxed ? 0.2 : 0.8;
  const perGeneration =
    production.megacredits * 1 +
    production.steel * 1.6 +
    production.titanium * 2.5 +
    production.plants * 2 +
    production.energy * 1.1 + // energy mostly ends up as heat
    production.heat * heatFactor;
  return perGeneration * context.remaining * PRODUCTION_DISCOUNT;
}

function resourceValue(player: IPlayer, context: ValuationContext): number {
  const heatValue = context.temperatureMaxed ? 0 : 0.9;
  const money = context.remaining > 0 ? 1 : MONEY_VALUE_IN_LAST_GENERATION;
  const megaCredits = Math.min(player.megaCredits, MONEY_RESERVE) + Math.max(0, player.megaCredits - MONEY_RESERVE) * EXCESS_MONEY_VALUE;
  return megaCredits * money +
    player.steel * player.getSteelValue() * 0.8 * money +
    player.titanium * player.getTitaniumValue() * 0.8 * money +
    player.plants * 1.5 +
    player.heat * heatValue +
    player.energy * 0.5;
}

function tableauValue(player: IPlayer, context: ValuationContext): number {
  let value = 0;
  for (const card of player.playedCards) {
    if (card.type === CardType.ACTIVE) {
      const perGeneration = isIActionCard(card) ? ACTION_CARD_VALUE_PER_GENERATION : EFFECT_CARD_VALUE_PER_GENERATION;
      value += perGeneration * context.remaining;
    }
    // Resources on cards (microbes, animals, science …) pay off later: VP, money, actions.
    value += card.resourceCount * RESOURCE_ON_CARD_VALUE;
    value += partialResourcePoints(card) * context.victoryPoint;
  }
  return value;
}

/**
 * VP cards like Tardigrades (1 VP per 4 microbes) only score whole points; the step between
 * them was invisible, so adding a microbe looked worth 0.8 M€ and a small misjudgement made the
 * AI pass instead (seen in the decision traces of the test batches).
 */
function partialResourcePoints(card: {victoryPoints?: unknown, resourceCount: number}): number {
  const points = card.victoryPoints;
  if (typeof points !== 'object' || points === null || !('resourcesHere' in points)) {
    return 0;
  }
  const {each = 1, per = 1} = points as {each?: number, per?: number};
  const exact = card.resourceCount * each / per;
  // The whole points are already part of the VP total.
  return exact - Math.floor(card.resourceCount / per) * each;
}

function handValue(player: IPlayer, context: ValuationContext): number {
  if (context.remaining === 0) {
    return 0;
  }
  if (context.handOwner !== player.id || context.handValues === undefined) {
    return player.cardsInHand.length * HAND_CARD_VALUE;
  }
  const values = context.handValues;
  return player.cardsInHand.reduce((sum, card) => sum + (values.get(card.name) ?? HAND_CARD_VALUE), 0);
}

/** Absolute value of one player's position. */
export function playerValue(player: IPlayer, frozen: ValuationContext): number {
  const context = contextFor(player.game, frozen);
  const victoryPoints = player.getVictoryPoints();
  const expectedVictoryPoints = victoryPoints.total - victoryPoints.awards + expectedAwardPoints(player, context) +
    milestoneRacePoints(player);
  // Board VP still to come count only while there is time to realise them.
  const boardTime = Math.min(1, context.remaining / 3);
  return (expectedVictoryPoints + boardPotential(player) * boardTime) * context.victoryPoint +
    player.terraformRating * context.remaining * PRODUCTION_DISCOUNT + // TR is income every production phase
    productionValue(player, context) +
    resourceValue(player, context) +
    handValue(player, context) +
    tableauValue(player, context);
}

/** Own value minus a share of the opponents' average: the number the AI maximises. */
export function relativeValue(player: IPlayer, context: ValuationContext): number {
  const opponents = player.opponents;
  const own = playerValue(player, context);
  if (opponents.length === 0) {
    return own;
  }
  const opponentAverage = opponents.reduce((sum, opponent) => sum + playerValue(opponent, context), 0) / opponents.length;
  return own - OPPONENT_WEIGHT * opponentAverage;
}
