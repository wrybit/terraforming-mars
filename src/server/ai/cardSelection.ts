import {IPlayer} from '../IPlayer';
import {ICard} from '../cards/ICard';
import {InputResponse} from '../../common/inputs/InputResponse';
import {SelectCard} from '../inputs/SelectCard';
import {SelectInitialCards} from '../inputs/SelectInitialCards';
import {ICorporationCard} from '../cards/corporation/ICorporationCard';
import {CardName} from '../../common/cards/CardName';
import {estimateCardValues, handCardValues} from './cardValue';
import {quickResponse} from './quickResponse';
import {corporationSelfPlayBonus} from './corporationSelfPlay';
import {lastGenerationLikelihood, remainingProductionPhases} from './gameProgress';
import {requirementOutlook} from './requirementOutlook';
import {isIProjectCard} from '../cards/IProjectCard';
import {Tag} from '../../common/cards/Tag';

// Opening choice (corporation + preludes + cards) and card buying / drafting.
// docs/ai/bot-heuristics.md §2 and §3a.

// Money kept after buying, so the bought cards can actually be played.
const OPENING_RESERVE = 10;
// A card must be clearly worth more than its price: estimates are rough, and a card that is
// never played is 3 M€ lost (the AI used to buy many cards and sell them again).
const BUY_MARGIN = 1.5;

type ValueFunction = (name: CardName) => number;

/** Best cards to buy: worth more than the price, within budget and hand-size targets. */
function cardsToBuy(cards: ReadonlyArray<ICard>, valueOf: ValueFunction, budget: number, maximum: number, buyPrice: number): Array<ICard> {
  const worthIt = [...cards]
    .filter((card) => valueOf(card.name) > buyPrice + BUY_MARGIN)
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
    if (valueOf(card.name) <= player.cardCost + BUY_MARGIN) {
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
  const values = estimateCardValues(player, [...corporations, ...preludes, ...projects]);
  const valueOf: ValueFunction = (name) => values.get(name) ?? 0;

  const preludeChoices: Array<ReadonlyArray<ICard>> = preludes.length >= 2 ? pairs(preludes) : [[]];
  let best: {corporation: ICorporationCard, preludes: ReadonlyArray<ICard>, cards: Array<ICard>, score: number} | undefined;
  for (const corporation of corporations) {
    const buyPrice = corporation.cardCost ?? player.cardCost;
    for (const preludePair of preludeChoices) {
      const budget = corporation.startingMegaCredits - OPENING_RESERVE;
      const cards = cardsToBuy(projects, valueOf, budget, 10, buyPrice);
      const score = valueOf(corporation.name) + corporationSelfPlayBonus(corporation.name) +
        preludePair.reduce((sum, prelude) => sum + valueOf(prelude.name), 0) +
        cards.reduce((sum, card) => sum + valueOf(card.name) - buyPrice, 0) +
        tagSynergy(corporation, [...cards, ...preludePair]);
      if (best === undefined || score > best.score) {
        best = {corporation, preludes: preludePair, cards, score};
      }
    }
  }
  if (best === undefined) {
    return quickResponse(input, player);
  }
  const chosen = best;
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
  const values = estimateCardValues(player, candidates);
  const valueOf: ValueFunction = (name) => values.get(name) ?? 0;
  const sorted = [...candidates].sort((a, b) => valueOf(b.name) - valueOf(a.name));
  if (input.config.min === input.config.max) {
    // Draft: the count is fixed, take the best.
    return {type: 'card', cards: sorted.slice(0, input.config.min).map((card) => card.name)};
  }
  // Research: early a hand of up to 6, late only what can still be played.
  const remaining = remainingProductionPhases(player.game);
  // A rich player can afford a bigger hand (every 12 M€ above a reserve buys room for one more).
  const handTarget = (remaining >= 4 ? 6 : 3) + Math.floor(Math.max(0, player.megaCredits - 30) / 12);
  // Dead cards (requirements out of reach) do not fill the hand: they blocked buying for
  // eight generations in a test game.
  const usefulHandCards = [...handCardValues(player).values()].filter((value) => value > 1).length;
  const room = Math.max(0, handTarget - usefulHandCards);
  const budget = player.megaCredits - (remaining >= 4 ? 4 : 10);
  // Also when the game will probably end in this generation: buying for "later" is mostly lost then.
  const bought = remaining === 0 || lastGenerationLikelihood(player.game) >= 0.5 ?
    lastGenerationCardsToBuy(sorted, valueOf, player, input.config.max) :
    cardsToBuy(sorted, valueOf, budget, Math.min(input.config.max, room), player.cardCost);
  const count = Math.max(input.config.min, bought.length);
  const chosen = count > bought.length ? sorted.slice(0, count) : bought;
  return {type: 'card', cards: chosen.map((card) => card.name)};
}
