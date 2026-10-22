import {Expansion} from '@/common/cards/GameModule';
import {DUNE_MODULE_LABEL} from '@/common/dune/DuneModule';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {DUNE_MILESTONE_OPTIONS, FAN_EXPANSIONS, MILESTONE_OPTIONS, OFFICIAL_EXPANSIONS, SeatIconKind} from '@/client/components/create/createGameChoices';
import {defaultCreateGameModel} from '@/client/components/create/defaultCreateGameModel';
import {activeTheme} from '@/client/theme/applyTheme';
import {GameSetupOptions} from '@/common/game/GameSetupOptions';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {boardColorClass} from '@/client/components/create/boardColorClass';
import {DUNE_MODULE_ICON} from '@/client/components/create/duneModuleFields';
import {duneGraphic} from '@/client/components/dune/duneGraphic';

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
  // Picture in front of the label instead (Dune expansion modules: assets/themes/dune/graphics)
  picture?: string;
  // Board names are lower case and get capitalized via CSS
  capitalized?: boolean;
  // Link within the statistics page (its navigation picks up data-stats-link)
  statsHref?: string;
  // Card of the create form the setting belongs to (groupSetupChips)
  group: GameSetupGroupKey;
};

// The cards of the create form, in the order the grouped view shows them (players first, as in the flat chips)
export const GAME_SETUP_GROUPS = [
  {key: 'players', title: 'Players'},
  {key: 'expansions', title: 'Expansions'},
  {key: 'expansionOptions', title: 'Expansion options'},
  {key: 'board', title: 'Board'},
  {key: 'setup', title: 'Setup'},
  {key: 'houseRules', title: 'House-rule variants & pace'},
  {key: 'milestones', title: 'Milestones & Awards'},
  {key: 'cardPool', title: 'Card pool'},
] as const;

export type GameSetupGroupKey = typeof GAME_SETUP_GROUPS[number]['key'];

export type GameSetupGroup = {
  key: GameSetupGroupKey;
  // English key, translated where it is shown
  title: string;
  chips: Array<GameSetupChip>;
};

// Chips sorted into the create form's cards; cards without a chip are left out
export function groupSetupChips(chips: ReadonlyArray<GameSetupChip>): Array<GameSetupGroup> {
  return GAME_SETUP_GROUPS
    .map((group) => ({key: group.key, title: group.title, chips: chips.filter((chip) => chip.group === group.key)}))
    .filter((group) => group.chips.length > 0);
}

// Humans and AI players as separate chips; a single human is a solo game
export function seatChips(humanCount: number, aiCount: number): Array<GameSetupChip> {
  if (humanCount + aiCount === 1) {
    return [{key: 'humans', label: translateText('Solo'), seatIcon: 'human', group: 'players'}];
  }
  const chips: Array<GameSetupChip> = [];
  if (humanCount > 0) {
    const label = humanCount === 1 ? translateText('1 player') : translateTextWithParams('${0} players', [String(humanCount)]);
    chips.push({key: 'humans', label, seatIcon: 'human', group: 'players'});
  }
  if (aiCount > 0) {
    chips.push({key: 'ai', label: translateTextWithParams('${0} AI', [String(aiCount)]), seatIcon: 'ai', group: 'players'});
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
    group: 'board',
  };
}

// Every expansion in play by name, the base game always first
export function expansionChips(isActive: (expansion: Expansion) => boolean): Array<GameSetupChip> {
  const active = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS].filter((choice) => isActive(choice.expansion));
  return [{label: 'Base game', iconClass: 'expansion-icon-base'}, ...active].map((choice) => ({
    key: choice.label,
    label: translateText(choice.label),
    iconClass: `create-game-expansion-icon ${choice.iconClass}`,
    group: 'expansions' as const,
  }));
}

