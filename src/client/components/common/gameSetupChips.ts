import {Expansion} from '@/common/cards/GameModule';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {FAN_EXPANSIONS, MILESTONE_OPTIONS, OFFICIAL_EXPANSIONS, SeatIconKind} from '@/client/components/create/createGameChoices';
import {defaultCreateGameModel} from '@/client/components/create/defaultCreateGameModel';
import {GameSetupOptions} from '@/common/game/GameSetupOptions';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
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

// Every setting that is switched on or differs from the form's default, in the order of the form's cards.
// Options of an expansion only count while it is in play, like the form only shows them then.
export function optionChips(options: GameSetupOptions, isActive: (expansion: Expansion) => boolean, playerCount: number): Array<GameSetupChip> {
  const multiplayer = playerCount > 1;
  const random = options.randomMA !== RandomMAOptionType.NONE;
  const candidates: Array<[boolean, string, string?]> = [
    // [shown, translated label, icon]; expansion options carry their expansion's icon, otherwise e.g. "Extreme" lacks context
    [options.shuffledBoard, translateText('Randomize board tiles')],
    [isActive('venus') && options.altVenusBoard, translateText('Alt. Venus Board'), 'expansion-icon-venus'],
    [isActive('venus') && multiplayer && options.requiresVenusTrackCompletion, translateText('Mandatory Venus Terraforming'), 'expansion-icon-venus'],
    [isActive('turmoil') && options.politicalAgendasExtension !== 'Standard', `${translateText('Agendas')}: ${translateText(options.politicalAgendasExtension)}`, 'expansion-icon-agendas'],
    [isActive('turmoil') && options.removeNegativeGlobalEvents, translateText('Remove negative Global Events'), 'expansion-icon-turmoil'],
    [isActive('moon') && options.requiresMoonTrackCompletion, translateText('Mandatory Moon Terraforming'), 'expansion-icon-themoon'],
    [isActive('moon') && options.moonStandardProjectVariant1, translateText('Standard Project Variant #1'), 'expansion-icon-themoon'],
    [isActive('moon') && options.moonStandardProjectVariant, translateText('Standard Project Variant #2'), 'expansion-icon-themoon'],
    [isActive('ares') && options.aresExtremeVariant, translateText('Extreme'), 'expansion-icon-ares'],
    [differs(options.startingCorporations, DEFAULTS.startingCorporations), countLabel('Starting Corporations', options.startingCorporations)],
    [isActive('prelude') && differs(options.startingPreludes, DEFAULTS.startingPreludes), countLabel('Starting Preludes', options.startingPreludes), 'expansion-icon-prelude'],
    [isActive('ceo') && differs(options.startingCeos, DEFAULTS.startingCeos), countLabel('Starting CEOs', options.startingCeos), 'expansion-icon-ceo'],
    [isActive('prelude') && options.twoCorpsVariant, translateText('Merger'), 'expansion-icon-prelude'],
    [multiplayer && options.draftVariant, translateText('Draft')],
    [multiplayer && options.initialDraftVariant, translateText('Initial Draft variant')],
    [multiplayer && options.initialDraftVariant && isActive('prelude') && options.preludeDraftVariant, translateText('Prelude Draft')],
    [multiplayer && options.initialDraftVariant && isActive('ceo') && options.ceosDraftVariant, translateText('CEO Draft')],
    [options.solarPhaseOption, translateText('World Government Terraforming')],
    [!multiplayer && options.soloTR, translateText('63 TR solo mode')],
    [options.undoOption, translateText('Allow undo')],
    [options.showTimers, translateText('Show timers')],
    [options.showOtherPlayersVP, translateText('Show real-time VP')],
    [options.fastModeOption, translateText('Fast mode')],
    [options.escapeVelocity, translateText('Escape Velocity'), 'expansion-icon-escape-velocity'],
    [multiplayer && random, translateText(MILESTONE_OPTIONS.find((option) => option.value === options.randomMA)?.label ?? '')],
    [multiplayer && random && options.modularMA, translateText('Official Random α')],
    [multiplayer && random && options.includeFanMA, translateText('Include fan Milestones/Awards')],
    [options.customCardPool, translateText('Card pool')],
  ];
  return candidates.filter(([shown]) => shown).map(([, label, icon]) => ({
    key: label,
    label,
    iconClass: icon === undefined ? undefined : `create-game-expansion-icon ${icon}`,
  }));
}

const DEFAULTS = defaultCreateGameModel();

// Old saved games may lack a count: then nothing is known and no chip is shown
function differs(value: number | undefined, defaultValue: number): boolean {
  return value !== undefined && value !== defaultValue;
}

function countLabel(label: string, count: number | undefined): string {
  return `${translateText(label)}: ${count}`;
}
