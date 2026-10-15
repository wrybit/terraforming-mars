import {ICard} from './cards/ICard';
import {IProjectCard} from './cards/IProjectCard';
import {CardManifest, ModuleManifest} from './cards/ModuleManifest';
import {CardFactorySpec} from './cards/CardFactorySpec';
import {CardName} from '../common/cards/CardName';
import {ICorporationCard} from './cards/corporation/ICorporationCard';
import {IPreludeCard} from './cards/prelude/IPreludeCard';
import {ICeoCard} from './cards/ceos/ICeoCard';
import {ALL_MODULE_MANIFESTS} from './cards/AllManifests';
import {resolveCardName} from '../common/cards/CardRenames';

type CardFactory = CardFactorySpec<ICard>;

// Loading a game creates every card of the decks anew; for AI copies that happens thousands of
// times per decision. Two caches keep it cheap: the manifest lookup, and a pristine template per
// card that is copied instead of running the constructor (which rebuilds the card's render data).
const factories = new Map<string, CardFactory | null>();

function findFactory(cardName: CardName, cardManifestNames: Array<keyof ModuleManifest>): CardFactory | undefined {
  const key = cardManifestNames.join(',') + '|' + cardName;
  const cached = factories.get(key);
  if (cached !== undefined) {
    return cached ?? undefined;
  }
  for (const moduleManifest of ALL_MODULE_MANIFESTS) {
    for (const manifestName of cardManifestNames) {
      const cardManifest = <CardManifest<ICard>> moduleManifest[manifestName];
      const factory = cardManifest[cardName];
      if (factory !== undefined) {
        factories.set(key, factory);
        return factory;
      }
    }
  }
  factories.set(key, null);
  return undefined;
}

type Template = {card: ICard, emptySets: Array<string>, emptyArrays: Array<string>};
const templates = new Map<CardName, Template | null>();

/**
 * A template can be copied when each own field is a plain value, an object every instance shares
 * (same reference in two fresh instances: the static properties, the shared empty warning set), or
 * an empty set/array of its own, which every copy gets fresh. Anything else: the constructor runs.
 */
function templateOf(card: ICard, second: ICard): Template | null {
  const template: Template = {card, emptySets: [], emptyArrays: []};
  const other = second as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(card)) {
    if (value === null || typeof value !== 'object' && typeof value !== 'function' || value === other[key]) {
      continue;
    }
    if (value instanceof Set && value.size === 0) {
      template.emptySets.push(key);
    } else if (Array.isArray(value) && value.length === 0) {
      template.emptyArrays.push(key);
    } else {
      return null;
    }
  }
  return template;
}

function instantiate(cardName: CardName, factory: CardFactory): ICard {
  let template = templates.get(cardName);
  if (template === undefined) {
    template = templateOf(new factory.Factory(), new factory.Factory());
    templates.set(cardName, template);
  }
  if (template === null) {
    return new factory.Factory();
  }
  const copy = Object.assign(Object.create(Object.getPrototypeOf(template.card)), template.card);
  for (const key of template.emptySets) {
    copy[key] = new Set();
  }
  for (const key of template.emptyArrays) {
    copy[key] = [];
  }
  return copy;
}

function _createCard<T extends ICard>(cardName: CardName, cardManifestNames: Array<keyof ModuleManifest>): T | undefined {
  const standardizedCardName = resolveCardName(cardName);
  const factory = findFactory(standardizedCardName, cardManifestNames);
  return factory === undefined ? undefined : <T> instantiate(standardizedCardName, factory);
}

export function newCard(cardName: CardName): ICard {
  const card = _createCard(cardName, ['corporationCards', 'projectCards', 'preludeCards', 'ceoCards']);
  if (card === undefined) {
    throw new Error(`Card [${cardName}] not found`);
  }
  return card;
}

export function newCorporationCard(cardName: CardName): ICorporationCard | undefined {
  return _createCard(cardName, ['corporationCards']);
}

// Function to return a card object by its name
// NOTE(kberg): This replaces a larger function which searched for both Prelude cards amidst project cards
// TODO(kberg+dl): Find the use cases where this is used to find Prelude+CEO cards and filter them out to
//              another function, perhaps?
export function newProjectCard(cardName: CardName): IProjectCard | undefined {
  return _createCard(cardName, ['projectCards', 'preludeCards', 'ceoCards']);
}

export function newPrelude(cardName: CardName): IPreludeCard | undefined {
  return _createCard(cardName, ['preludeCards']);
}

export function newCeo(cardName: CardName): ICeoCard | undefined {
  return _createCard(cardName, ['ceoCards']);
}

function cfj<T extends ICard>(cards: ReadonlyArray<CardName>, resolver: (c: CardName) => T | undefined): Array<T> {
  if (cards === undefined) {
    console.warn('parameter of array of cards is undefined when calling cardsFromJSON');
    return [];
  }
  const result: Array<T> = [];
  cards.forEach((element: CardName) => {
    const card = resolver(element);
    if (card !== undefined) {
      result.push(card);
    } else {
      console.warn(`card ${element} not found while loading game.`);
    }
  });
  return result;
}

export function cardsFromJSON(cards: ReadonlyArray<CardName>): Array<IProjectCard> {
  return cfj(cards, newProjectCard);
}

export function corporationCardsFromJSON(cards: ReadonlyArray<CardName>): Array<ICorporationCard> {
  return cfj(cards, newCorporationCard);
}

export function ceosFromJSON(cards: ReadonlyArray<CardName>): Array<ICeoCard> {
  return cfj(cards, newCeo);
}

export function preludesFromJSON(cards: ReadonlyArray<CardName>): Array<IPreludeCard> {
  return cfj(cards, newPrelude);
}