// Every setting that is switched on or differs from the form's default, in the order of the form's cards.
// Options of an expansion only count while it is in play, like the form only shows them then.
export function optionChips(options: GameSetupOptions, isActive: (expansion: Expansion) => boolean, playerCount: number): Array<GameSetupChip> {
  const multiplayer = playerCount > 1;
  const random = options.randomMA !== RandomMAOptionType.NONE;
  const candidates: Array<[boolean, string, GameSetupGroupKey, string?]> = [
    // [shown, translated label, card of the create form, icon]; expansion options carry their expansion's icon, otherwise e.g. "Extreme" lacks context
    [options.shuffledBoard, translateText('Randomize board tiles'), 'board'],
    [isActive('venus') && options.altVenusBoard, translateText('Alt. Venus Board'), 'expansionOptions', 'expansion-icon-venus'],
    [isActive('venus') && multiplayer && options.requiresVenusTrackCompletion, translateText('Mandatory Venus Terraforming'), 'expansionOptions', 'expansion-icon-venus'],
    [isActive('turmoil') && options.politicalAgendasExtension !== 'Standard', `${translateText('Agendas')}: ${translateText(options.politicalAgendasExtension)}`, 'expansionOptions', 'expansion-icon-agendas'],
    [isActive('turmoil') && options.removeNegativeGlobalEvents, translateText('Remove negative Global Events'), 'expansionOptions', 'expansion-icon-turmoil'],
    [isActive('moon') && options.requiresMoonTrackCompletion, translateText('Mandatory Moon Terraforming'), 'expansionOptions', 'expansion-icon-themoon'],
    [isActive('moon') && options.moonStandardProjectVariant1, translateText('Standard Project Variant #1'), 'expansionOptions', 'expansion-icon-themoon'],
    [isActive('moon') && options.moonStandardProjectVariant, translateText('Standard Project Variant #2'), 'expansionOptions', 'expansion-icon-themoon'],
    [isActive('ares') && options.aresExtremeVariant, translateText('Extreme'), 'expansionOptions', 'expansion-icon-ares'],
    [differs(options.startingCorporations, DEFAULTS.startingCorporations), countLabel('Starting Corporations', options.startingCorporations), 'setup'],
    [isActive('prelude') && differs(options.startingPreludes, DEFAULTS.startingPreludes), countLabel('Starting Preludes', options.startingPreludes), 'setup', 'expansion-icon-prelude'],
    [isActive('ceo') && differs(options.startingCeos, DEFAULTS.startingCeos), countLabel('Starting CEOs', options.startingCeos), 'setup', 'expansion-icon-ceo'],
    [isActive('prelude') && options.twoCorpsVariant, translateText('Merger'), 'setup', 'expansion-icon-prelude'],
    [multiplayer && options.draftVariant, translateText('Draft'), 'setup'],
    [multiplayer && options.initialDraftVariant, translateText('Initial Draft variant'), 'setup'],
    [multiplayer && options.initialDraftVariant && isActive('prelude') && options.preludeDraftVariant, translateText('Prelude Draft'), 'setup'],
    [multiplayer && options.initialDraftVariant && isActive('ceo') && options.ceosDraftVariant, translateText('CEO Draft'), 'setup'],
    [options.solarPhaseOption, translateText('World Government Terraforming'), 'houseRules'],
    [!multiplayer && options.soloTR, translateText('63 TR solo mode'), 'houseRules'],
    [options.undoOption, translateText('Allow undo'), 'houseRules'],
    [options.showTimers, translateText('Show timers'), 'houseRules'],
    [options.aiAnalysis, translateText('Analysis game'), 'players'],
    [options.showOtherPlayersVP, translateText('Show real-time VP'), 'houseRules'],
    [options.fastModeOption, translateText('Fast mode'), 'houseRules'],
    [options.escapeVelocity, translateText('Escape Velocity'), 'houseRules', 'expansion-icon-escape-velocity'],
    [multiplayer && random, translateText((activeTheme() === 'dune' ? DUNE_MILESTONE_OPTIONS : MILESTONE_OPTIONS).find((option) => option.value === options.randomMA)?.label ?? ''), 'milestones'],
    [multiplayer && random && options.modularMA, translateText('Official Random α'), 'milestones'],
    [multiplayer && random && options.includeFanMA, translateText('Include fan Milestones/Awards'), 'milestones'],
    [options.customCardPool, translateText('Card pool'), 'cardPool'],
  ];
  // Dune expansion modules right after the expansions: they change the rules like an expansion
  // with the same picture as their tile in the create form
  const duneModules: Array<GameSetupChip> = (options.duneModules ?? []).map((module) => {
    const label = translateText(DUNE_MODULE_LABEL[module]);
    return {key: label, label, group: 'expansions', picture: duneGraphic(DUNE_MODULE_ICON[module])};
  });
  const optionChips: Array<GameSetupChip> = candidates.filter(([shown]) => shown).map(([, label, group, icon]) => ({
    key: label,
    label,
    group,
    iconClass: icon === undefined ? undefined : `create-game-expansion-icon ${icon}`,
  }));
  return [...duneModules, ...optionChips];
}

const DEFAULTS = defaultCreateGameModel();

// Old saved games may lack a count: then nothing is known and no chip is shown
function differs(value: number | undefined, defaultValue: number): boolean {
  return value !== undefined && value !== defaultValue;
}

function countLabel(label: string, count: number | undefined): string {
  return `${translateText(label)}: ${count}`;
}
