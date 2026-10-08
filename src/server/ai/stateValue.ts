import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {CardType} from '../../common/cards/CardType';
import {isIActionCard} from '../cards/ICard';
import {isTemperatureMaxed, remainingProductionPhases, terraformingProgress, victoryPointValue} from './gameProgress';

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
};

/**
 * Award VP are only certain at game end. Before half the terraforming is done a lead counts
 * nothing (the AI funded awards in generation 1 and lost them), then confidence grows to 1.
 */
function awardConfidence(progress: number): number {
  return Math.max(0, Math.min(1, (progress - 0.5) / 0.4));
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
  }
  return value;
}

/** Absolute value of one player's position. */
export function playerValue(player: IPlayer, frozen: ValuationContext): number {
  const context = contextFor(player.game, frozen);
  const victoryPoints = player.getVictoryPoints();
  const expectedVictoryPoints = victoryPoints.total - victoryPoints.awards * (1 - context.awardConfidence);
  return expectedVictoryPoints * context.victoryPoint +
    player.terraformRating * context.remaining * PRODUCTION_DISCOUNT + // TR is income every production phase
    productionValue(player, context) +
    resourceValue(player, context) +
    player.cardsInHand.length * (context.remaining > 0 ? HAND_CARD_VALUE : 0) +
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
