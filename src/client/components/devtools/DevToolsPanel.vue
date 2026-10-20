<template>
  <!-- DevTools (Jens, 20 Oct 2026): only after tmDev.on() with the admin login. Two cards: the view only pretends values
       in this browser, the intervention changes the game for everyone and writes every change into the log. -->
  <div class="devtools">
    <section class="devtools-card">
      <h3 class="devtools-card__title">{{ $t('View (only for you)') }}</h3>
      <p class="devtools-card__note">{{ $t('Pretends values in this browser only: the game stays as it is, nobody else sees it, no log line.') }}</p>
      <label v-for="slider in viewSliders" :key="slider.key" class="devtools-slider">
        <span class="devtools-slider__name">{{ $t(slider.label) }}</span>
        <input type="range" :min="slider.min" :max="slider.max" :step="slider.step" :value="slider.value" @input="setView(slider.key, $event)">
        <b class="devtools-slider__value">{{ shown(slider.key, slider.value) }}</b>
      </label>
      <div class="devtools-row">
        <label class="devtools-field">
          <span>{{ $t('Board') }}</span>
          <select :value="game.gameOptions.boardName" @change="setViewBoard(($event.target as HTMLSelectElement).value)">
            <option v-for="board in boards" :key="board" :value="board">{{ board }}</option>
          </select>
        </label>
        <label class="devtools-field">
          <span>{{ $t('Theme') }}</span>
          <select :value="game.gameOptions.theme" @change="setViewTheme(($event.target as HTMLSelectElement).value)">
            <option v-for="theme in themes" :key="theme" :value="theme">{{ theme }}</option>
          </select>
        </label>
        <button type="button" class="btn devtools-button" @click="resetView">{{ $t('Reset view') }}</button>
      </div>
    </section>

    <section class="devtools-card devtools-card--live">
      <h3 class="devtools-card__title">{{ $t('Intervention (for everyone, in the log)') }}</h3>
      <p class="devtools-card__note">{{ $t('Changes the game for all players; every change is written to the game log.') }}</p>
      <div class="devtools-card__columns">
      <div class="devtools-card__column">
      <h4 class="devtools-card__group">{{ $t('Global parameters') }}</h4>
      <label class="devtools-slider">
        <span class="devtools-slider__name">{{ $t('Fill planet') }}</span>
        <input type="range" min="0" max="100" step="5" v-model.number="fillPercent" @change="send({type: 'terraform', share: fillPercent / 100})">
        <b class="devtools-slider__value">{{ fillPercent }} %</b>
      </label>
      <label v-for="slider in liveSliders" :key="slider.key" class="devtools-slider">
        <span class="devtools-slider__name">{{ $t(slider.label) }}</span>
        <input type="range" :min="slider.min" :max="slider.max" :step="slider.step" :value="slider.value" @change="sendGlobal(slider.key, $event)">
        <b class="devtools-slider__value">{{ shown(slider.key, slider.value) }}</b>
      </label>

      <h4 class="devtools-card__group">{{ $t('Card') }}</h4>
      <input class="devtools-search" :list="listId" v-model="cardSearch" :placeholder="$t('Search project card')">
      <datalist :id="listId">
        <option v-for="card in cardOptions" :key="card.name" :value="card.label"></option>
      </datalist>
      <div class="devtools-row">
        <button type="button" class="btn devtools-button" :disabled="chosenCard === undefined" @click="sendCard('hand')">{{ $t('Into the hand') }}</button>
        <button type="button" class="btn devtools-button" :disabled="chosenCard === undefined" @click="sendCard('tableau')">{{ $t('Into play (without effect)') }}</button>
      </div>
      </div>

      <div class="devtools-card__column">
      <h4 class="devtools-card__group">{{ $t('Resources and production') }}</h4>
      <label class="devtools-field">
        <span>{{ $t('Player') }}</span>
        <select v-model="color" @change="loadPlayerValues">
          <option v-for="player in players" :key="player.color" :value="player.color">{{ player.name }}</option>
        </select>
      </label>
      <div class="devtools-grid">
        <span></span>
        <span class="devtools-grid__head">{{ $t('Stock') }}</span>
        <span class="devtools-grid__head">{{ $t('Production') }}</span>
        <template v-for="unit in units" :key="unit.key">
          <span class="devtools-grid__name">{{ $t(unit.label) }}</span>
          <input type="number" class="devtools-grid__input" v-model.number="stock[unit.key]">
          <input type="number" class="devtools-grid__input" v-model.number="production[unit.key]">
        </template>
      </div>
      <button type="button" class="btn btn-primary devtools-button" @click="send({type: 'resources', color, stock, production})">{{ $t('Set values') }}</button>
      </div>
      </div>
      <p v-if="error !== ''" class="devtools-error">{{ error }}</p>
    </section>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {Color} from '@/common/Color';
