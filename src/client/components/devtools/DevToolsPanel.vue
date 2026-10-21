<template>
  <!-- DevTools (Jens, 20 Oct 2026): only after tmDev.on() with the admin login. Every control changes the game for
       everyone on the server and writes the change into the log; it sends by itself once it has rested for a second. -->
  <section class="devtools">
    <header class="devtools__head">
      <h3 class="devtools__title">{{ $t('DevTools') }}</h3>
      <p class="devtools__note">{{ $t('Changes the game for all players and writes every change into the game log. Each change is sent by itself one second after the last touch.') }}</p>
    </header>

    <!-- Box 1, full width: what is the same for everybody; its controls in columns, so it stays short -->
    <div class="devtools__box devtools__group devtools__group--globals">
      <h4 class="devtools__group-title">{{ $t('Global parameters') }}</h4>
      <div class="devtools-globals">
      <div class="devtools-pair">
        <label class="devtools-field">
          <span class="devtools-field__name">{{ $t('Board') }}</span>
          <select class="devtools-select" v-model="setup.boardName" @change="scheduleSetup">
            <option v-for="board in boards" :key="board" :value="board">{{ $t(board) }}</option>
          </select>
        </label>
        <label class="devtools-field">
          <span class="devtools-field__name">{{ $t('Theme') }}</span>
          <select class="devtools-select" v-model="setup.theme" @change="scheduleSetup">
            <option v-for="theme in themes" :key="theme" :value="theme">{{ theme }}</option>
          </select>
        </label>
      </div>
      <label :class="['devtools-slider', {'devtools-slider--pending': isPending('generation')}]">
        <span class="devtools-slider__name">{{ $t('Generation') }}</span>
        <input type="number" min="1" class="devtools-input devtools-input--short" v-model.number="generation" @input="scheduleGeneration">
      </label>
      <label v-for="slider in sliders" :key="slider.key" :class="['devtools-slider', {'devtools-slider--pending': isPending(slider.key)}]">
        <span class="devtools-slider__name">{{ $t(slider.label) }}</span>
        <input type="range" class="devtools-range" :min="slider.min" :max="slider.max" :step="slider.step"
          :style="{'--devtools-fill': fillOf(slider)}" v-model.number="values[slider.key]" @input="scheduleSlider(slider.key)">
        <b class="devtools-slider__value">{{ shown(slider.key, values[slider.key]) }}</b>
      </label>
      </div>
    </div>

    <!-- Box 2: one player, chosen at the top; values | tags | questions side by side, the card below -->
    <div class="devtools__box devtools__group devtools__group--player">
      <!-- One player for everything below: values, cards and the questions asked right now -->
      <div class="devtools-players" role="radiogroup" :aria-label="$t('Player')">
        <button v-for="player in players" :key="player.color" type="button" role="radio" :aria-checked="player.color === color"
          :class="['devtools-players__option', {'devtools-players__option--on': player.color === color}]" @click="choosePlayer(player.color)">
          <span :class="['devtools-players__dot', 'player_bg_color_' + player.color]"></span>{{ player.name }}
        </button>
      </div>

      <div class="devtools-player">
        <div class="devtools__group">
          <h4 class="devtools__group-title">{{ $t('Rating and points') }}</h4>
          <div :class="['devtools-grid', 'devtools-grid--single', {'devtools-grid--pending': isPending(playerKey)}]">
            <span class="devtools-grid__name">{{ $t('Terraform Rating') }}</span>
            <input type="number" class="devtools-input" v-model.number="stats.terraformRating" @input="schedulePlayer('terraformRating')">
            <span class="devtools-grid__name">{{ $t('Victory Points') }}</span>
            <input type="number" class="devtools-input" v-model.number="stats.victoryPoints" @input="schedulePlayer('victoryPoints')">
            <span class="devtools-grid__name">{{ $t('Steel value') }}</span>
            <input type="number" min="1" class="devtools-input" v-model.number="stats.steelValue" @input="schedulePlayer('steelValue')">
            <span class="devtools-grid__name">{{ $t('Titanium value') }}</span>
            <input type="number" min="1" class="devtools-input" v-model.number="stats.titaniumValue" @input="schedulePlayer('titaniumValue')">
            <!-- Switch as a button: a checkbox in a label gets the option numbering of the action box -->
            <span class="devtools-grid__name">{{ $t('Protected Habitats') }}</span>
            <button type="button" role="switch" :aria-checked="stats.protectedHabitats"
              :class="['devtools-switch', {'devtools-switch--on': stats.protectedHabitats}]" @click="toggleProtectedHabitats">
              <span class="devtools-switch__knob"></span>
            </button>
          </div>

          <h4 class="devtools__group-title">{{ $t('Resources and production') }}</h4>
          <div :class="['devtools-grid', {'devtools-grid--pending': isPending(resourcesKey)}]">
            <span></span>
            <span class="devtools-grid__head">{{ $t('Stock') }}</span>
            <span class="devtools-grid__head">{{ $t('Production') }}</span>
            <template v-for="unit in units" :key="unit.key">
              <span class="devtools-grid__name">{{ $t(unit.label) }}</span>
              <input type="number" class="devtools-input" v-model.number="stock[unit.key]" @input="scheduleResources">
              <input type="number" class="devtools-input" v-model.number="production[unit.key]" @input="scheduleResources">
            </template>
          </div>
        </div>

        <div class="devtools__group">
          <h4 class="devtools__group-title">{{ $t('Tags and discounts') }}</h4>
          <div :class="['devtools-grid', {'devtools-grid--pending': isPending(playerKey)}]">
            <span></span>
            <span class="devtools-grid__head">{{ $t('Tags') }}</span>
            <span class="devtools-grid__head">{{ $t('Extra discount') }}</span>
            <span class="devtools-grid__name">{{ $t('All cards') }}</span>
            <span></span>
            <input type="number" min="0" class="devtools-input" v-model.number="stats.cardDiscount" @input="schedulePlayer('cardDiscount')">
            <template v-for="tag in tagList" :key="tag">
              <span class="devtools-grid__name devtools-grid__name--tag"><Tag :tag="tag" size="small"/>{{ $t(tag) }}</span>
              <input type="number" min="0" class="devtools-input" v-model.number="tags[tag]" @input="schedulePlayer('tags')">
              <input type="number" min="0" class="devtools-input" v-model.number="tagDiscounts[tag]" @input="schedulePlayer('tagDiscounts')">
            </template>
          </div>
        </div>

        <div class="devtools__group">
          <h4 class="devtools__group-title">{{ $t('Ask now') }}</h4>
          <div class="devtools-trigger-groups">
            <div v-for="group in triggerGroups" :key="group.label" class="devtools-trigger-group">
              <span class="devtools-field__name">{{ $t(group.label) }}</span>
              <div class="devtools-triggers">
                <button v-for="trigger in group.triggers" :key="trigger.key" type="button" class="btn devtools-button" @click="sendTrigger(trigger.key)">{{ $t(trigger.label) }}</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <h4 class="devtools__group-title">{{ $t('Card') }}</h4>
      <div class="devtools-card-row">
        <input class="devtools-input" :list="listId" v-model="cardSearch" :placeholder="$t('Search project card')">
        <button type="button" class="btn devtools-button" :disabled="chosenCard === undefined" @click="sendCard('hand')">{{ $t('Into the hand') }}</button>
        <button type="button" class="btn devtools-button" :disabled="chosenCard === undefined" @click="sendCard('tableau')">{{ $t('Into play (without effect)') }}</button>
      </div>
      <datalist :id="listId">
        <option v-for="card in cardOptions" :key="card.name" :value="card.label"></option>
      </datalist>
    </div>
    <p v-if="error !== ''" class="devtools__error">{{ error }}</p>
  </section>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {BoardName} from '@/common/boards/BoardName';
