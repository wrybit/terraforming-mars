// Delta Project track for the board tab (DeltaBoard.vue): the tag each space needs, its reward as a chip,
// and whether a player can move on now (1 energy per step, the next space's tag or a wild tag).
import {Tag} from '@/common/cards/Tag';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {BONUS_ICON, LaneEntry, TrackBonus} from '@/client/components/trackBonus/trackBonus';

export type DeltaSpace = {
  tag?: Tag;
  victoryPoints?: number;
  reward?: TrackBonus;
  // What the space gives, as text for "Next reward" (translated)
  label?: string;
};

// Same order and rewards as the Delta Project board (DeltaProjectBoard.vue); index 0 is the start
export const DELTA_SPACES: ReadonlyArray<DeltaSpace> = [
  {},
  {tag: Tag.BUILDING, reward: {icons: [BONUS_ICON.steel, BONUS_ICON.plant], count: 2}, label: '2 steel or 2 plants'},
  {tag: Tag.POWER, reward: {icons: [BONUS_ICON.energy, BONUS_ICON.heat], production: true}, label: '+1 energy or heat production'},
  {tag: Tag.EARTH, reward: {icons: [BONUS_ICON.megacredits], count: 2, production: true}, label: '+2 M€ production'},
  {tag: Tag.SPACE, reward: {icons: [BONUS_ICON.titanium], production: true}, label: '+1 titanium production'},
  {tag: Tag.SCIENCE, reward: {icons: [BONUS_ICON.card], count: 2}, label: 'Look at 4 cards, keep 2'},
  {tag: Tag.PLANT, reward: {icons: [BONUS_ICON.plant]}, label: '1 plant per plant tag'},
  {tag: Tag.MICROBE, reward: {icons: [], text: '↻'}, label: 'Use a used blue action again'},
  {tag: Tag.JOVIAN, reward: {icons: ['tags/jovian.png']}, label: 'One Jovian tag'},
  {tag: Tag.ANIMAL, reward: {icons: [BONUS_ICON.animal], count: 2}, label: '2 animals to any card'},
  {victoryPoints: 2, reward: {icons: [], victoryPoints: 2}, label: '2 VP'},
  {victoryPoints: 5, reward: {icons: [], victoryPoints: 5}, label: '5 VP'},
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
