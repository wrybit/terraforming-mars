import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {CardName} from '../../common/cards/CardName';
import {PlayerId} from '../../common/Types';
import {CardType} from '../../common/cards/CardType';
import {ICard, isIActionCard} from '../cards/ICard';
import {isTemperatureMaxed, remainingProductionPhases, stepsLeft, terraformingProgress, victoryPointValue} from './gameProgress';
import {tuningOf} from './aiTuning';
import {boardPotential} from './boardPotential';
import {milestoneRacePoints} from './milestoneRace';
import {recentAwardGrowth} from './awardHistory';

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
  /** Global steps left at decision time (for the tempo term). */
  stepsLeft?: number,
  /** Tempo: production phases shrink as the copy raises global parameters (aiTuning.ts tempoAware). */
  tempo?: boolean,
  /** Share of future income counted now (aiTuning.ts productionDiscount); default PRODUCTION_DISCOUNT. */
  productionDiscount?: number,
  /** Award lead uncertainty of the deciding player (aiTuning.ts awardSwing), the same for both sides' awards. */
  awardSwing?: number,
  /** Award leads are projected to the game end by each player's pace so far (aiTuning.ts awardTiming). */
  awardTiming?: boolean,
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
    const trend = tuningOf(player).awardTrend > 0;
    const own = projectedAwardScore(award.getScore(player), context, trend ? awardGrowth(player, award.name) : undefined);
    const best = Math.max(0, ...player.opponents.map((opponent) =>
      projectedAwardScore(award.getScore(opponent), context, trend ? awardGrowth(opponent, award.name) : undefined)));
    const margin = own - best;
    // How much an opponent can still gain: more early, and more for awards with big numbers.
    // awardSwing: plus a share of the score per remaining generation – Jens overtook three funded
    // awards in the last 4 generations (Banker 10 → 33, Miner 5 → 24) while the AI felt safe.
    // The deciding player's view for both sides: own leads and the opponent's leads are equally
    // uncertain, so catching up in an award the opponent leads is worth as much as defending one.
    const remainingSwing = (context.awardSwing ?? tuningOf(player).awardSwing) * Math.max(own, best) * context.remaining;
    const swing = 2 + Math.max(own, best) * 0.25 * (1 - context.awardConfidence) + remainingSwing;
    const firstPlaceChance = Math.max(0, Math.min(1, 0.5 + margin / (2 * swing)));
    points += 5 * firstPlaceChance * context.awardConfidence;
  }
  return points;
}

/** `player`: whose AI variant decides (its expected game length, aiTuning.ts lengthByPlayers). */
/**
 * Award score at the game end: the current score grows at the pace of the generations so far.
 * Without it the AI funded Landlord and Miner in generations 13 and 14 with a small lead that
 * looked safe ("terraforming almost done"); the game ran 3 more generations and the human, whose
 * tiles and steel/titanium grew much faster, won both (10 VP for him).
 */
function projectedAwardScore(score: number, context: ValuationContext, recentGrowth?: number): number {
  // Recent growth (awardHistory.ts): a score that only now takes off grows faster than its average.
  const byTrend = recentGrowth === undefined ? score : score + Math.max(0, recentGrowth) * context.remaining;
  if (context.awardTiming !== true) {
    return byTrend;
  }
  const elapsed = Math.max(1, context.generation - 1);
  return Math.max(byTrend, score * (elapsed + context.remaining) / elapsed);
}

function awardGrowth(player: IPlayer, awardName: string): number | undefined {
  const award = player.game.fundedAwards.find((funded) => funded.award.name === awardName)?.award;
  return award === undefined ? undefined : recentAwardGrowth(player.game.id, awardName, player.id, player.game.generation, award.getScore(player));
}

