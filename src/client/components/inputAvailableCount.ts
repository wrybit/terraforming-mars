import {PlayerInputModel} from '@/common/models/PlayerInputModel';

// Number of selectable entries of an input (cards, standard projects, sub-options) for the tab badge.
// undefined if the input has no list (e.g. a simple confirmation).
export function inputAvailableCount(input: PlayerInputModel): number | undefined {
  if (input.type === 'projectCard' || input.type === 'card') {
    return input.cards.filter((card) => card.isDisabled !== true).length;
  }
  if (input.type === 'or') {
    // A player selection counts each selectable player, the way it appears as tiles (OrOptions)
    return input.options.reduce((sum, option) => sum + (option.type === 'player' ? option.players.length : 1), 0);
  }
  return undefined;
}