import {THEMES, Theme} from '@/common/theme/Theme';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {ALL_TAGS, Tag as TagName} from '@/common/cards/Tag';
import {Units} from '@/common/Units';
import {isPlayerId} from '@/common/Types';
import * as constants from '@/common/constants';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {DevToolsAction, DevToolsPlayerAction, DevToolsTrigger, DEVTOOLS_TRIGGER_GROUPS, DEVTOOLS_TRIGGER_LABELS, DEVTOOLS_UNIT_KEYS,
  PLANET_SPACE_TYPES} from '@/common/devtools/devToolsAction';
import {getCards} from '@/client/cards/ClientCardManifest';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {vueRoot} from '@/client/components/vueRoot';
import Tag from '@/client/components/Tag.vue';
import {sendDevToolsAction} from '@/client/devtools/devToolsApi';
import {KeyedDebounce} from '@/client/devtools/devToolsDebounce';
import {closeDevTools} from '@/client/devtools/devToolsState';
import {temperatureText} from '@/client/theme/themeDisplay';

type UnitKey = typeof DEVTOOLS_UNIT_KEYS[number];
type SliderKey = 'fill' | 'oceans' | 'temperature' | 'oxygen' | 'venus';
type Slider = {key: SliderKey, label: string, min: number, max: number, step: number};
type Values = Record<SliderKey, number>;
type PlayerField = 'terraformRating' | 'victoryPoints' | 'cardDiscount' | 'steelValue' | 'titaniumValue' | 'protectedHabitats' |
  'tags' | 'tagDiscounts';