export function valuationContext(game: IGame, player?: IPlayer): ValuationContext {
  return {
    generation: game.generation,
    remaining: remainingProductionPhases(game, player),
    victoryPoint: victoryPointValue(game, player) * (player === undefined ? 1 : tuningOf(player).victoryPointScale),
    temperatureMaxed: isTemperatureMaxed(game),
    awardConfidence: awardConfidence(terraformingProgress(game)),
    stepsLeft: stepsLeft(game),
  };
}

/** Same context, but production phases that already happened inside a copy no longer count. */
function contextFor(game: IGame, context: ValuationContext): ValuationContext {
  const elapsed = Math.max(0, game.generation - context.generation);
  let remaining = Math.max(0, context.remaining - elapsed);
  // Every step raised brings the end closer: production of everybody is worth less. Who has the
  // stronger engine wants a long game, who leads wants to end it (a human kept terraforming slow
  // and won 198 : 93 with two huge last generations).
  if (context.tempo === true && context.stepsLeft !== undefined && context.remaining > 0) {
    const raised = Math.max(0, context.stepsLeft - stepsLeft(game));
    const stepsPerGeneration = Math.max(1, context.stepsLeft / context.remaining);
    remaining = Math.max(0, remaining - raised / stepsPerGeneration);
  }
  return {...context, remaining};
}

/** M€ value of one generation of production (before the discount). */
function productionPerGeneration(player: IPlayer, context: ValuationContext): number {
  const production = player.production;
  const heatFactor = context.temperatureMaxed ? 0.2 : 0.8;
  return production.megacredits * 1 +
    production.steel * 1.6 +
    production.titanium * 2.5 +
    production.plants * tuningOf(player).plantProductionValue +
    production.energy * 1.1 + // energy mostly ends up as heat
    production.heat * heatFactor;
}

function productionValue(player: IPlayer, context: ValuationContext): number {
  return productionPerGeneration(player, context) * context.remaining * (context.productionDiscount ?? PRODUCTION_DISCOUNT);
}

/**
 * What one more production phase is worth to a player: income (production and TR) plus what
 * action and effect cards bring per generation. The "engine" in the closer term below.
 */
function engineFlow(player: IPlayer, context: ValuationContext): number {
  let cards = 0;
  for (const card of player.playedCards) {
    if (card.type === CardType.ACTIVE) {
      cards += isIActionCard(card) ? ACTION_CARD_VALUE_PER_GENERATION : EFFECT_CARD_VALUE_PER_GENERATION;
    }
  }
  return (productionPerGeneration(player, context) + player.terraformRating) * (context.productionDiscount ?? PRODUCTION_DISCOUNT) + cards;
}

/**
 * Closer (aiTuning.ts closer): raising global steps cuts production phases for everybody. The
 * final margin to the strongest rival then changes by the cut × (own engine − rival engine), with
 * full weight – it is a race. So the AI pushes the end when the rival's engine grows faster and
 * slows down when its own does. The old 'tempo' variant shrank every value with the (smaller)
 * opponent weight, so any raise looked like a loss and the AI terraformed less (z −1.81).
 */
/** Global steps raised in a copy since the decision (0 without a frozen step count). */
function stepsRaised(player: IPlayer, frozen: ValuationContext): number {
  return frozen.stepsLeft === undefined ? 0 : Math.max(0, frozen.stepsLeft - stepsLeft(player.game));
}

function closerTerm(player: IPlayer, frozen: ValuationContext): number {
  if (frozen.stepsLeft === undefined || frozen.remaining <= 0 || player.opponents.length === 0) {
    return 0;
  }
  const raised = stepsRaised(player, frozen);
  if (raised === 0) {
    return 0;
  }
  const generationsCut = Math.min(frozen.remaining, raised / Math.max(1, frozen.stepsLeft / frozen.remaining));
  const context = contextFor(player.game, frozen);
  // The rival is the opponent with the best position, not the one with the biggest engine.
  let rival = player.opponents[0];
  let rivalValue = playerValue(rival, frozen);
  for (const opponent of player.opponents.slice(1)) {
    const value = playerValue(opponent, frozen);
    if (value > rivalValue) {
      rival = opponent;
      rivalValue = value;
    }
  }
  return generationsCut * (engineFlow(rival, context) - engineFlow(player, context));
}

