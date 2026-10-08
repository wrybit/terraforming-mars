import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {InputResponse} from '../../common/inputs/InputResponse';
import {SelectCard} from '../inputs/SelectCard';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
import {ICorporationCard} from '../cards/corporation/ICorporationCard';
import {CardName} from '../../common/cards/CardName';
import {CardTiming, estimateCardTimings, handCardValues} from './cardValue';
import {isTracingDecision, traceOptions, TracedOption} from './decisionTrace';
import {quickResponse} from './quickResponse';
import {corporationSelfPlayBonus} from './corporationSelfPlay';
import {lastGenerationLikelihood, remainingProductionPhases} from './gameProgress';
import {requirementOutlook} from './requirementOutlook';
import {isIProjectCard} from '../cards/IProjectCard';
import {Tag} from '../../common/cards/Tag';
import {tuningOf} from './aiTuning';
import {enablerBonus} from './enablerValue';
import {receiverValues} from './draftDenial';

// Opening choice (corporation + preludes + cards) and card buying / drafting.
// docs/ai/bot-heuristics.md §2 and §3a.

// Money kept after buying, so the bought cards can actually be played.
const OPENING_RESERVE = 10;
// A card must be clearly worth more than its price (aiTuning.ts buyMargin): estimates are rough,
// and a card that is never played is 3 M€ lost (the AI used to buy many cards and sell them again).

type ValueFunction = (name: CardName) => number;

/**
 * Best value of each card, whenever it is played (same as estimateCardValues), plus its timing.
 * When buying, a card only worth playing later is bought early at a discount (the money is
 * missing now, and similar cards come again), and cards that enable strong hand cards get a share
 * of their value (aiTuning.ts lateBuyFactor, enablerWeight).
 */
function valuesOf(player: IPlayer, cards: ReadonlyArray<ICard>, buying = false): {valueOf: ValueFunction, timingOf: (name: CardName) => CardTiming | undefined} {
  const timings = estimateCardTimings(player, cards);
  const tuning = tuningOf(player);
  const remaining = remainingProductionPhases(player.game);
  const handValues = tuning.enablerWeight > 0 ? handCardValues(player) : new Map<CardName, number>();
  const extras = new Map<CardName, number>(cards.map((card) => [card.name,
    tuning.enablerWeight > 0 ? tuning.enablerWeight * enablerBonus(card, player, handValues) : 0]));
  return {
    valueOf: (name) => {
      const timing = timings.get(name);
      if (timing === undefined) {
        return 0;
      }
      const later = buying && remaining >= 5 && timing.now < 0 ? timing.later * tuning.lateBuyFactor : timing.later;
      return Math.max(timing.now, later) + (extras.get(name) ?? 0);
    },
    timingOf: (name) => timings.get(name),
  };
}

const round = (value: number) => Math.round(value * 10) / 10;

/** Trace entry of a card with its now/later values. */
function cardOption(prefix: string, card: ICard, valueOf: ValueFunction, timingOf: (name: CardName) => CardTiming | undefined, chosen: boolean, note?: string): TracedOption {
  const timing = timingOf(card.name);
  return {
    label: `${prefix}${card.name}`,
    value: round(valueOf(card.name)),
    now: timing === undefined ? undefined : round(timing.now),
    later: timing === undefined || !Number.isFinite(timing.later) ? undefined : round(timing.later),
    chosen,
    note,
  };
}

/** Best cards to buy: worth more than the price, within budget and hand-size targets. */
function cardsToBuy(cards: ReadonlyArray<ICard>, valueOf: ValueFunction, budget: number, maximum: number, buyPrice: number, buyMargin: number): Array<ICard> {
  const worthIt = [...cards]
    .filter((card) => valueOf(card.name) > buyPrice + buyMargin)
    .sort((a, b) => valueOf(b.name) - valueOf(a.name));
  const affordable = Math.max(0, Math.floor(budget / buyPrice));
  return worthIt.slice(0, Math.min(maximum, affordable));
}

/**
 * Last generation: a card only pays if it is played in this generation, so its requirements must
 * be met now and price plus play cost must fit the money. In 15 test games every fourth card
 * bought in the last generation stayed in hand (e.g. Capital, Magnetic Field Dome, Zeppelins).
 */
