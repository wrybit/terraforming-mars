// DevTools: questions around cards (common/devtools/devToolsAction.ts DevToolsTrigger), built from the game's own
// inputs and real card actions, so the dialogs look exactly as in play. What a question needs (cards in hand, cards
// with resources in play) is put in place first and written to the log like every DevTools change.
import {IPlayer} from '../IPlayer';
import {IProjectCard} from '../cards/IProjectCard';
import {ICard, isIActionCard} from '../cards/ICard';
import {PlayerInput} from '../PlayerInput';
import {SelectCard} from '../inputs/SelectCard';
import {AddResourcesToCard} from '../deferredActions/AddResourcesToCard';
import {RemoveResourcesFromCard} from '../deferredActions/RemoveResourcesFromCard';
import {newProjectCard} from '../createCard';
import {CardName} from '../../common/cards/CardName';
import {message} from '../logs/MessageBuilder';
import {RouteError} from '../routes/RouteError';

// Enough cards to choose from: fewer and the dialog would pick by itself or not come at all
const HAND_MINIMUM = 4;
const DRAFT_SIZE = 4;
// Cards holding the three kinds of resources: microbes, animals, floaters
const RESOURCE_CARDS: ReadonlyArray<CardName> = [CardName.TARDIGRADES, CardName.BIRDS, CardName.DIRIGIBLES];
const STARTING_RESOURCES = 2;

function ensureHand(player: IPlayer, count: number): void {
  const missing = count - player.cardsInHand.length;
  if (missing > 0) {
    player.drawCard(missing);
  }
}

/** The card in play, put there without its effect if missing, holding at least `resources` */
function cardInPlay(player: IPlayer, name: CardName, resources: number = 0): ICard {
  let card = player.playedCards.get(name);
  if (card === undefined) {
    const created = newProjectCard(name);
    if (created === undefined) {
      throw RouteError.badRequest('Unknown project card');
    }
    player.playedCards.push(created);
    player.game.log('🛠 DevTools: ${0} got ${1} into play without its effect', (b) => b.player(player).card(created));
    card = created;
  }
  if (card.resourceCount < resources) {
    player.addResourceTo(card, {qty: resources - card.resourceCount, log: true});
  }
  return card;
}

function resourceCards(player: IPlayer): void {
  RESOURCE_CARDS.forEach((name) => cardInPlay(player, name, STARTING_RESOURCES));
}

// The question of a card's action: the card answers with its own dialog (or queues it, the caller runs the queue)
function cardAction(player: IPlayer, name: CardName): PlayerInput | undefined {
  const card = player.playedCards.get(name);
  if (!isIActionCard(card)) {
    throw RouteError.badRequest('This card has no action');
  }
  return card.action(player);
}

export function discardInput(player: IPlayer): PlayerInput {
  ensureHand(player, HAND_MINIMUM);
  return new SelectCard('Select cards to discard', 'Discard', player.cardsInHand, {min: 1, max: player.cardsInHand.length})
    .andThen((cards) => {
      cards.forEach((card) => player.discardCardFromHand(card, {log: true}));
      return undefined;
    });
}

// One round like in the draft: keep one card, the rest goes on to the next player (here: back onto the discard pile)
export function draftInput(player: IPlayer): PlayerInput {
  const game = player.game;
  const cards: Array<IProjectCard> = game.projectDeck.drawN(game, DRAFT_SIZE);
  const giveTo = game.getPlayerAfter(player);
  return new SelectCard(message('Select a card to keep and pass the rest to ${0}', (b) => b.player(giveTo)), 'Select', cards, {min: 1, max: 1})
    .andThen(([kept]) => {
      player.cardsInHand.push(kept);
      game.projectDeck.discard(...cards.filter((card) => card !== kept));
      return undefined;
    });
}

export function addResourceInput(player: IPlayer): PlayerInput | undefined {
  resourceCards(player);
  return new AddResourcesToCard(player, undefined, {count: 1}).execute();
}

export function removeResourceInput(player: IPlayer): PlayerInput | undefined {
  resourceCards(player);
  return new RemoveResourcesFromCard(player, undefined, 1, {source: 'self', mandatory: true, autoselect: false, blockable: false,
    title: 'Select card to remove 1 resource'}).execute();
}

// A card that asks what to do with its resources: GHG Producing Bacteria adds a microbe or spends two for heat
export function resourceChoiceInput(player: IPlayer): PlayerInput | undefined {
  cardInPlay(player, CardName.GHG_PRODUCING_BACTERIA, STARTING_RESOURCES);
  return cardAction(player, CardName.GHG_PRODUCING_BACTERIA);
}

// A card that puts resources onto another card: Symbiotic Fungus, with two microbe cards to choose from
export function moveResourceInput(player: IPlayer): PlayerInput | undefined {
  cardInPlay(player, CardName.SYMBIOTIC_FUNGUS);
  cardInPlay(player, CardName.TARDIGRADES);
  cardInPlay(player, CardName.GHG_PRODUCING_BACTERIA);
  return cardAction(player, CardName.SYMBIOTIC_FUNGUS);
}

// A card that takes resources from other cards: Predators, with two animal cards to take from
export function takeResourceInput(player: IPlayer): PlayerInput | undefined {
  cardInPlay(player, CardName.PREDATORS);
  cardInPlay(player, CardName.BIRDS, STARTING_RESOURCES);
  cardInPlay(player, CardName.FISH, STARTING_RESOURCES);
  return cardAction(player, CardName.PREDATORS);
}