// Last generation: money is only worth what it still buys. The cheapest VP is a greenery standard
// project; a greenery not yet bought counts 0.6 VP so that buying it (1 VP + neighbours) stays better.
const GREENERY_PROJECT_COST = 23;
const UNBOUGHT_GREENERY_SHARE = 0.6;
const LEFTOVER_MONEY_VALUE = 0.1;

/**
 * M€ value of money in the last generation as steps of greeneries it can still buy (Jens: "sell
 * what does not change the game any more and buy one more greenery from it"). Once Mars is
 * terraformed the hand counts as 1 M€ per card, as it can be sold.
 */
function lastGenerationMoneyValue(player: IPlayer, context: ValuationContext): number {
  const sellable = player.game.marsIsTerraformed() ? player.cardsInHand.length : 0;
  const money = player.megaCredits + sellable;
  const greeneries = Math.floor(money / GREENERY_PROJECT_COST);
  return greeneries * UNBOUGHT_GREENERY_SHARE * context.victoryPoint + (money - greeneries * GREENERY_PROJECT_COST) * LEFTOVER_MONEY_VALUE;
}

function resourceValue(player: IPlayer, context: ValuationContext): number {
  const heatValue = context.temperatureMaxed ? 0 : 0.9;
  const money = context.remaining > 0 ? 1 : MONEY_VALUE_IN_LAST_GENERATION;
  const megaCredits = Math.min(player.megaCredits, MONEY_RESERVE) + Math.max(0, player.megaCredits - MONEY_RESERVE) * EXCESS_MONEY_VALUE;
  const moneyValue = context.remaining === 0 && tuningOf(player).endgameMoney > 0 ? lastGenerationMoneyValue(player, context) : megaCredits * money;
  return moneyValue +
    player.steel * player.getSteelValue() * 0.8 * money +
    player.titanium * player.getTitaniumValue() * 0.8 * money +
    player.plants * 1.5 +
    player.heat * heatValue +
    player.energy * 0.5;
}

/**
 * VP a collector card (Birds, Fish, Tardigrades, Ecological Zone …) adds per generation, about
 * one resource each: its VP per resource. 0 for other cards.
 */
function collectedPointsPerGeneration(card: {victoryPoints?: unknown}): number {
  const points = card.victoryPoints;
  if (typeof points !== 'object' || points === null || !('resourcesHere' in points)) {
    return 0;
  }
  const {each = 1, per = 1} = points as {each?: number, per?: number};
  return each / per;
}

/** Value of a card in hand whose own value is unknown (drawn in a copy, opponents' cards). */
function unknownCardValue(player: IPlayer, context: ValuationContext): number {
  if (tuningOf(player).drawCardModel === 0) {
    return HAND_CARD_VALUE;
  }
  // Early a card is an option worth more than its 3 M€ price, late only what can still be played
  // (bot-heuristics.md §1: 3.5 early, 2 late).
  return Math.min(4, 2 + 0.2 * context.remaining);
}

/** Cards an action draws per use (AI Central 2, Development Center 1 …), 0 for other actions. */
function cardsDrawnByAction(card: ICard): number {
  const drawCard = (card as {actionBehavior?: {drawCard?: number | {count: unknown, pay?: boolean, keep?: number}}}).actionBehavior?.drawCard;
  if (drawCard === undefined) {
    return 0;
  }
  if (typeof drawCard === 'number') {
    return drawCard;
  }
  const count = typeof drawCard.count === 'number' ? drawCard.count : 1;
  // Paying for the card (Inventors' Guild) or keeping one of several leaves part of the value.
  const kept = drawCard.keep ?? count;
  return drawCard.pay === true ? kept * 0.4 : kept;
}

