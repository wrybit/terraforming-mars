import {Expansion} from '@/common/cards/GameModule';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS} from './createGameChoices';

// Expansions whose content only appears together with another expansion. Selecting one also selects what it
// needs; the needed tile then says why it is on.

/** One dependency: part of `expansion` (`content`, English) only comes into play with `requires`. */
export type ExpansionDependency = {
  expansion: Expansion;
  requires: Expansion;
  content: string;
};

// Colony tiles are only dealt with Colonies (ColonyDealer), global events only exist with Turmoil
export const EXPANSION_DEPENDENCIES: ReadonlyArray<ExpansionDependency> = [
  {expansion: 'prelude2', requires: 'prelude', content: 'the Prelude phase'},
  {expansion: 'community', requires: 'colonies', content: 'colony tiles'},
  {expansion: 'community', requires: 'turmoil', content: 'global events'},
  {expansion: 'pathfinders', requires: 'colonies', content: 'colony tiles'},
  {expansion: 'pathfinders', requires: 'turmoil', content: 'global events'},
  {expansion: 'underworld', requires: 'turmoil', content: 'global events'},
];

// Name as on its tile (e.g. "Underworld 2")
function tileLabel(expansion: Expansion): string {
  const choice = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS].find((candidate) => candidate.expansion === expansion);
  return translateText(choice?.label ?? expansion);
}

/** Expansions `expansion` needs. */
export function requirementsOf(expansion: Expansion): Array<Expansion> {
  return EXPANSION_DEPENDENCIES.filter((dependency) => dependency.expansion === expansion).map((dependency) => dependency.requires);
}

/**
 * Tooltip of the tile of `expansion`: which selected expansions need it and for what.
 *
 * Undefined when `expansion` is off or no selected expansion needs it.
 */
export function requiredByTooltip(expansion: Expansion, selected: Readonly<Record<Expansion, boolean>>): string | undefined {
  if (!selected[expansion]) {
    return undefined;
  }
  const lines = EXPANSION_DEPENDENCIES
    .filter((dependency) => dependency.requires === expansion && selected[dependency.expansion])
    .map((dependency) => translateTextWithParams('Selected along with ${0} – needed for ${1}',
      [tileLabel(dependency.expansion), translateText(dependency.content)]));
  return lines.length > 0 ? lines.join('\n') : undefined;
}