import {BoardName} from '@/common/boards/BoardName';
import {THEMES, Theme, isTheme} from '@/common/theme/Theme';
import {CardName} from '@/common/cards/CardName';
import {CardType} from '@/common/cards/CardType';
import {Units} from '@/common/Units';
import {isPlayerId} from '@/common/Types';
import * as constants from '@/common/constants';
import {getGlobalParameterMaximums} from '@/common/boards/GlobalParameterMaximums';
import {DevToolsAction, DEVTOOLS_UNIT_KEYS} from '@/common/devtools/devToolsAction';
import {getCards} from '@/client/cards/ClientCardManifest';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {vueRoot} from '@/client/components/vueRoot';
import {DevToolsView, clearDevToolsView, loadDevToolsView, saveDevToolsView} from '@/client/devtools/devToolsView';
import {sendDevToolsAction} from '@/client/devtools/devToolsApi';
import {temperatureText} from '@/client/theme/themeDisplay';

type UnitKey = typeof DEVTOOLS_UNIT_KEYS[number];
type ViewKey = 'temperature' | 'oxygenLevel' | 'oceans' | 'venusScaleLevel';
type GlobalKey = 'temperature' | 'oxygen' | 'venus';
type Slider<K> = {key: K, label: string, min: number, max: number, step: number, value: number};

const UNITS: ReadonlyArray<{key: UnitKey, label: string, stock: keyof PublicPlayerModel, production: keyof PublicPlayerModel}> = [
  {key: 'megacredits', label: 'MegaCredits', stock: 'megacredits', production: 'megacreditProduction'},
  {key: 'steel', label: 'Steel', stock: 'steel', production: 'steelProduction'},
  {key: 'titanium', label: 'Titanium', stock: 'titanium', production: 'titaniumProduction'},
  {key: 'plants', label: 'Plants', stock: 'plants', production: 'plantProduction'},
  {key: 'energy', label: 'Energy', stock: 'energy', production: 'energyProduction'},
  {key: 'heat', label: 'Heat', stock: 'heat', production: 'heatProduction'},
];
const PROJECT_TYPES: ReadonlyArray<CardType> = [CardType.AUTOMATED, CardType.ACTIVE, CardType.EVENT];
let instances = 0;