function lastGenerationCardsToBuy(cards: ReadonlyArray<ICard>, valueOf: ValueFunction, player: IPlayer, maximum: number): Array<ICard> {
  let money = player.spendableMegacredits();
  let steel = player.steel;
  let titanium = player.titanium;
  const bought: Array<ICard> = [];
  for (const card of cards) {
    // canPlay also covers what the requirement list misses, e.g. energy production a city has
    // to give up (Noctis City, Capital, Rad-Chem Factory stayed in hand in the test games).
    if (bought.length >= maximum || !isIProjectCard(card) || requirementOutlook(card, player) < 1 || !player.canPlay(card)) {
      continue;
    }
    if (valueOf(card.name) <= player.cardCost + tuningOf(player).buyMargin) {
      continue;
    }
    // Steel and titanium pay their share first, the rest is money.
    let cost = player.getCardCost(card);
    const steelUsed = card.tags.includes(Tag.BUILDING) ? Math.min(steel, Math.floor(cost / player.getSteelValue())) : 0;
    cost -= steelUsed * player.getSteelValue();
    const titaniumUsed = card.tags.includes(Tag.SPACE) ? Math.min(titanium, Math.floor(cost / player.getTitaniumValue())) : 0;
    cost -= titaniumUsed * player.getTitaniumValue();
    if (cost + player.cardCost > money) {
      continue;
    }
    money -= cost + player.cardCost;
    steel -= steelUsed;
    titanium -= titaniumUsed;
    bought.push(card);
  }
  return bought;
}

/** Synergy bonus: cards sharing tags with the corporation profit from its effects. */
function tagSynergy(corporation: ICorporationCard, cards: ReadonlyArray<ICard>): number {
  const corporationTags = new Set(corporation.tags);
  return cards.reduce((sum, card) => sum + card.tags.filter((tag) => corporationTags.has(tag)).length * 1.5, 0);
}

function pairs<T>(items: ReadonlyArray<T>): Array<[T, T]> {
  const result: Array<[T, T]> = [];
  for (let first = 0; first < items.length; first++) {
    for (let second = first + 1; second < items.length; second++) {
      result.push([items[first], items[second]]);
    }
  }
  return result;
}

export function chooseInitialCards(input: SelectInitialCards, player: IPlayer): InputResponse {
  const corporations = player.dealtCorporationCards;
  const preludes = player.dealtPreludeCards;
  const projects = player.dealtProjectCards;
  const {valueOf, timingOf} = valuesOf(player, [...corporations, ...preludes, ...projects], true);
  const combinations: Array<{label: string, score: number}> = [];

  const preludeChoices: Array<ReadonlyArray<ICard>> = preludes.length >= 2 ? pairs(preludes) : [[]];
  let best: {corporation: ICorporationCard, preludes: ReadonlyArray<ICard>, cards: Array<ICard>, score: number} | undefined;
  for (const corporation of corporations) {
    const buyPrice = corporation.cardCost ?? player.cardCost;
    for (const preludePair of preludeChoices) {
      const budget = corporation.startingMegaCredits - OPENING_RESERVE;
      const cards = cardsToBuy(projects, valueOf, budget, 10, buyPrice, tuningOf(player).buyMargin);
      const score = valueOf(corporation.name) + corporationSelfPlayBonus(corporation.name) +
        preludePair.reduce((sum, prelude) => sum + valueOf(prelude.name), 0) +
        cards.reduce((sum, card) => sum + valueOf(card.name) - buyPrice, 0) +
        tagSynergy(corporation, [...cards, ...preludePair]);
      if (best === undefined || score > best.score) {
        best = {corporation, preludes: preludePair, cards, score};
      }
      combinations.push({label: `${corporation.name} + ${preludePair.map((card) => card.name).join(' + ')} + ${cards.length} Karten`, score});
    }
  }
  if (best === undefined) {
    return quickResponse(input, player);
  }
  const chosen = best;
  if (isTracingDecision()) {
    const ranked = combinations.sort((a, b) => b.score - a.score);
    traceOptions('initial', [
      ...corporations.map((card) => cardOption('Konzern: ', card, valueOf, timingOf, card === chosen.corporation,
        `Korrektur aus Testläufen ${round(corporationSelfPlayBonus(card.name))}`)),
      ...preludes.map((card) => cardOption('Präludium: ', card, valueOf, timingOf, chosen.preludes.includes(card))),
      ...projects.map((card) => cardOption('Karte: ', card, valueOf, timingOf, chosen.cards.includes(card))),
      ...ranked.slice(0, 5).map((combination, index) => ({label: `Kombination: ${combination.label}`, value: round(combination.score), chosen: index === 0})),
    ], {combinations: ranked.length});
  }
  const responses = input.options.map((option): InputResponse => {
    if (option === input.inputs.corp) {
      return {type: 'card', cards: [chosen.corporation.name]};
    }
    if (option === input.inputs.prelude) {
      return {type: 'card', cards: chosen.preludes.map((card) => card.name)};
    }
    if (option === input.inputs.project) {
      return {type: 'card', cards: chosen.cards.map((card) => card.name)};
    }
    return quickResponse(option, player);
  });
  return {type: 'initialCards', responses};
}

