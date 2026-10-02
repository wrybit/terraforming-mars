<template>
  <div id="game-setup-detail" class="setup-tiles">
    <div v-for="entry in entries" :key="entry.label" class="setup-tile" :class="{'setup-tile--wide': entry.wide}">
      <div class="setup-tile-label">{{ entry.label }}</div>
      <div class="setup-tile-values">
        <component
          :is="value.href ? 'a' : 'span'"
          v-for="value in entry.values"
          :key="value.text"
          class="setup-chip"
          :class="value.tone ? `setup-chip--${value.tone}` : ''"
          :href="value.href"
          :target="value.href ? '_blank' : undefined"
          :rel="value.href ? 'noopener noreferrer' : undefined">
          <span v-if="value.iconClass" :class="`create-game-expansion-icon ${value.iconClass}`"></span>
          {{ value.text }}
        </component>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Game setup as a tile grid: one tile per setting with a label and value chips
import {computed} from 'vue';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {BoardName} from '@/common/boards/BoardName';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {RULEBOOK_URLS} from '@/client/utils/WikiLinks';
import {FAN_EXPANSIONS, OFFICIAL_EXPANSIONS} from '@/client/components/create/createGameChoices';

const props = defineProps<{
  playerNumber: number;
  gameOptions: GameOptionsModel;
  lastSoloGeneration: number;
}>();

// Chip tone: board = board colour, accent = active option (purple), off = switched off (subtle)
type SetupValue = {text: string, tone?: string, iconClass?: string, href?: string};
type SetupEntry = {label: string, values: Array<SetupValue>, wide?: boolean};

// Colour class per board (setup_tiles.less)
const BOARD_TONE: Record<BoardName, string> = {
  [BoardName.THARSIS]: 'board-tharsis',
  [BoardName.HELLAS]: 'board-hellas',
  [BoardName.ELYSIUM]: 'board-elysium',
  [BoardName.UTOPIA_PLANITIA]: 'board-utopia-planitia',
  [BoardName.VASTITAS_BOREALIS_NOVA]: 'board-vastitas-borealis',
  [BoardName.TERRA_CIMMERIA_NOVA]: 'board-terra-cimmeria',
  [BoardName.AMAZONIS]: 'board-amazonis',
  [BoardName.ARABIA_TERRA]: 'board-arabia-terra',
  [BoardName.VASTITAS_BOREALIS]: 'board-vastitas-borealis',
  [BoardName.TERRA_CIMMERIA]: 'board-terra-cimmeria',
  [BoardName.HOLLANDIA]: 'board-hollandia',
};

// Existing translations end with a colon ("Board: ") – tile labels drop it
function label(key: string): string {
  return translateText(key).replace(/[\s:：]+$/, '');
}

function chip(text: string, tone?: string): SetupValue {
  return {text: translateText(text), tone};
}

const expansionValues = computed((): Array<SetupValue> => {
  const options = props.gameOptions;
  const values: Array<SetupValue> = [...OFFICIAL_EXPANSIONS, ...FAN_EXPANSIONS]
    .filter((choice) => options.expansions[choice.expansion])
    .map((choice) => ({
      text: translateText(choice.label),
      iconClass: choice.iconClass,
      href: RULEBOOK_URLS[choice.expansion],
    }));
  if (options.politicalAgendasExtension !== 'Standard') {
    values.push({text: translateText('Agendas'), iconClass: 'expansion-icon-agendas'});
  }
  return values.length > 0 ? values : [chip('Base')];
});

const draftValues = computed((): Array<SetupValue> => {
  const options = props.gameOptions;
  const values: Array<SetupValue> = [];
  if (options.initialDraftVariant) {
    values.push(chip('Initial'));
  }
  if (options.draftVariant) {
    values.push(chip('Research phase'));
  }
  if (options.preludeDraftVariant) {
    values.push(chip('Prelude'));
  }
  return values.length > 0 ? values : [chip('Off', 'off')];
});

const randomMAValues = computed((): Array<SetupValue> => {
  const options = props.gameOptions;
  const values: Array<SetupValue> = [];
  switch (options.randomMA) {
  case RandomMAOptionType.NONE: values.push(chip('Board-defined')); break;
  case RandomMAOptionType.LIMITED: values.push(chip('Randomized with limited synergy')); break;
  case RandomMAOptionType.UNLIMITED: values.push(chip('Full randomized')); break;
  }
  if (options.randomMA !== RandomMAOptionType.NONE && options.includeFanMA) {
    values.push(chip('Include fan Milestones/Awards'));
  }
  return values;
});

// Switches without their own tile: only shown when enabled
const configValues = computed((): Array<SetupValue> => {
  const options = props.gameOptions;
  const switches: Array<[boolean, string]> = [
    [options.fastModeOption, 'fast mode'],
    [options.showTimers, 'timer'],
    [options.showOtherPlayersVP, 'real-time vp'],
    [options.undoOption, 'undo'],
    [options.twoCorpsVariant, 'Merger'],
    [options.requiresVenusTrackCompletion, 'Require terraforming Venus to end the game'],
    [options.requiresMoonTrackCompletion, 'Require terraforming The Moon to end the game'],
    [options.expansions.venus && options.removeNegativeGlobalEvents, 'No negative Turmoil event'],
  ];
  return switches.filter(([enabled]) => enabled).map(([, text]) => chip(text, 'accent'));
});

const escapeVelocityText = computed((): string => {
  const escapeVelocity = props.gameOptions.escapeVelocity;
  if (escapeVelocity === undefined) {
    return '';
  }
  return translateTextWithParams(
    'After ${0} min, reduce ${1} VP every ${2} min. (${3} bonus sec. per action.)',
    [
      escapeVelocity.thresholdMinutes.toString(),
      escapeVelocity.penaltyVPPerPeriod.toString(),
      escapeVelocity.penaltyPeriodMinutes.toString(),
      escapeVelocity.bonusSectionsPerAction.toString(),
    ]);
});

const entries = computed((): Array<SetupEntry> => {
  const options = props.gameOptions;
  const multiplayer = props.playerNumber > 1;
  const boardValues: Array<SetupValue> = [{text: translateText(options.boardName), tone: BOARD_TONE[options.boardName]}];
  if (options.shuffleMapOption) {
    boardValues.push(chip('(randomized tiles)'));
  }
  const all: Array<SetupEntry | false> = [
    {label: label('Board:'), values: boardValues},
    {label: label('Expansions'), values: expansionValues.value},
    multiplayer && {label: label('Draft:'), values: draftValues.value},
    multiplayer && {label: label('Milestones and Awards:'), values: randomMAValues.value},
    !multiplayer && {label: label('Solo'), values: [
      {text: translateText(`${props.lastSoloGeneration} Gens`)},
      chip(options.soloTR ? '63 TR' : 'TR all'),
    ]},
    {label: label('World Government Terraforming'), values: [options.solarPhaseOption ? chip('On') : chip('Off', 'off')]},
    configValues.value.length > 0 && {label: label('Game configs:'), values: configValues.value},
    options.escapeVelocity !== undefined && {label: label('Escape Velocity'), values: [{text: escapeVelocityText.value, iconClass: 'expansion-icon-escape-velocity'}], wide: true},
    options.bannedCards.length > 0 && {label: label('Banned cards:'), values: options.bannedCards.map((card) => ({text: translateText(card)})), wide: true},
  ];
  return all.filter((entry): entry is SetupEntry => entry !== false);
});
</script>
