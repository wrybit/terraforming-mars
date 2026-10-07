import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {CardType} from '../../common/cards/CardType';
import {isIActionCard} from '../cards/ICard';
import {isTemperatureMaxed, remainingProductionPhases, victoryPointValue} from './gameProgress';

// Values a player's whole position in M€ equivalents. The AI compares these values between
// copies of the game in which different moves were made. Weights: docs/ai/bot-heuristics.md §1.

const PRODUCTION_DISCOUNT = 0.9;
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
};

export function valuationContext(game: IGame): ValuationContext {
  return {
    generation: game.generation,
    remaining: remainingProductionPhases(game),
    victoryPoint: victoryPointValue(game),
    temperatureMaxed: isTemperatureMaxed(game),
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
    production.energy * 1.5 +
    production.heat * heatFactor;
  return perGeneration * context.remaining * PRODUCTION_DISCOUNT;
}

function resourceValue(player: IPlayer, context: ValuationContext): number {
  const heatValue = context.temperatureMaxed ? 0 : 0.9;
  return player.megaCredits +
    player.steel * player.getSteelValue() * 0.8 +
    player.titanium * player.getTitaniumValue() * 0.8 +
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
  return player.getVictoryPoints().total * context.victoryPoint +
    player.terraformRating * context.remaining + // TR is income every production phase
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
