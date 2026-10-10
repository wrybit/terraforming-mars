import {IPlayer} from '../IPlayer';
import {IGame} from '../IGame';
import {ICard} from '../cards/ICard';
import {IProjectCard, isIProjectCard} from '../cards/IProjectCard';
import {isICorporationCard} from '../cards/corporation/ICorporationCard';
import {CardName} from '../../common/cards/CardName';
import {CardType} from '../../common/cards/CardType';
import {newCard} from '../createCard';
import {finishMove, GameSnapshot, playerView, withCopy} from './gameCopy';
import {relativeValue, ValuationContext, valuationContext} from './stateValue';
import {cardPriorFactor} from './cardPriors';
import {closingWindowFactor, requirementOutlook} from './requirementOutlook';
import {pickSome} from './randomChoice';
import {engineValue} from './engineValue';
import {isSimulating} from './simulationSandbox';
import {tuningOf} from './aiTuning';

// What a card is worth to a player, played now and played later. The card is put into play on
// a copy of the game (ignoring requirements and cost) and the position is valued; the result is
// corrected by cost, requirement outlook and the BGA prior (docs/ai/bot-heuristics.md §2).
//
// "Later" looks several generations ahead: before the card is played, the copy gets a sample
// of random project cards as a stand-in for the cards the player will still play. Cards that
// grow with the tableau (e.g. Nitrogen-Rich Asteroid with 3 plant tags) are worth more later,
// production is worth less; holding a card is right when "later" beats "now".

export type CardTiming = {now: number, later: number};

// Holding a card is uncertain (the game may end, money may lack): later value counts 85 %.
const LATER_DISCOUNT = 0.85;

function playCard(copy: IGame, copyPlayer: IPlayer, name: CardName): void {
  const fresh = newCard(name);
  if (isICorporationCard(fresh)) {
    copyPlayer.playCorporationCard(fresh);
  } else {
    copyPlayer.playCard(fresh as IProjectCard);
  }
  copy.deferredActions.runAll(() => {});
  finishMove(copy, copyPlayer);
}

/** Plays a random sample of the remaining project cards: a guess at the player's future tableau. */
function playFutureTableau(copy: IGame, copyPlayer: IPlayer, count: number): void {
  for (const card of pickSome(Math.random, copy.projectDeck.drawPile, count)) {
    try {
      playCard(copy, copyPlayer, card.name);
    } catch {
      // some cards cannot be forced into play; the sample just gets smaller
    }
  }
  copyPlayer.clearWaitingFor();
}

function gainInCopy(snapshot: GameSnapshot, player: IPlayer, card: ICard, context: ValuationContext, futureCards: number): number | undefined {
  return withCopy(snapshot, (copy) => {
    const copyPlayer = copy.getPlayerById(player.id);
    copyPlayer.clearWaitingFor();
    try {
      if (futureCards > 0) {
        playFutureTableau(copy, copyPlayer, futureCards);
      }
      const before = relativeValue(copyPlayer, context);
      playCard(copy, copyPlayer, card.name);
      return relativeValue(copyPlayer, context) - before;
    } catch {
      return undefined;
    }
  });
}

/** BGA priors with this player's weights (aiTuning.ts cardPriorWeight, draftPriorWeight). */
function priorFactor(card: ICard, player: IPlayer): number {
  const tuning = tuningOf(player);
  return cardPriorFactor(card.name, tuning.cardPriorWeight, tuning.draftPriorWeight, player.game.generation);
}

function costOf(card: ICard, player: IPlayer): number {
  return isIProjectCard(card) && !isICorporationCard(card) ? player.getCardCost(card) : 0;
}

function outlookOf(card: ICard, player: IPlayer): number {
  return isIProjectCard(card) ? requirementOutlook(card, player) : 1;
}

// A card whose requirements are met but which still cannot be played now (e.g. Magnetic Field
// Generators: 4 energy production must be given up) was valued as if it were free, because the
// copy plays it ignoring that. Played now it first needs other cards or projects.
const BLOCKED_NOW_FACTOR = 0.2;
// Later such a card is often still blocked: in a test batch every 4th bought Capital, Magnetic
// Field Dome or Magnetic Field Generators stayed in hand at the end; with 0.6 Magnetic Field
// Generators was still bought 52 times per 100 games and left in hand 12 times.
const BLOCKED_LATER_FACTOR = 0.35;

function isBlockedNow(card: ICard, player: IPlayer): boolean {
  if (!isIProjectCard(card)) {
    return false;
  }
  try {
    return !card.canPlayPostRequirements(player, {cost: 0, tr: {}});
  } catch {
    // Some cards need a full payment context; then no discount.
    return false;
  }
}

/** Value of playing the card right now (requirements must be met, otherwise their outlook counts). */
function nowValue(snapshot: GameSnapshot, player: IPlayer, card: ICard, context: ValuationContext): number {
  const engineWeight = tuningOf(player).engineWeight;
  const engine = engineWeight > 0 ? engineWeight * engineValue(snapshot, player, card, context) : 0;
  const gain = gainInCopy(snapshot, player, card, context, 0);
  const raw = gain === undefined ? 0 : (gain + engine) * priorFactor(card, player) - costOf(card, player);
  return raw > 0 ? raw * outlookOf(card, player) * (isBlockedNow(card, player) ? BLOCKED_NOW_FACTOR : 1) : raw;
}

