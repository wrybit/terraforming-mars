import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardResource} from '@/common/CardResource';
import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {isNoEffect, titleText} from '@/client/components/selectPlayerResource';
import {getCard} from '@/client/cards/ClientCardManifest';

// Card resource words in English title keys ("Add 1 microbe to this card", "Remove 3 microbes to …",
// "Add ${0} floaters to ${1}"). Only resources that are named in plain words on the server side.
const CARD_RESOURCE_WORDS: ReadonlyArray<[string, CardResource]> = [
  ['microbes?', CardResource.MICROBE],
  ['animals?', CardResource.ANIMAL],
  ['floaters?', CardResource.FLOATER],
  ['science resources?', CardResource.SCIENCE],
  ['fighters?', CardResource.FIGHTER],
  ['asteroids?', CardResource.ASTEROID],
  ['data', CardResource.DATA],
  ['camps?', CardResource.CAMP],
  ['preservation', CardResource.PRESERVATION],
  ['disease', CardResource.DISEASE],
  ['seeds?', CardResource.SEED],
  ['graphene', CardResource.GRAPHENE],
];

// Verb that decides the direction: the LAST verb in front of the card resource, because it governs it.
// Verbs after it name what the resources are spent for ("Remove 3 microbes to increase your terraform
// rating" is a loss on the card); verbs before it belong to another resource ("Spend 2 energy to add
// 1 animal to another card", Bio Printing Facility, is a gain for the card)
const DIRECTION_VERB = /\b(add|gain|put|remove|spend|use|lose)\b/gi;
const GAIN_VERBS = /^(add|gain|put)$/i;

// What a decision does with resources on a card: which resource, gain or loss, how many and on which card.
// card is missing if the title names no card and no card triggers the decision.
export type CardResourceEffect = {
  resource: CardResource,
  direction?: 'gain' | 'loss',
  amount?: number,
  card?: CardName,
};

// Generic word for "the resource of that card" ("Add resource to card ${0}", Viral Enhancers): which resource
// it is follows from the named card. "standard resource" means M€, steel … and is no card resource;
// "resource(s)" (bonus counts) is left out as well.
const GENERIC_RESOURCE_WORD = '(?<!standard )resources?(?!\\()';

// Card resource named in the title key (placeholders count as words, so card names like "Asteroid" in a
// parameter do not match) with the amount written directly before it: "3 microbes", "${0} floaters",
// "a microbe" → 1; a countable word in singular without a number ("Add microbe to …") → 1;
// "any number of microbes" or "microbes" alone → no amount
function titleCardResource(title: string | Message, card: CardName | undefined): {resource: CardResource, amount?: number, index: number} | undefined {
  const text = titleText(title);
  const cardResource = card === undefined ? undefined : getCard(card)?.resourceType;
  const words: ReadonlyArray<[string, CardResource | undefined]> = [...CARD_RESOURCE_WORDS, [GENERIC_RESOURCE_WORD, cardResource]];
  for (const [word, resource] of words) {
    const match = new RegExp(`(?:\\b(\\d+|an?|one)|\\$\\{(\\d+)\\})?\\s*\\b(${word})\\b`, 'i').exec(text);
    if (match === null) {
      continue;
    }
    // Generic word without a known card resource (card still to be chosen, card without resources)
    if (resource === undefined) {
      return undefined;
    }
    const singular = word.includes('s?') && !/s$/i.test(match[3]);
    return {resource, amount: wordAmount(title, match[1], match[2]) ?? (singular ? 1 : undefined), index: match.index};
  }
  return undefined;
}

function wordAmount(title: string | Message, written: string | undefined, placeholder: string | undefined): number | undefined {
  if (placeholder !== undefined && typeof title !== 'string') {
    const value = title.data[Number(placeholder)]?.value;
    return typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : undefined;
  }
  if (written === undefined) {
    return undefined;
  }
  return /^\d+$/.test(written) ? Number(written) : 1;
}

// Card named as a parameter in the title; otherwise the card that triggers the decision ("this card",
// or implied: Nitrite Reducing Bacteria "Remove 3 microbes to increase your terraform rating")
function titleCard(title: string | Message, sourceCard: CardName | undefined): CardName | undefined {
  if (typeof title !== 'string') {
    const card = title.data.find((datum) => datum.type === LogMessageDataType.CARD);
    if (card !== undefined) {
      return card.value as CardName;
    }
  }
  // "Add 2 animals to a card" / "to another card": a card still to be chosen, not the triggering one
  const text = titleText(title);
  return /\bcard\b/i.test(text) && !/\bthis card\b/i.test(text) ? undefined : sourceCard;
}

// Effect of an option on resources of a card; undefined if the title names no card resource
export function cardResourceEffect(title: string | Message, sourceCard?: CardName): CardResourceEffect | undefined {
  if (isNoEffect(title)) {
    return undefined;
  }
  const card = titleCard(title, sourceCard);
  const named = titleCardResource(title, card);
  if (named === undefined) {
    return undefined;
  }
  const verb = directionVerb(titleText(title), named.index);
  return {
    resource: named.resource,
    direction: verb === undefined ? undefined : (GAIN_VERBS.test(verb) ? 'gain' : 'loss'),
    amount: named.amount,
    card,
  };
}

// Last direction verb in front of the resource word; without one the first verb of the title
function directionVerb(text: string, resourceIndex: number): string | undefined {
  const verbs = [...text.matchAll(DIRECTION_VERB)];
  const before = verbs.filter((match) => match.index < resourceIndex);
  return (before.at(-1) ?? verbs[0])?.[1];
}

// Resources on the affected card before and after the option; undefined if the card is not in the tableau
export function cardResourceCount(effect: CardResourceEffect, tableau: ReadonlyArray<CardModel>): {before: number, after: number} | undefined {
  const card = tableau.find((model) => model.name === effect.card);
  if (card === undefined) {
    return undefined;
  }
  const before = card.resources ?? 0;
  if (effect.amount === undefined || effect.direction === undefined) {
    return {before, after: before};
  }
  const change = effect.direction === 'gain' ? effect.amount : -effect.amount;
  return {before, after: Math.max(0, before + change)};
}