type TagNumbers = Partial<Record<TagName, number>>;

const UNITS: ReadonlyArray<{key: UnitKey, label: string, stock: keyof PublicPlayerModel, production: keyof PublicPlayerModel}> = [
  {key: 'megacredits', label: 'MegaCredits', stock: 'megacredits', production: 'megacreditProduction'},
  {key: 'steel', label: 'Steel', stock: 'steel', production: 'steelProduction'},
  {key: 'titanium', label: 'Titanium', stock: 'titanium', production: 'titaniumProduction'},
  {key: 'plants', label: 'Plants', stock: 'plants', production: 'plantProduction'},
  {key: 'energy', label: 'Energy', stock: 'energy', production: 'energyProduction'},
  {key: 'heat', label: 'Heat', stock: 'heat', production: 'heatProduction'},
];
// Clone tags only stand in for another tag while a card is played: nothing to count
const TAG_LIST: ReadonlyArray<TagName> = ALL_TAGS.filter((tag) => tag !== TagName.CLONE);
const PROJECT_TYPES: ReadonlyArray<CardType> = [CardType.AUTOMATED, CardType.ACTIVE, CardType.EVENT];
const SETUP_KEY = 'setup';
const GENERATION_KEY = 'generation';
let instances = 0;

// What the game shows now, in the units of the sliders
function valuesOf(game: GameModel): Values {
  const planet = game.spaces.filter((space) => PLANET_SPACE_TYPES.includes(space.spaceType));
  const taken = planet.filter((space) => space.tileType !== undefined).length;
  return {
    // On the 5 % steps of the slider
    fill: planet.length > 0 ? Math.round(taken / planet.length * 20) * 5 : 0,
    oceans: game.oceans,
    temperature: game.temperature,
    oxygen: game.oxygenLevel,
    venus: game.venusScaleLevel,
  };
}

function actionFor(key: SliderKey, value: number): DevToolsAction {
  switch (key) {
  case 'fill':
    return {type: 'terraform', share: value / 100};
  case 'oceans':
    return {type: 'oceans', count: value};
  default:
    return {type: 'globals', [key]: value};
  }
}

