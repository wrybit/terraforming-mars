import {CardName} from '@/common/cards/CardName';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';

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
