import {Expansion} from '@/common/cards/GameModule';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS, SeatIconKind} from '@/client/components/create/createGameChoices';
import {boardColorClass} from '@/client/components/create/boardColorClass';

// The setup of a game as chips (GameSetupChips.vue): summary above "Create game" and the game list of
// the statistics build them with the same functions, so both show the same chips in the same order.
export type GameSetupChip = {
  key: string;
  // Already translated
  label: string;
  // Meeple or robot in front of the label
  seatIcon?: SeatIconKind;
  // Expansion icon or board hexagon in front of the label
  iconClass?: string;
  // Board names are lower case and get capitalized via CSS
  capitalized?: boolean;
  // Link within the statistics page (its navigation picks up data-stats-link)
  statsHref?: string;
};

// Humans and AI players as separate chips; a single human is a solo game
export function seatChips(humanCount: number, aiCount: number): Array<GameSetupChip> {
  if (humanCount + aiCount === 1) {
    return [{key: 'humans', label: translateText('Solo'), seatIcon: 'human'}];
  }
  const chips: Array<GameSetupChip> = [];
  if (humanCount > 0) {
    const label = humanCount === 1 ? translateText('1 player') : translateTextWithParams('${0} players', [String(humanCount)]);
    chips.push({key: 'humans', label, seatIcon: 'human'});
  }
  if (aiCount > 0) {
    chips.push({key: 'ai', label: translateTextWithParams('${0} AI', [String(aiCount)]), seatIcon: 'ai'});
  }
  return chips;
}

export function boardChip(boardName: string, options: {label?: string, statsHref?: string} = {}): GameSetupChip {
  return {
    key: 'board',
    label: options.label ?? translateText(boardName),
    iconClass: boardColorClass(boardName),
    capitalized: true,
    statsHref: options.statsHref,
  };
}

// Every expansion in play by name, the base game always first
export function expansionChips(isActive: (expansion: Expansion) => boolean): Array<GameSetupChip> {
  const active = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS].filter((choice) => isActive(choice.expansion));
  return [{label: 'Base game', iconClass: 'expansion-icon-base'}, ...active].map((choice) => ({
    key: choice.label,
    label: translateText(choice.label),
    iconClass: `create-game-expansion-icon ${choice.iconClass}`,
  }));
}

// Draft only means something with more than one player
export function draftChips(playerCount: number, draft: boolean | undefined): Array<GameSetupChip> {
  return playerCount > 1 && draft === true ? [{key: 'draft', label: translateText('Draft')}] : [];
}