export default defineComponent({
  name: 'DevToolsPanel',
  components: {
    Tag,
  },
  props: {
    game: {
      type: Object as PropType<GameModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
    // Colour of the player whose page this is: a question asked of him shows below, so the DevTools step aside
    viewerColor: {
      type: String as PropType<Color>,
      required: true,
    },
  },
  data() {
    instances++;
    return {
      listId: 'devtools-cards-' + instances,
      values: valuesOf(this.game),
      generation: this.game.generation,
      setup: {boardName: this.game.gameOptions.boardName, theme: this.game.gameOptions.theme},
      // The own player first: changes and questions are mostly meant for the one testing
      color: (this.players.some((player) => player.color === this.viewerColor) ? this.viewerColor : this.players[0]?.color ?? 'red') as Color,
      stock: {} as Partial<Units>,
      production: {} as Partial<Units>,
      stats: {terraformRating: 0, victoryPoints: 0, cardDiscount: 0, steelValue: 2, titaniumValue: 3, protectedHabitats: false},
      tags: {} as TagNumbers,
      tagDiscounts: {} as TagNumbers,
      // Fields of the player changed since the last send: only those go to the server (points follow from tags)
      changedFields: new Set<PlayerField>(),
      cardSearch: '',
      error: '',
      // Counter only: makes the pending marks follow the timers (the debounce itself is not reactive)
      pendingTick: 0,
      debounce: new KeyedDebounce(),
    };
  },
  created() {
    this.loadPlayerValues();
  },
  beforeUnmount() {
    // Closing the tab, or a new board building the view anew, loses no change
    this.debounce.flushAll();
  },
  watch: {
    // After every change the game is loaded anew: each control shows what the game is now, unless it is still waiting
    // to send its own value
    game() {
      const current = valuesOf(this.game);
      for (const key of Object.keys(current) as Array<SliderKey>) {
        if (!this.debounce.isPending(key)) {
          this.values[key] = current[key];
        }
      }
      if (!this.debounce.isPending(GENERATION_KEY)) {
        this.generation = this.game.generation;
      }
      if (!this.debounce.isPending(SETUP_KEY)) {
        this.setup = {boardName: this.game.gameOptions.boardName, theme: this.game.gameOptions.theme};
      }
    },
    players() {
      this.loadPlayerValues();
    },
  },
  computed: {
    maximums() {
      return getGlobalParameterMaximums(this.game.gameOptions.boardName);
    },
    sliders(): Array<Slider> {
      const sliders: Array<Slider> = [
        {key: 'fill', label: 'Fill planet', min: 0, max: 100, step: 5},
        {key: 'oceans', label: 'Oceans', min: 0, max: this.maximums.oceans, step: 1},
        {key: 'temperature', label: 'Temperature', min: constants.MIN_TEMPERATURE, max: this.maximums.temperature, step: 2},
        {key: 'oxygen', label: 'Oxygen', min: constants.MIN_OXYGEN_LEVEL, max: this.maximums.oxygen, step: 1},
      ];
      if (this.game.gameOptions.expansions.venus) {
        sliders.push({key: 'venus', label: 'Venus', min: constants.MIN_VENUS_SCALE, max: this.maximums.venus, step: 2});
      }
      return sliders;
    },
    boards(): ReadonlyArray<BoardName> {
      return Object.values(BoardName);
    },
    themes(): ReadonlyArray<Theme> {
      return THEMES;
    },
    units() {
      return UNITS;
    },
    tagList(): ReadonlyArray<TagName> {
      return TAG_LIST;
    },
    // The worm only where the game has one (Dune expansion)
    triggerGroups(): Array<{label: string, triggers: Array<{key: DevToolsTrigger, label: string}>}> {
      return DEVTOOLS_TRIGGER_GROUPS.map((group) => ({
        label: group.label,
        triggers: group.triggers
          .filter((key) => key !== 'worm' || this.game.dune?.worm !== undefined)
          // The agenda choice only with House schemes (Dune expansion)
          .filter((key) => key !== 'schemes' || this.game.dune?.schemes !== undefined)
          .map((key) => ({key, label: DEVTOOLS_TRIGGER_LABELS[key]})),
      }));
    },
    resourcesKey(): string {
      return 'resources-' + this.color;
    },
    playerKey(): string {
      return 'player-' + this.color;
    },
    // Names in the wording of the theme (translateText reads the theme texts first), so the search works in the
    // language and theme of the page. Cards of the Dune expansion only where the game is shown as Dune
    cardOptions(): Array<{name: CardName, label: string}> {
      const dune = this.game.gameOptions.theme === 'dune';
      return getCards((card) => PROJECT_TYPES.includes(card.type) && (dune || card.module !== 'dune'))
        .map((card) => ({name: card.name, label: translateText(card.name)}))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    chosenCard(): CardName | undefined {
      const search = this.cardSearch.trim().toLocaleLowerCase();
      return this.cardOptions.find((card) => card.label.toLocaleLowerCase() === search || card.name.toLocaleLowerCase() === search)?.name;
    },
  },
  methods: {
    // Temperature as the board shows it (water storage from 0 in the Dune theme)
    shown(key: SliderKey, value: number): string {
      if (key === 'temperature') {
        return temperatureText(value);
      }
      return key === 'fill' || key === 'oxygen' || key === 'venus' ? value + ' %' : String(value);
    },
    // Filled part of the track, drawn by devtools.less
    fillOf(slider: Slider): string {
      const span = slider.max - slider.min;
      return span > 0 ? ((this.values[slider.key] - slider.min) / span * 100) + '%' : '0%';
    },
    isPending(key: string): boolean {
      // Read the tick, so Vue draws the mark anew when a timer starts or ends
      return this.pendingTick >= 0 && this.debounce.isPending(key);
    },
    schedule(key: string, run: () => void): void {
      this.debounce.schedule(key, () => {
        this.pendingTick++;
        run();
      });
      this.pendingTick++;
    },
    scheduleSlider(key: SliderKey): void {
      this.schedule(key, () => void this.send(actionFor(key, this.values[key])));
    },
    scheduleGeneration(): void {
      this.schedule(GENERATION_KEY, () => void this.send({type: 'globals', generation: this.generation}));
    },
    scheduleSetup(): void {
      this.schedule(SETUP_KEY, () => void this.send({type: 'setup', ...this.setup}));
    },
    scheduleResources(): void {
      // The values as they are now: switching the player before the send must not hand them to another one
      const color = this.color;
      const stock = {...this.stock};
      const production = {...this.production};
      this.schedule(this.resourcesKey, () => void this.send({type: 'resources', color, stock, production}));
    },
    schedulePlayer(field: PlayerField): void {
      this.changedFields.add(field);
      const action: DevToolsPlayerAction = {type: 'player', color: this.color};
      for (const changed of this.changedFields) {
        switch (changed) {
        case 'tags':
          action.tags = {...this.tags};
          break;
        case 'tagDiscounts':
          action.tagDiscounts = {...this.tagDiscounts};
          break;
        case 'protectedHabitats':
          action.protectedHabitats = this.stats.protectedHabitats;
          break;
        default:
          action[changed] = this.stats[changed];
        }
      }
      this.schedule(this.playerKey, () => {
        this.changedFields.clear();
        void this.send(action);
      });
    },
    toggleProtectedHabitats(): void {
      this.stats.protectedHabitats = !this.stats.protectedHabitats;
      this.schedulePlayer('protectedHabitats');
    },
    choosePlayer(color: Color): void {
      // Changes of the player before are sent at once, so they cannot end up with the next one
      this.debounce.flushAll();
      this.color = color;
      this.loadPlayerValues();
    },
    loadPlayerValues(): void {
      const player = this.players.find((candidate) => candidate.color === this.color);
      if (player === undefined) {
        return;
      }
      if (!this.debounce.isPending(this.resourcesKey)) {
        const stock: Partial<Units> = {};
        const production: Partial<Units> = {};
        for (const unit of UNITS) {
          stock[unit.key] = Number(player[unit.stock]);
          production[unit.key] = Number(player[unit.production]);
        }
        this.stock = stock;
        this.production = production;
      }
      if (!this.debounce.isPending(this.playerKey)) {
        this.stats = {
          terraformRating: player.terraformRating,
          victoryPoints: player.victoryPointsBreakdown.total,
          cardDiscount: player.cardDiscount,
          steelValue: player.steelValue,
          titaniumValue: player.titaniumValue,
          protectedHabitats: player.devToolsProtectedHabitats ?? false,
        };
        this.tags = Object.fromEntries(TAG_LIST.map((tag) => [tag, player.tags[tag] ?? 0]));
        this.tagDiscounts = Object.fromEntries(TAG_LIST.map((tag) => [tag, player.devToolsTagDiscounts?.[tag] ?? 0]));
      }
    },
    async send(action: DevToolsAction): Promise<void> {
      const playerId = new URLSearchParams(window.location.search).get('id') ?? '';
      if (!isPlayerId(playerId)) {
        return;
      }
      this.error = '';
      try {
        await sendDevToolsAction(playerId, action);
        vueRoot(this).updatePlayer();
      } catch (e) {
        this.error = translateTextWithParams('The change failed: ${0}', [String(e instanceof Error ? e.message : e)]);
      }
    },
    sendCard(to: 'hand' | 'tableau'): void {
      if (this.chosenCard !== undefined) {
        void this.send({type: 'card', color: this.color, card: this.chosenCard, to});
      }
    },
    async sendTrigger(trigger: DevToolsTrigger): Promise<void> {
      await this.send({type: 'trigger', color: this.color, trigger});
      if (this.error === '' && this.color === this.viewerColor) {
        closeDevTools();
      }
    },
  },
});
</script>