/** What an action card brings per generation it stays in play. */
function actionValuePerGeneration(card: ICard, player: IPlayer, context: ValuationContext): number {
  const drawn = tuningOf(player).drawCardModel > 0 ? cardsDrawnByAction(card) : 0;
  return Math.max(ACTION_CARD_VALUE_PER_GENERATION, drawn * unknownCardValue(player, context));
}

function tableauValue(player: IPlayer, context: ValuationContext): number {
  const accumulator = tuningOf(player).accumulatorValue;
  let value = 0;
  for (const card of player.playedCards) {
    if (card.type === CardType.ACTIVE) {
      const flat = isIActionCard(card) ? actionValuePerGeneration(card, player, context) : EFFECT_CARD_VALUE_PER_GENERATION;
      // Martin's collectors scored 20+ VP in long games; a flat 1.5 M€ per generation missed that.
      const collected = accumulator > 0 ? accumulator * collectedPointsPerGeneration(card) * context.victoryPoint : 0;
      value += Math.max(flat, collected) * context.remaining;
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
    // Expected last generation, but the game only ends for sure once Mars is terraformed. Jens vs.
    // hard: one ocean was missing, the AI took generation 14 as the last one, sold Terraforming
    // Ganymede, Giant Ice Asteroid and Io Mining Industries – and nobody placed the ocean.
    // Then the cards count with their value played now (cardValue.ts handCardValues).
    if (tuningOf(player).keepHandUntilEnd === 0 || player.game.marsIsTerraformed()) {
      return 0;
    }
  }
  if (context.handOwner !== player.id || context.handValues === undefined) {
    return player.cardsInHand.length * unknownCardValue(player, context);
  }
  const values = context.handValues;
  const unknown = unknownCardValue(player, context);
  return player.cardsInHand.reduce((sum, card) => sum + (values.get(card.name) ?? unknown), 0);
}

/** Absolute value of one player's position. */
export function playerValue(player: IPlayer, frozen: ValuationContext): number {
  const context = contextFor(player.game, frozen);
  const victoryPoints = player.getVictoryPoints();
  const expectedVictoryPoints = victoryPoints.total - victoryPoints.awards + expectedAwardPoints(player, context) +
    milestoneRacePoints(player);
  // Board VP still to come count only while there is time to realise them.
  const boardTime = Math.min(1, context.remaining / tuningOf(player).boardHorizon);
  return (expectedVictoryPoints + boardPotential(player) * boardTime) * context.victoryPoint +
    player.terraformRating * context.remaining * (context.productionDiscount ?? PRODUCTION_DISCOUNT) + // TR is income every production phase
    productionValue(player, context) +
    resourceValue(player, context) +
    handValue(player, context) +
    tableauValue(player, context);
}

/** Own value minus a share of the opponents' average: the number the AI maximises. */
export function relativeValue(player: IPlayer, frozen: ValuationContext): number {
  const tuning = tuningOf(player);
  const context = {...frozen, tempo: tuning.tempoAware > 0 || frozen.tempo, awardTiming: tuning.awardTiming > 0 || frozen.awardTiming,
    productionDiscount: frozen.productionDiscount ?? tuning.productionDiscount, awardSwing: frozen.awardSwing ?? tuning.awardSwing};
  const opponents = player.opponents;
  const own = playerValue(player, context);
  if (opponents.length === 0) {
    return own;
  }
  const opponentAverage = opponents.reduce((sum, opponent) => sum + playerValue(opponent, context), 0) / opponents.length;
  // Two players: every point of the opponent counts as much as an own one (aiTuning.ts).
  const weight = opponents.length === 1 ? tuning.opponentWeightTwoPlayers : OPPONENT_WEIGHT;
  const closer = tuning.closer > 0 ? tuning.closer * closerTerm(player, frozen) : 0;
  return own - weight * opponentAverage + closer - tuning.terraformBrake * stepsRaised(player, frozen);
}
