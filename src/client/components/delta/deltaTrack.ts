// Delta Project track for the board tab (DeltaBoard.vue): the tag each space needs, its reward as a chip,
// and whether a player can move on now (1 energy per step, the next space's tag or a wild tag).
import {Tag} from '@/common/cards/Tag';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {BONUS_ICON, LaneEntry, TrackBonus} from '@/client/components/trackBonus/trackBonus';

export type DeltaSpace = {
  tag?: Tag;
  victoryPoints?: number;
  reward?: TrackBonus;
};

// Same order and rewards as the Delta Project board (DeltaProjectBoard.vue); index 0 is the start
export const DELTA_SPACES: ReadonlyArray<DeltaSpace> = [
  {},
  {tag: Tag.BUILDING, reward: {icons: [BONUS_ICON.steel, BONUS_ICON.plant], count: 2}},
  {tag: Tag.POWER, reward: {icons: [BONUS_ICON.energy, BONUS_ICON.heat], production: true}},
  {tag: Tag.EARTH, reward: {icons: [BONUS_ICON.megacredits], count: 2, production: true}},
  {tag: Tag.SPACE, reward: {icons: [BONUS_ICON.titanium], production: true}},
  {tag: Tag.SCIENCE, reward: {icons: [BONUS_ICON.card], count: 2}},
  {tag: Tag.PLANT, reward: {icons: [BONUS_ICON.plant]}},
  {tag: Tag.MICROBE, reward: {icons: [], text: '↻'}},
  {tag: Tag.JOVIAN, reward: {icons: ['tags/jovian.png']}},
  {tag: Tag.ANIMAL, reward: {icons: [BONUS_ICON.animal], count: 2}},
  {victoryPoints: 2, reward: {icons: [], victoryPoints: 2}},
  {victoryPoints: 5, reward: {icons: [], victoryPoints: 5}},
];

export function deltaPosition(player: PublicPlayerModel): number {
  return player.deltaProject?.position ?? 0;
}

// Chips of all spaces; reached ones are handed out (for this player)
export function deltaLane(position: number): Record<number, Array<LaneEntry>> {
  const lane: Record<number, Array<LaneEntry>> = {};
  DELTA_SPACES.forEach((space, index) => {
    if (space.reward !== undefined) {
      lane[index] = [{bonus: space.reward, kind: index <= position ? 'done' : 'own'}];
    }
  });
  return lane;
}

export type DeltaNext = {
  space: DeltaSpace;
  // Why the player can't move on now; undefined = reachable
  blocker: 'energy' | 'tag' | undefined;
};

export function deltaNext(player: PublicPlayerModel): DeltaNext | undefined {
  const space = DELTA_SPACES[deltaPosition(player) + 1];
  if (space === undefined) {
    return undefined;
  }
  if (player.energy <= 0) {
    return {space, blocker: 'energy'};
  }
  const hasTag = space.tag === undefined || (player.tags[space.tag] ?? 0) > 0 || (player.tags[Tag.WILD] ?? 0) > 0;
  return {space, blocker: hasTag ? undefined : 'tag'};
}