/**
 * Martin: cards that only bring VP and have no requirement that could close wait for the last
 * generation (round 20 applied the later VP value to every card and lost 1.4 VP per game).
 */
function isPointsOnly(card: ICard): boolean {
  return isIProjectCard(card) && card.requirements.length === 0 && card.type !== CardType.ACTIVE &&
    card.victoryPoints !== undefined && card.behavior?.production === undefined && card.behavior?.stock === undefined;
}

/** How much more M€ a VP is worth `delay` generations later (gameProgress.ts victoryPointValue). */
function laterPointScale(generation: number, delay: number): number {
  const value = (atGeneration: number) => Math.min(10, 4 * Math.pow(1.1, Math.max(0, atGeneration - 1)));
  return value(generation + delay) / value(generation);
}

/** Value of holding the card and playing it a few generations later. */
function laterValue(snapshot: GameSnapshot, player: IPlayer, card: ICard, context: ValuationContext): number {
  if (context.remaining <= 1 || !isIProjectCard(card) || isICorporationCard(card)) {
    return Number.NEGATIVE_INFINITY;
  }
  const delay = Math.min(3, Math.floor(context.remaining / 2));
  // A VP bought later costs money that is worth less by then (more income, discounts): valued with
  // the VP value of that generation, pure VP cards wait and engine cards are played now.
  const pointScale = tuningOf(player).laterPointValue > 0 && isPointsOnly(card) ? laterPointScale(player.game.generation, delay) : 1;
  const laterContext = {...context, remaining: context.remaining - delay, victoryPoint: context.victoryPoint * pointScale};
  const futureCards = Math.min(8, Math.round(delay * 2));
  let total = 0;
  let samples = 0;
  // Random future tableaus: more samples, less noise in the hold-or-play decision (aiTuning.ts laterSamples).
  for (let sample = 0; sample < tuningOf(player).laterSamples; sample++) {
    const gain = gainInCopy(snapshot, player, card, laterContext, futureCards);
    if (gain !== undefined) {
      total += gain;
      samples++;
    }
  }
  if (samples === 0) {
    return Number.NEGATIVE_INFINITY;
  }
  const raw = (total / samples) * priorFactor(card, player) - costOf(card, player);
  // A window that closes before the card would be played (at most 5 % oxygen …).
  const window = tuningOf(player).closingWindow > 0 && raw > 0 && isIProjectCard(card) ? closingWindowFactor(card, player, delay) : 1;
  return raw * outlookOf(card, player) * LATER_DISCOUNT * window * (isBlockedNow(card, player) ? BLOCKED_LATER_FACTOR : 1);
}

// Later values take several game copies per card; they only change slowly, so they are
// remembered for the rest of the generation.
const laterCache = new Map<string, number>();

function cachedLaterValue(snapshot: GameSnapshot, player: IPlayer, card: ICard, context: ValuationContext): number {
  const key = `${player.game.id}|${player.id}|${player.game.generation}|${card.name}`;
  // Inside a copy (e.g. valuing cards for a draft receiver) the player is only imagined: its
  // values must not mix with the cached ones of the real player.
  let value = isSimulating() ? undefined : laterCache.get(key);
  if (value === undefined) {
    if (laterCache.size > 5000) {
      laterCache.clear();
    }
    value = laterValue(snapshot, player, card, context);
    if (!isSimulating()) {
      laterCache.set(key, value);
    }
  }
  return value;
}

export function estimateCardTimings(player: IPlayer, cards: ReadonlyArray<ICard>, includeLater = true): Map<CardName, CardTiming> {
  const snapshot = playerView(player);
  const context = valuationContext(player.game, player);
  const timings = new Map<CardName, CardTiming>();
  for (const card of cards) {
    const later = includeLater ? cachedLaterValue(snapshot, player, card, context) : Number.NEGATIVE_INFINITY;
    timings.set(card.name, {now: nowValue(snapshot, player, card, context), later});
  }
  return timings;
}

/** Best value of a card, whenever it is played: used for buying and drafting. */
export function estimateCardValues(player: IPlayer, cards: ReadonlyArray<ICard>): Map<CardName, number> {
  const values = new Map<CardName, number>();
  for (const [name, timing] of estimateCardTimings(player, cards)) {
    values.set(name, Math.max(timing.now, timing.later));
  }
  return values;
}

/** What each card in hand is worth when kept for later (feeds the position value). */
export function handCardValues(player: IPlayer): Map<CardName, number> {
  const values = new Map<CardName, number>();
  if (player.cardsInHand.length === 0) {
    return values;
  }
  const snapshot = playerView(player);
  const context = valuationContext(player.game, player);
  // Expected last generation, Mars not terraformed yet: the game may go on, so a card still worth
  // playing keeps half its value instead of nothing (no selling Terraforming Ganymede for 1 M€).
  const mayContinue = context.remaining <= 1 && tuningOf(player).keepHandUntilEnd > 0 && !player.game.marsIsTerraformed();
  for (const card of player.cardsInHand) {
    const later = Math.max(0, cachedLaterValue(snapshot, player, card, context));
    values.set(card.name, mayContinue ? Math.max(later, 0.5 * nowValue(snapshot, player, card, context)) : later);
  }
  return values;
}
