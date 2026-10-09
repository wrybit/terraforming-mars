import {CardName} from '@/common/cards/CardName';
import {CardModel} from '@/common/models/CardModel';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {titleKey} from '@/client/components/orOptionsShortLabels';

// Title key of the action menu's "Play project card" option (Player.ts, SelectCardToPlay.ts)
export const PLAY_CARD_KEY = 'Play project card';

function findProjectCardInput(input: PlayerInputModel | undefined): PlayerInputModel | undefined {
  if (input === undefined) {
    return undefined;
  }
  if (input.type === 'projectCard') {
    return input;
  }
  if (input.type === 'or' || input.type === 'and') {
    for (const option of input.options) {
      const found = findProjectCardInput(option);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

/**
 * Cards the player can play right now – the cards of the pending "Play project card" input.
 *
 * undefined when there is no such input (not your turn, another phase): then "Playable now" isn't offered.
 */
export function playableProjectCards(playerView: PlayerViewModel): ReadonlySet<CardName> | undefined {
  const input = findProjectCardInput(playerView.waitingFor);
  if (input?.type !== 'projectCard') {
    return undefined;
  }
  return new Set(input.cards.filter((card) => card.isDisabled !== true).map((card) => card.name));
}

/**
 * Project cards in hand the build tab doesn't offer (requirement not met, too expensive …): shown greyed out as their own
 * section below the playable cards. Only for "Play project card" from the hand – not when the offered cards come
 * from elsewhere (Odyssey: events from the tableau), then the hand cards have nothing to do with the choice.
 * Some instead of every: Self-Replicating Robots adds its stored cards to the hand cards.
 */
export function unplayableHandCards(playerView: PlayerViewModel, input: PlayerInputModel): ReadonlyArray<CardModel> {
  if (input.type !== 'projectCard' || titleKey(input.title) !== PLAY_CARD_KEY) {
    return [];
  }
  const hand = playerView.cardsInHand ?? [];
  const inHand = new Set(hand.map((card) => card.name));
  if (!input.cards.some((card) => inHand.has(card.name))) {
    return [];
  }
  const offered = new Set(input.cards.map((card) => card.name));
  return hand.filter((card) => !offered.has(card.name));
}
