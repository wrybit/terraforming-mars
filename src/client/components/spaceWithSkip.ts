import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {isSkipOption} from '@/client/components/skipOption';

// A space selection that may also be declined (final greenery: "Select space for greenery tile" or
// "Don't place a greenery"). Not an action menu with two tabs but one input: a single tab in the tile's color
// with the placement in the box, and "do nothing" as a button at the bottom of the box (WaitingForTabs.vue).
export type SpaceWithSkip = {
  spaceIndex: number;
  skipIndices: ReadonlyArray<number>;
};

export function spaceWithSkip(input: PlayerInputModel): SpaceWithSkip | undefined {
  if (input.type !== 'or') {
    return undefined;
  }
  const indicesWhere = (test: (option: PlayerInputModel) => boolean) =>
    input.options.flatMap((option, index) => test(option) ? [index] : []);
  const spaceIndices = indicesWhere((option) => option.type === 'space');
  const skipIndices = indicesWhere(isSkipOption);
  if (spaceIndices.length !== 1 || skipIndices.length === 0 || spaceIndices.length + skipIndices.length !== input.options.length) {
    return undefined;
  }
  return {spaceIndex: spaceIndices[0], skipIndices};
}

// The input the box shows: for a space selection with skip only the space selection, otherwise the input itself
export function shownInput(input: PlayerInputModel): PlayerInputModel {
  const choice = spaceWithSkip(input);
  return choice === undefined ? input : (input as OrOptionsModel).options[choice.spaceIndex];
}