export default defineComponent({
  name: 'DevToolsPanel',
  props: {
    game: {
      type: Object as PropType<GameModel>,
      required: true,
    },
    players: {
      type: Array as PropType<ReadonlyArray<PublicPlayerModel>>,
      required: true,
    },
  },
  data() {
    instances++;
    return {
      listId: 'devtools-cards-' + instances,
      fillPercent: this.currentFill(),
      color: (this.players[0]?.color ?? 'red') as Color,
      stock: {} as Partial<Units>,
      production: {} as Partial<Units>,
      cardSearch: '',
      error: '',
    };
  },
  created() {
    this.loadPlayerValues();
  },
  watch: {
    // After every change the game is loaded anew: sliders and fields show what it is now
    'game.oceans'() {
      this.fillPercent = this.currentFill();
    },
    players() {
      this.loadPlayerValues();
    },
  },
  computed: {
    maximums() {
      return getGlobalParameterMaximums(this.game.gameOptions.boardName);
    },
    viewSliders(): Array<Slider<ViewKey>> {
      const sliders: Array<Slider<ViewKey>> = [
        {key: 'temperature', label: 'Temperature', min: constants.MIN_TEMPERATURE, max: this.maximums.temperature, step: 2, value: this.game.temperature},
        {key: 'oxygenLevel', label: 'Oxygen', min: constants.MIN_OXYGEN_LEVEL, max: this.maximums.oxygen, step: 1, value: this.game.oxygenLevel},
        {key: 'oceans', label: 'Oceans', min: 0, max: this.maximums.oceans, step: 1, value: this.game.oceans},
      ];
      if (this.game.gameOptions.expansions.venus) {
        sliders.push({key: 'venusScaleLevel', label: 'Venus', min: constants.MIN_VENUS_SCALE, max: this.maximums.venus, step: 2, value: this.game.venusScaleLevel});
      }
      return sliders;
    },
    liveSliders(): Array<Slider<GlobalKey>> {
      const sliders: Array<Slider<GlobalKey>> = [
        {key: 'temperature', label: 'Temperature', min: constants.MIN_TEMPERATURE, max: this.maximums.temperature, step: 2, value: this.game.temperature},
        {key: 'oxygen', label: 'Oxygen', min: constants.MIN_OXYGEN_LEVEL, max: this.maximums.oxygen, step: 1, value: this.game.oxygenLevel},
      ];
      if (this.game.gameOptions.expansions.venus) {
        sliders.push({key: 'venus', label: 'Venus', min: constants.MIN_VENUS_SCALE, max: this.maximums.venus, step: 2, value: this.game.venusScaleLevel});
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
    // Translated names, so the search works in the language of the page
    cardOptions(): Array<{name: CardName, label: string}> {
      return getCards((card) => PROJECT_TYPES.includes(card.type))
        .map((card) => ({name: card.name, label: translateText(card.name)}))
        .sort((a, b) => a.label.localeCompare(b.label));
    },
    chosenCard(): CardName | undefined {
      const search = this.cardSearch.trim().toLocaleLowerCase();
      return this.cardOptions.find((card) => card.label.toLocaleLowerCase() === search || card.name.toLocaleLowerCase() === search)?.name;
    },
  },
  methods: {
    // Current filling of the planet, measured by its oceans (spice fields), on the 5 % steps of the slider
    currentFill(): number {
      const maximum = getGlobalParameterMaximums(this.game.gameOptions.boardName).oceans;
      return maximum > 0 ? Math.round(this.game.oceans / maximum * 20) * 5 : 0;
    },
    // Temperature as the board shows it (water storage from 0 in the Dune theme)
    shown(key: string, value: number): string {
      return key === 'temperature' ? temperatureText(value) : String(value);
    },
    numberOf(event: Event): number {
      return Number((event.target as HTMLInputElement).value);
    },
    // View mode: the value goes straight into the shown game and is kept for the next load of the page
    setView(key: ViewKey, event: Event): void {
      const value = this.numberOf(event);
      const view: DevToolsView = {...loadDevToolsView(), [key]: value};
      saveDevToolsView(view);
      const playerView = vueRoot(this).playerView;
      if (playerView !== undefined) {
        playerView.game[key] = value;
      }
    },
    // Board and theme need the game loaded anew (theme texts, board layout)
    setViewBoard(board: string): void {
      saveDevToolsView({...loadDevToolsView(), boardName: board as BoardName});
      vueRoot(this).updatePlayer();
    },
    setViewTheme(theme: string): void {
      if (isTheme(theme)) {
        saveDevToolsView({...loadDevToolsView(), theme});
        vueRoot(this).updatePlayer();
      }
    },
    resetView(): void {
      clearDevToolsView();
      vueRoot(this).updatePlayer();
    },
    loadPlayerValues(): void {
      const player = this.players.find((candidate) => candidate.color === this.color);
      if (player === undefined) {
        return;
      }
      const stock: Partial<Units> = {};
      const production: Partial<Units> = {};
      for (const unit of UNITS) {
        stock[unit.key] = Number(player[unit.stock]);
        production[unit.key] = Number(player[unit.production]);
      }
      this.stock = stock;
      this.production = production;
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
    sendGlobal(key: GlobalKey, event: Event): void {
      void this.send({type: 'globals', [key]: this.numberOf(event)});
    },
    sendCard(to: 'hand' | 'tableau'): void {
      if (this.chosenCard !== undefined) {
        void this.send({type: 'card', color: this.color, card: this.chosenCard, to});
      }
    },
  },
});
</script>