/** Draft pick or research purchase, depending on the input's limits. */
export function chooseCardsToKeep(input: SelectCard<ICard>, player: IPlayer): InputResponse {
  const candidates = input.cards.filter((_card, index) => input.config.enabled?.[index] !== false);
  const {valueOf, timingOf} = valuesOf(player, candidates, input.config.min !== input.config.max);
  const sorted = [...candidates].sort((a, b) => valueOf(b.name) - valueOf(a.name));
  if (input.config.min === input.config.max) {
    // Draft: the count is fixed. Own value plus part of what the card would be worth to the
    // player who gets the rest (aiTuning.ts draftDenial).
    const denial = tuningOf(player).draftDenial;
    const opponentValues = denial > 0 ? receiverValues(input, player, candidates) : new Map<CardName, number>();
    const draftScore = (card: ICard) => valueOf(card.name) + denial * Math.max(0, opponentValues.get(card.name) ?? 0);
    const picked = [...candidates].sort((a, b) => draftScore(b) - draftScore(a)).slice(0, input.config.min);
    if (isTracingDecision()) {
      traceOptions('draft', sorted.map((card) => cardOption('', card, valueOf, timingOf, picked.includes(card),
        opponentValues.has(card.name) ? `für Nächsten ${round(opponentValues.get(card.name) ?? 0)}` : undefined)));
    }
    return {type: 'card', cards: picked.map((card) => card.name)};
  }
  // Research: early a hand of up to 6, late only what can still be played.
  const remaining = remainingProductionPhases(player.game);
  // A rich player can afford a bigger hand (every 12 M€ above a reserve buys room for one more).
  const tuning = tuningOf(player);
  const handTarget = (remaining >= 4 ? tuning.handTargetEarly : tuning.handTargetLate) + Math.floor(Math.max(0, player.megaCredits - 30) / 12);
  // Dead cards (requirements out of reach) do not fill the hand: they blocked buying for
  // eight generations in a test game.
  const usefulHandCards = [...handCardValues(player).values()].filter((value) => value > 1).length;
  const room = Math.max(0, handTarget - usefulHandCards);
  const budget = player.megaCredits - (remaining >= 4 ? tuning.researchReserveEarly : 10);
  // Also when the game will probably end in this generation: buying for "later" is mostly lost then.
  const bought = remaining === 0 || lastGenerationLikelihood(player.game) >= 0.5 ?
    lastGenerationCardsToBuy(sorted, valueOf, player, input.config.max) :
    cardsToBuy(sorted, valueOf, budget, Math.min(input.config.max, room), player.cardCost, tuning.buyMargin);
  const count = Math.max(input.config.min, bought.length);
  const chosen = count > bought.length ? sorted.slice(0, count) : bought;
  if (isTracingDecision()) {
    traceOptions('research', sorted.map((card) => cardOption('', card, valueOf, timingOf, chosen.includes(card))), {
      price: player.cardCost, budget, handTarget, usefulHandCards, room, remainingGenerations: remaining,
      lastGenerationLikelihood: lastGenerationLikelihood(player.game),
    });
  }
  return {type: 'card', cards: chosen.map((card) => card.name)};
}
