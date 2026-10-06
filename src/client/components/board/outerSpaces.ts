import {SpaceName} from '@/common/boards/SpaceName';
import {SpaceId} from '@/common/Types';

// Special spaces off Mars (cities/stations in space), grouped by origin into the four corners of the board box,
// which the round planet leaves free anyway (board.less). Short name below the hex, full name as tooltip.
export type OuterCorner = 'top-left' | 'bottom-left' | 'top-right' | 'bottom-right';

export type OuterSpace = {id: SpaceId, name: string, short: string};

export type OuterGroup = {corner: OuterCorner, title: string | undefined, spaces: ReadonlyArray<OuterSpace>};

export const OUTER_GROUPS: ReadonlyArray<OuterGroup> = [
  {corner: 'top-left', title: 'Space', spaces: [
    {id: SpaceName.PHOBOS_SPACE_HAVEN, name: 'Phobos Space Haven', short: 'Phobos'},
    {id: SpaceName.GANYMEDE_COLONY, name: 'Ganymede Colony', short: 'Ganymede'},
    {id: SpaceName.STANFORD_TORUS, name: 'Stanford Torus', short: 'Stanford'},
  ]},
  {corner: 'bottom-left', title: undefined, spaces: [
    {id: SpaceName.CERES_SPACEPORT, name: 'Ceres Spaceport', short: 'Ceres'},
    {id: SpaceName.DYSON_SCREENS, name: 'Dyson Screens', short: 'Dyson'},
  ]},
  {corner: 'top-right', title: 'Venus', spaces: [
    {id: SpaceName.MAXWELL_BASE, name: 'Maxwell Base', short: 'Maxwell'},
    {id: SpaceName.DAWN_CITY, name: 'Dawn City', short: 'Dawn City'},
    {id: SpaceName.STRATOPOLIS, name: 'Stratopolis', short: 'Stratopolis'},
    {id: SpaceName.VENERA_BASE, name: 'Venera Base', short: 'Venera'},
  ]},
  {corner: 'bottom-right', title: 'Moon', spaces: [
    {id: SpaceName.LUNA_METROPOLIS, name: 'Luna Metropolis', short: 'Metropolis'},
    {id: SpaceName.LUNAR_EMBASSY, name: 'Lunar Embassy', short: 'Embassy'},
  ]},
];

// Groups with at least one space on this board (spaces of disabled expansions are missing)
export function outerGroups(hasSpace: (id: SpaceId) => boolean): Array<OuterGroup> {
  return OUTER_GROUPS
    .map((group) => ({...group, spaces: group.spaces.filter((space) => hasSpace(space.id))}))
    .filter((group) => group.spaces.length > 0);
}
