<template>
  <div id="create-game" class="create-game">
    <div class="create-game-layout">
      <div class="create-game-card create-game-head">
        <h1 v-i18n>Create New Game</h1>
        <div class="create-game-head-actions">
          <PreferencesIcon/>
          <label class="create-game-icon-button" :title="$t('Load settings from file')">
            <i class="icon icon-upload"></i>
            <input style="display: none" type="file" accept=".json" id="settings-file" ref="file" @change="uploadSettings()">
          </label>
          <button type="button" class="create-game-icon-button" :title="$t('Save settings to file')" @click="downloadSettings()"><i class="icon icon-download"></i></button>
          <AppButton class="create-game-reset btn-tone-quiet" title="Reset" @click="resetSettings"/>
        </div>
      </div>

      <main class="create-game-settings">
        <div class="create-game-cards">
          <section class="create-game-card">
            <div class="create-game-card-head">
              <h2 v-i18n>Expansions</h2>
              <button type="button" class="create-game-link" :class="{'create-game-link--selected': allOfficialExpansions}" @click="allOfficialExpansions = !allOfficialExpansions" v-i18n>All</button>
            </div>
            <div class="create-game-subhead" v-i18n>Official</div>
            <div class="create-game-chip-grid">
              <ChoiceChip v-for="choice in OFFICIAL_EXPANSIONS" :key="choice.expansion"
                :label="choice.label" :iconClass="choice.iconClass" :selected="expansions[choice.expansion]"
                :href="choice.info ? wikiUrls[choice.expansion] : undefined"
                @select="expansions[choice.expansion] = !expansions[choice.expansion]"/>
            </div>
            <div class="create-game-subhead" v-i18n>Fan-made</div>
            <div class="create-game-chip-grid">
              <ChoiceChip v-for="choice in FAN_EXPANSIONS" :key="choice.expansion"
                :label="choice.label" :iconClass="choice.iconClass" :selected="expansions[choice.expansion]"
                :href="choice.info ? wikiUrls[choice.expansion] : undefined"
                @select="expansions[choice.expansion] = !expansions[choice.expansion]">
                <span v-if="choice.alpha" class="create-game-alpha" title="Alpha — work in progress">α</span>
              </ChoiceChip>
            </div>
          </section>

          <section class="create-game-card">
            <div class="create-game-card-head"><h2 v-i18n>Board</h2></div>
            <template v-for="group in boardGroups" :key="group.title">
              <div class="create-game-subhead" v-i18n>{{ group.title }}</div>
              <div class="create-game-chip-grid">
                <ChoiceChip v-for="boardName in group.boards" :key="boardName"
                  :label="boardName" capitalized :selected="board === boardName"
                  :href="isRandomBoard(boardName) ? undefined : boardHref(boardName)"
                  @select="board = boardName">
                  <template #icon><span :class="getBoardColorClass(boardName)"></span></template>
                </ChoiceChip>
              </div>
            </template>
            <OptionRow label="Randomize board tiles" :href="wikiUrls.randomizeBoardTiles">
              <SwitchInput v-model="shuffleMapOption"/>
            </OptionRow>
            <template v-if="playersCount > 1">
              <div class="create-game-subhead">
                <span v-i18n>Milestones &amp; Awards</span>
                <InfoLink :href="wikiUrls.randomMilestonesAndAwards"/>
              </div>
              <SegmentedControl v-model="randomMA" :options="MILESTONE_OPTIONS"/>
              <template v-if="isRandomMAEnabled()">
                <OptionRow label="Official Random α" sub><SwitchInput v-model="modularMA"/></OptionRow>
                <div v-if="modularMA" class="create-game-note">
                  The new Milestones and Awards are still in active development.
                  Please don't report anything unless it breaks the game.
                  These are <b>always fully random</b>.
                </div>
                <OptionRow label="Include fan Milestones/Awards" sub><SwitchInput v-model="includeFanMA"/></OptionRow>
              </template>
            </template>
          </section>

          <section class="create-game-card">
            <div class="create-game-card-head"><h2 v-i18n>Setup</h2></div>
            <OptionRow label="Starting Corporations">
              <NumberStepper v-model="startingCorporations" :min="1" :max="6"/>
            </OptionRow>
            <OptionRow v-if="expansions.prelude" label="Starting Preludes" iconClass="expansion-icon-prelude">
              <NumberStepper v-model="startingPreludes" :min="4" :max="8"/>
            </OptionRow>
            <OptionRow v-if="expansions.ceo" label="Starting CEOs" iconClass="expansion-icon-ceo">
              <NumberStepper v-model="startingCeos" :min="1" :max="6"/>
            </OptionRow>
            <OptionRow v-if="expansions.prelude" label="Merger" iconClass="expansion-icon-prelude" :href="wikiUrls.merger">
              <SwitchInput v-model="twoCorpsVariant"/>
            </OptionRow>
            <template v-if="playersCount > 1">
              <OptionRow label="Draft variant"><SwitchInput v-model="draftVariant"/></OptionRow>
              <OptionRow label="Initial Draft variant" :href="wikiUrls.initialDraft"><SwitchInput v-model="initialDraft"/></OptionRow>
              <template v-if="initialDraft">
                <OptionRow v-if="expansions.prelude" label="Prelude Draft" sub><SwitchInput v-model="preludeDraftVariant"/></OptionRow>
                <OptionRow v-if="expansions.ceo" label="CEO Draft" sub><SwitchInput v-model="ceosDraftVariant"/></OptionRow>
              </template>
              <OptionRow label="Random first player"><SwitchInput v-model="randomFirstPlayer"/></OptionRow>
            </template>
          </section>

          <section class="create-game-card">
            <div class="create-game-card-head"><h2 v-i18n>Rules</h2></div>
            <OptionRow label="World Government Terraforming" :href="wikiUrls.worldGovernmentTerraforming">
              <SwitchInput v-model="solarPhaseOption"/>
            </OptionRow>
            <OptionRow v-if="playersCount === 1" label="63 TR solo mode" :href="wikiUrls.trSoloMode">
              <SwitchInput v-model="soloTR"/>
            </OptionRow>
            <OptionRow label="Allow undo" :href="wikiUrls.allowUndo"><SwitchInput v-model="undoOption"/></OptionRow>
            <div v-if="undoOption" class="create-game-note">
              <span v-i18n>Undo is now in best effort support.</span>
              <span v-i18n>No effort will be spent to fix it.</span>
              <InfoLink href="https://github.com/terraforming-mars/terraforming-mars/discussions/7647"/>
            </div>
            <OptionRow label="Show timers"><SwitchInput v-model="showTimers"/></OptionRow>
            <template v-if="playersCount > 1">
              <OptionRow label="Show real-time VP" :href="wikiUrls.showRealtimeVP"><SwitchInput v-model="showOtherPlayersVP"/></OptionRow>
              <OptionRow label="Fast mode" :href="wikiUrls.fastMode"><SwitchInput v-model="fastModeOption"/></OptionRow>
            </template>
            <OptionRow label="Escape Velocity" iconClass="expansion-icon-escape-velocity" :href="wikiUrls.escapeVelocity">
              <SwitchInput v-model="escapeVelocityMode"/>
            </OptionRow>
            <template v-if="escapeVelocityMode">
              <div class="create-game-option create-game-option--sub">
                <span v-i18n>After</span>
                <NumberStepper v-model="escapeVelocityThreshold" :min="0" :max="180" :step="5"/>
                <span v-i18n>min</span>
              </div>
              <div class="create-game-option create-game-option--sub">
                <span v-i18n>Plus</span>
                <NumberStepper v-model="escapeVelocityBonusSeconds" :min="1" :max="10"/>
                <span v-i18n>seconds per action</span>
              </div>
              <div class="create-game-option create-game-option--sub">
                <span v-i18n>Reduce</span>
                <NumberStepper v-model="escapeVelocityPenalty" :min="1" :max="10"/>
                <span v-i18n>VP every</span>
                <NumberStepper v-model="escapeVelocityPeriod" :min="1" :max="10"/>
                <span v-i18n>min</span>
              </div>
            </template>
          </section>

          <section class="create-game-card">
            <div class="create-game-card-head"><h2 v-i18n>Expansion options</h2></div>
            <div v-if="!hasExpansionOptions" class="create-game-note" v-i18n>Activate Venus Next, Turmoil, The Moon or Ares to see their options here.</div>
            <div v-if="expansions.venus" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-venus"></span><span v-i18n>Venus Next</span></div>
              <OptionRow label="Alt. Venus Board" :href="wikiUrls.alternativeVenusBoard"><SwitchInput v-model="altVenusBoard"/></OptionRow>
              <OptionRow v-if="playersCount > 1" label="Mandatory Venus Terraforming" :href="wikiUrls.venusTerraforming">
                <SwitchInput v-model="requiresVenusTrackCompletion"/>
              </OptionRow>
            </div>
            <div v-if="expansions.turmoil" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-turmoil"></span><span v-i18n>Turmoil</span></div>
              <OptionRow label="Agendas" iconClass="expansion-icon-agendas" href="https://www.notion.so/Political-Agendas-8c6b0b018a884692be29b3ef44b340a9">
                <SwitchInput :modelValue="isPoliticalAgendasExtensionEnabled()" @update:modelValue="politicalAgendasExtensionToggle()"/>
              </OptionRow>
              <SegmentedControl v-if="isPoliticalAgendasExtensionEnabled()" class="create-game-segmented--sub" v-model="politicalAgendasExtension" :options="AGENDA_OPTIONS"/>
              <OptionRow label="Remove negative Global Events" :href="wikiUrls.removeNegativeGlobalEvents">
                <SwitchInput v-model="removeNegativeGlobalEventsOption"/>
              </OptionRow>
            </div>
            <div v-if="expansions.moon" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-themoon"></span><span v-i18n>The Moon</span></div>
              <OptionRow label="Mandatory Moon Terraforming"><SwitchInput v-model="requiresMoonTrackCompletion"/></OptionRow>
              <OptionRow label="Standard Project Variant #1" :href="wikiUrls.moonStandardProjectVariant"><SwitchInput v-model="moonStandardProjectVariant1"/></OptionRow>
              <OptionRow label="Standard Project Variant #2" :href="wikiUrls.moonStandardProjectVariant"><SwitchInput v-model="moonStandardProjectVariant"/></OptionRow>
            </div>
            <div v-if="expansions.ares" class="create-game-option-group">
              <div class="create-game-option-group-title"><span class="create-game-expansion-icon expansion-icon-ares"></span><span v-i18n>Ares</span></div>
              <OptionRow label="Extreme" :href="wikiUrls.aresExtreme"><SwitchInput v-model="aresExtremeVariant"/></OptionRow>
            </div>
          </section>

          <section class="create-game-card">
            <div class="create-game-card-head"><h2 v-i18n>Card pool</h2></div>
            <div class="create-game-chip-grid create-game-chip-grid--two">
              <ChoiceChip label="Custom Corporation list" :selected="showCorporationList" @select="showCorporationList = !showCorporationList">
                <span v-if="customCorporations.length" class="create-game-count">{{ customCorporations.length }}</span>
              </ChoiceChip>
              <ChoiceChip v-if="expansions.prelude" label="Custom Preludes list" :selected="showPreludesList" @select="showPreludesList = !showPreludesList">
                <span v-if="customPreludes.length" class="create-game-count">{{ customPreludes.length }}</span>
              </ChoiceChip>
              <ChoiceChip v-if="expansions.ceo" label="Custom CEOs list" :selected="showCeosList" @select="showCeosList = !showCeosList">
                <span v-if="customCeos.length" class="create-game-count">{{ customCeos.length }}</span>
              </ChoiceChip>
              <ChoiceChip v-if="expansions.colonies" label="Custom Colonies list" :selected="showColoniesList" @select="showColoniesList = !showColoniesList">
                <span v-if="customColonies.length" class="create-game-count">{{ customColonies.length }}</span>
              </ChoiceChip>
              <ChoiceChip label="Exclude some cards" :selected="showBannedCards" @select="showBannedCards = !showBannedCards">
                <span v-if="bannedCards.length" class="create-game-count">{{ bannedCards.length }}</span>
              </ChoiceChip>
              <ChoiceChip label="Include some cards" :selected="showIncludedCards" @select="showIncludedCards = !showIncludedCards">
                <span v-if="includedCards.length" class="create-game-count">{{ includedCards.length }}</span>
              </ChoiceChip>
            </div>
            <OptionRow label="Set Predefined Game" :href="wikiUrls.setPredefinedGame"><SwitchInput v-model="seededGame"/></OptionRow>
            <input v-if="seededGame" type="text" name="clonedGamedId" class="create-game-text-input" :placeholder="$t('game id:')" v-model="clonedGameId">
          </section>
        </div>

        <CorporationsFilter
            ref="corporationsFilter"
            v-if="showCorporationList"
            @corporation-list-changed="updateCustomCorporations"
            :expansions="expansions"
            :selected="customCorporations"
            @close="showCorporationList = false"
        />
        <PreludesFilter
            ref="preludesFilter"
            v-if="showPreludesList"
            @prelude-list-changed="updateCustomPreludes"
            :expansions="expansions"
            :selected="customPreludes"
            @close="showPreludesList = false"
        />
        <ColoniesFilter
            ref="coloniesFilter"
            v-if="showColoniesList"
            @colonies-list-changed="updateCustomColonies"
            :expansions="expansions"
            :selected="customColonies"
            @close="showColoniesList = false"
        />
        <CeosFilter
            ref="ceosFilter"
            v-if="showCeosList"
            @ceo-list-changed="updateCustomCeos"
            :expansions="expansions"
            :selected="customCeos"
            @close="showCeosList = false"
        />
        <div class="create-game--block" v-if="showBannedCards">
          <CardsFilter
              ref="cardsFilter"
              @cards-list-changed="updateBannedCards"
              :title="'Cards to exclude from the game'"
              :hint="'Start typing the card name to exclude'"
          />
        </div>
        <div class="create-game--block" v-if="showIncludedCards">
          <CardsFilter
              ref="cardsFilter2"
              @cards-list-changed="updateIncludedCards"
              :title="'Cards to include in the game'"
              :hint="'Start typing the card name to include'"
          />
        </div>

        <div class="create-game-links">
          <a :href="wikiUrls.changelog" target="_blank" v-i18n>Read our changelog to get the latest updates.</a>
          <span>(<span v-i18n>Looking for people to play with</span>? <a :href="constants.DISCORD_INVITE" target="_blank" v-i18n>Join us on Discord</a>.)</span>
        </div>
      </main>

      <aside class="create-game-side">
        <section class="create-game-players">
          <div class="create-game-players-head">
            <h2 v-i18n>Players</h2>
            <SegmentedControl v-model="playersCount" :options="PLAYER_COUNT_OPTIONS"/>
          </div>
          <div class="create-game-player-list">
            <div v-for="(newPlayer, index) in getPlayers()" :key="index"
              :class="'create-game-player ' + getPlayerContainerColorClass(newPlayer.color)">
              <div class="create-game-player-top">
                <span class="create-game-player-position">{{ index + 1 }}</span>
                <input class="create-game-player-name" :placeholder="getPlayerNamePlaceholder(index)" v-model="newPlayer.name">
                <button v-if="playersCount > 1 && !randomFirstPlayer" type="button" class="create-game-first"
                  :class="{'create-game-first--selected': firstIndex === index + 1}" :title="$t('Goes First?')"
                  @click="firstIndex = index + 1">
                  <span>{{ firstIndex === index + 1 ? '★' : '☆' }}</span>
                  <span v-if="firstIndex === index + 1" v-i18n>Goes first</span>
                </button>
              </div>
              <div class="create-game-swatches">
                <button v-for="color in PLAYER_COLORS" :key="color" type="button"
                  :class="['create-game-swatch', getPlayerCubeColorClass(color), {'create-game-swatch--selected': newPlayer.color === color}]"
                  :disabled="isColorTaken(color, index)" :title="$t(color)"
                  @click="newPlayer.color = color"></button>
              </div>
              <div class="create-game-player-extra">
                <label v-if="isBeginnerToggleEnabled()" class="create-game-player-toggle">
                  <SwitchInput v-model="newPlayer.beginner"/>
                  <span v-i18n>Beginner?</span>
                  <InfoLink :href="wikiUrls.beginnerCorporation"/>
                </label>
                <span class="create-game-player-toggle">
                  <span v-i18n>TR Boost</span>
                  <InfoLink :href="wikiUrls.trBoost"/>
                  <NumberStepper v-model="newPlayer.handicap" :min="0" :max="10"/>
                </span>
              </div>
            </div>
          </div>
        </section>
        <section class="create-game-card create-game-create-card">
          <div class="create-game-summary">
            <span>{{ playersSummary }}</span>
            <span class="capitalized">{{ $t(board) }}</span>
            <span>{{ expansionsSummary }}</span>
          </div>
          <div class="create-game-create-row">
            <AppButton class="create-game-create" title="Create game" size="big" @click="createGame" :disabled="hasBlockingValidationErrors"/>
            <span v-if="hasBlockingValidationErrors" class="create-game-custom-preludes-warning create-game-validation-blocker" @click="showValidationErrors = true">&#9888;&#xFE0E;</span>
            <span v-else-if="hasValidationProblems" class="create-game-validation-warning" @click="showValidationErrors = true">&#9888;&#xFE0F;</span>
          </div>
        </section>
      </aside>
    </div>

    <ValidationErrorsPopup v-if="showValidationErrors" :errors="validationErrors" @close="showValidationErrors = false"/>
  </div>
</template>

<script lang="ts">
import * as constants from '@/common/constants';

import {defineComponent, nextTick} from 'vue';
import {Color, PLAYER_COLORS} from '@/common/Color';
import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {CardName} from '@/common/cards/CardName';
import CeosFilter from '@/client/components/create/CeosFilter.vue';
import CorporationsFilter from '@/client/components/create/CorporationsFilter.vue';
import PreludesFilter from '@/client/components/create/PreludesFilter.vue';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import ColoniesFilter from '@/client/components/create/ColoniesFilter.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import CardsFilter from '@/client/components/create/CardsFilter.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {playerColorClass} from '@/common/utils/utils';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {GameId, JSONObject} from '@/common/Types';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
import {getCard} from '@/client/cards/ClientCardManifest';
import {BoardNameType, NewGameConfig, NewPlayerModel} from '@/common/game/NewGameConfig';
import {vueRoot} from '@/client/components/vueRoot';
import {CreateGameModel} from './CreateGameModel';
import {paths} from '@/common/app/paths';
import {JSONProcessor} from './JSONProcessor';
import {defaultCreateGameModel} from './defaultCreateGameModel';
import {CreateGameSettingsStorage} from './CreateGameSettingsStorage';
import {getColony} from '@/client/colonies/ClientColonyManifest';
import {RULEBOOK_URLS, WIKI, WIKI_URLS} from '@/client/utils/WikiLinks';
import {setDocumentTitle} from '@/client/utils/documentTitle';
import {sanitizeEscapeVelocityOptions} from '@/common/game/escapeVelocity';
import {validateNewGameConfig, validationDetails, ValidationErrors} from '@/common/game/validateNewGameConfig';
import ValidationErrorsPopup from './ValidationErrorsPopup.vue';
import ChoiceChip from './ChoiceChip.vue';
import InfoLink from './InfoLink.vue';
import NumberStepper from './NumberStepper.vue';
import OptionRow from './OptionRow.vue';
import SegmentedControl from './SegmentedControl.vue';
import SwitchInput from './SwitchInput.vue';
import {AGENDA_OPTIONS, FAN_BOARDS, FAN_EXPANSIONS, MILESTONE_OPTIONS, OFFICIAL_BOARDS, OFFICIAL_EXPANSIONS, PLAYER_COUNT_OPTIONS} from './createGameChoices';

const createGameSettingsStorage = new CreateGameSettingsStorage();

type Refs = {
  file: HTMLInputElement;
  cardsFilter: InstanceType<typeof CardsFilter>;
  cardsFilter2: InstanceType<typeof CardsFilter>;
};

type FormModel = {
  showValidationErrors: boolean;
  preludeToggled: boolean;
  uploading: boolean;
  previousViewport: string;
};

export default defineComponent({
  name: 'CreateGameForm',
  data(): CreateGameModel & FormModel {
    return {
      ...defaultCreateGameModel(),
      showValidationErrors: false,
      preludeToggled: false,
      uploading: false,
      previousViewport: '',
    };
  },
  components: {
    AppButton,
    CardsFilter,
    CeosFilter,
    ChoiceChip,
    ColoniesFilter,
    CorporationsFilter,
    InfoLink,
    NumberStepper,
    OptionRow,
    PreludesFilter,
    PreferencesIcon,
    SegmentedControl,
    SwitchInput,
    ValidationErrorsPopup,
  },
  watch: {
    allOfficialExpansions(value: boolean) {
      this.expansions.corpera = value;
      this.expansions.prelude = value;
      this.expansions.venus = value;
      this.expansions.colonies = value;
      this.expansions.turmoil = value;
      this.expansions.prelude2 = value;
      this.expansions.promo = value;
      this.solarPhaseOption = value;
    },
    'expansions.venus': function(value: boolean) {
      this.solarPhaseOption = value;
    },
    'expansions.turmoil': function(value: boolean) {
      if (value === false) {
        this.politicalAgendasExtension = 'Standard';
      }
    },
    initialDraft(value: boolean) {
      if (value === true && this.preludeDraftVariant === undefined) {
        this.preludeDraftVariant = true;
      }
      if (value === true && this.ceosDraftVariant === undefined) {
        this.ceosDraftVariant = true;
      }
    },
    'expansions.prelude': function(value: boolean) {
      if (value === true && this.preludeDraftVariant === undefined) {
        this.preludeDraftVariant = true;
      }
    },
    'expansions.prelude2': function(value: boolean) {
      if (value === true && this.preludeToggled === false && this.uploading === false) {
        this.expansions.prelude = true;
        this.preludeToggled = true;
      }
    },
    playersCount(value: number) {
      if (value === 1) {
        this.expansions.corpera = true;
      }
    },
  },
  mounted() {
    setDocumentTitle('Create New Game');
    this.restoreLastSettings();

    // Set the viewport width to width=device-width on the create game form so mobile browsers use their actual CSS viewport width.
    // The current global viewport is width=1260, which prevents the create game form from using the device width on phones.
    // This is a temporary solution in order to make this edit scoped to the create game form.
    // TODO: Once responsiveness covers the whole project, this code should be removed and the tag in index.html should be updated directly.
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport !== null) {
      this.previousViewport = viewport.getAttribute('content') ?? '';
      viewport.setAttribute(
        'content',
        'width=device-width, initial-scale=1, viewport-fit=cover',
      );
    }
  },
  beforeUnmount() {
    document
      .querySelector('meta[name="viewport"]')
      ?.setAttribute('content', this.previousViewport);
  },
  computed: {
    wikiUrls(): typeof RULEBOOK_URLS & typeof WIKI_URLS {
      return {...RULEBOOK_URLS, ...WIKI_URLS};
    },
    /**
     * The game settings, as they'd be sent to the server.
     *
     * serializeSettings finishes the players and the escape velocity values, and checks the cloned game.
     */
    newGameConfig(): NewGameConfig {
      return {
        players: this.players.slice(0, this.playersCount),
        expansions: this.expansions,
        draftVariant: this.draftVariant,
        showOtherPlayersVP: this.showOtherPlayersVP,
        customCorporationsList: this.customCorporations,
        customColoniesList: this.customColonies,
        customCeos: this.customCeos,
        customPreludes: this.customPreludes,
        bannedCards: this.bannedCards,
        includedCards: this.includedCards,
        board: this.board,
        seed: this.seed,
        solarPhaseOption: this.solarPhaseOption,
        aresExtremeVariant: this.aresExtremeVariant,
        politicalAgendasExtension: this.politicalAgendasExtension,
        undoOption: this.undoOption,
        showTimers: this.showTimers,
        fastModeOption: this.fastModeOption,
        removeNegativeGlobalEventsOption: this.removeNegativeGlobalEventsOption,
        includeFanMA: this.includeFanMA,
        modularMA: this.modularMA,
        startingCorporations: this.startingCorporations,
        soloTR: this.soloTR,
        clonedGamedId: this.seededGame ? this.clonedGameId : undefined,
        initialDraft: this.initialDraft,
        preludeDraftVariant: this.preludeDraftVariant ?? false,
        ceosDraftVariant: this.ceosDraftVariant ?? false,
        randomMA: this.randomMA,
        shuffleMapOption: this.shuffleMapOption,
        randomFirstPlayer: this.randomFirstPlayer,
        requiresVenusTrackCompletion: this.requiresVenusTrackCompletion,
        requiresMoonTrackCompletion: this.requiresMoonTrackCompletion,
        moonStandardProjectVariant: this.moonStandardProjectVariant,
        moonStandardProjectVariant1: this.moonStandardProjectVariant1,
        altVenusBoard: this.altVenusBoard,
        // Not sanitized, so validation can catch negative values.
        escapeVelocity: this.escapeVelocityMode ? {
          thresholdMinutes: this.escapeVelocityThreshold,
          bonusSectionsPerAction: this.escapeVelocityBonusSeconds,
          penaltyPeriodMinutes: this.escapeVelocityPeriod,
          penaltyVPPerPeriod: this.escapeVelocityPenalty,
        } : undefined,
        twoCorpsVariant: this.twoCorpsVariant,
        startingCeos: this.startingCeos,
        startingPreludes: this.startingPreludes,
      };
    },
    validationErrors(): ValidationErrors {
      return validateNewGameConfig(this.newGameConfig, {
        getCardCompatibility: (name) => getCard(name)?.compatibility ?? [],
        getColonyExpansion: (name) => {
          return getColony(name)?.expansion;
        },
      });
    },
    hasValidationProblems(): boolean {
      return Object.values(this.validationErrors).some((value) => Array.isArray(value) ? value.length > 0 : Boolean(value));
    },
    hasBlockingValidationErrors(): boolean {
      return (Object.keys(validationDetails) as Array<keyof ValidationErrors>).some((key) => {
        const value = this.validationErrors[key];
        return validationDetails[key].blocking && (Array.isArray(value) ? value.length > 0 : Boolean(value));
      });
    },
    typedRefs(): Refs {
      return this.$refs as Refs;
    },
    RandomBoardOption(): typeof RandomBoardOption {
      return RandomBoardOption;
    },
    constants(): typeof constants {
      return constants;
    },
    PLAYER_COLORS(): typeof PLAYER_COLORS {
      return PLAYER_COLORS;
    },
    OFFICIAL_EXPANSIONS(): typeof OFFICIAL_EXPANSIONS {
      return OFFICIAL_EXPANSIONS;
    },
    FAN_EXPANSIONS(): typeof FAN_EXPANSIONS {
      return FAN_EXPANSIONS;
    },
    PLAYER_COUNT_OPTIONS(): typeof PLAYER_COUNT_OPTIONS {
      return PLAYER_COUNT_OPTIONS;
    },
    MILESTONE_OPTIONS(): typeof MILESTONE_OPTIONS {
      return MILESTONE_OPTIONS;
    },
    AGENDA_OPTIONS(): typeof AGENDA_OPTIONS {
      return AGENDA_OPTIONS;
    },
    boardGroups() {
      return [
        {title: 'Official', boards: OFFICIAL_BOARDS},
        {title: 'Fan-made', boards: FAN_BOARDS},
      ];
    },
    // Karte "Erweiterungs-Optionen" hat nur Inhalt, wenn eine dieser Erweiterungen aktiv ist
    hasExpansionOptions(): boolean {
      return this.expansions.venus || this.expansions.turmoil || this.expansions.moon || this.expansions.ares;
    },
    playersSummary(): string {
      return this.playersCount === 1 ? translateText('Solo') : translateTextWithParams('${0} players', [String(this.playersCount)]);
    },
    expansionsSummary(): string {
      const count = Object.values(this.expansions).filter((enabled) => enabled).length;
      return count === 1 ? translateText('1 expansion') : translateTextWithParams('${0} expansions', [String(count)]);
    },
  },
  methods: {
    restoreLastSettings() {
      const settings = createGameSettingsStorage.loadSettings();
      if (settings === undefined) {
        return;
      }
      try {
        const processor = this.applySettings(settings);
        if (processor.warnings.length > 0) {
          this.showSettingsLoadResult('Restore settings', processor);
        }
      } catch (e) {
        // TODO(rusliksu): show the restore error in the UI instead of logging only to the console.
        console.warn('Could not restore create game settings:', e);
      }
    },
    applySettings(json: JSONObject): JSONProcessor {
      const component: CreateGameModel = this;
      const refs = this.typedRefs;
      const processor = new JSONProcessor(component);
      this.uploading = true;
      try {
        processor.applyJSON(json);
      } catch (e) {
        this.uploading = false;
        throw e;
      }
      nextTick(() => {
        try {
          if (component.showBannedCards && refs.cardsFilter) {
            refs.cardsFilter.selected = processor.bannedCards;
          }
          if (component.showIncludedCards && refs.cardsFilter2) {
            refs.cardsFilter2.selected = processor.includedCards;
          }
          if (!component.seededGame) {
            component.seed = Math.random();
          }
          component.solarPhaseOption = Boolean(processor.solarPhaseOption);
        } finally {
          this.uploading = false;
        }
      });
      return processor;
    },
    showSettingsLoadResult(title: string, processor: JSONProcessor) {
      const root = vueRoot(this);
      if (processor.warnings.length > 0) {
        root.showAlert(title, 'Settings loaded with these warnings: \n' + processor.warnings.join('\n'));
      } else {
        root.showAlert(title, 'Settings loaded.');
      }
    },
    resetSettings() {
      createGameSettingsStorage.clearSettings();
      Object.assign(this, defaultCreateGameModel(), {
        preludeToggled: false,
        uploading: false,
      });
      nextTick(() => {
        const refs = this.typedRefs;
        if (refs.cardsFilter) {
          refs.cardsFilter.selected = [];
        }
        if (refs.cardsFilter2) {
          refs.cardsFilter2.selected = [];
        }
      });
    },
    async downloadSettings() {
      const newGameConfig = await this.serializeSettings();

      if (newGameConfig) {
        const a = document.createElement('a');
        const blob = new Blob([JSON.stringify(newGameConfig, undefined, 2)], {'type': 'application/json'});
        a.href = window.URL.createObjectURL(blob);
        a.download = 'tm_settings.json';
        a.click();
      }
    },
    uploadSettings() {
      const refs = this.typedRefs;
      const file = refs.file.files !== null ? refs.file.files[0] : undefined;
      const reader = new FileReader();

      reader.addEventListener('load', () => {
        try {
          const readerResults = reader.result;
          if (typeof(readerResults) === 'string') {
            const processor = this.applySettings(JSON.parse(readerResults));
            this.showSettingsLoadResult('Upload settings', processor);
          }
        } catch (e) {
          const root = vueRoot(this);
          root.showAlert('Upload settings', 'Error loading settings ' + e);
        }
      }, false);
      if (file) {
        if (/\.json$/i.test(file.name)) {
          reader.readAsText(file);
        }
      }
    },
    getPlayerNamePlaceholder(index: number): string {
      return translateTextWithParams('Player ${0} name', [String(index + 1)]);
    },
    updateCustomCorporations(customCorporations: Array<CardName>) {
      this.customCorporations = customCorporations;
    },
    updateCustomPreludes(customPreludes: Array<CardName>) {
      this.customPreludes = customPreludes;
    },
    updateBannedCards(bannedCards: Array<CardName>) {
      this.bannedCards = bannedCards;
    },
    updateIncludedCards(includedCards: Array<CardName>) {
      this.includedCards = includedCards;
    },
    updateCustomColonies(customColonies: Array<ColonyName>) {
      this.customColonies = customColonies;
    },
    updateCustomCeos(customCeos: Array<CardName>) {
      this.customCeos = customCeos;
    },
    // Eine Farbe, die schon ein anderer Mitspieler hat, ist nicht wählbar
    isColorTaken(color: Color, index: number): boolean {
      return this.getPlayers().some((player, otherIndex) => otherIndex !== index && player.color === color);
    },
    isRandomBoard(boardName: BoardNameType): boolean {
      return boardName === RandomBoardOption.OFFICIAL || boardName === RandomBoardOption.ALL;
    },
    getPlayers(): Array<NewPlayerModel> {
      return this.players.slice(0, this.playersCount);
    },
    isRandomMAEnabled(): boolean {
      return this.randomMA !== RandomMAOptionType.NONE;
    },
    isPoliticalAgendasExtensionEnabled(): boolean {
      return this.politicalAgendasExtension !== 'Standard';
    },
    politicalAgendasExtensionToggle() {
      if (this.politicalAgendasExtension === 'Standard') {
        this.politicalAgendasExtension = 'Random';
      } else {
        this.politicalAgendasExtension = 'Standard';
      }
    },
    isBeginnerToggleEnabled(): boolean {
      return !(this.initialDraft || this.expansions.prelude || this.expansions.venus || this.expansions.colonies || this.expansions.turmoil);
    },
    deselectVenusCompletion() {
      if (this.expansions.venus === false) {
        this.requiresVenusTrackCompletion = false;
      }
    },
    deselectMoonCompletion() {
      if (this.expansions.moon === false) {
        this.requiresMoonTrackCompletion = false;
        this.moonStandardProjectVariant = false;
        this.moonStandardProjectVariant1 = false;
      }
    },
    getBoardColorClass(boardName: BoardName | BoardNameType): string {
      switch (boardName) {
      case BoardName.THARSIS:
        return 'create-game-board-hexagon create-game-tharsis';
      case BoardName.HELLAS:
        return 'create-game-board-hexagon create-game-hellas';
      case BoardName.ELYSIUM:
        return 'create-game-board-hexagon create-game-elysium';
      case BoardName.UTOPIA_PLANITIA:
        return 'create-game-board-hexagon create-game-utopia-planitia';
      case BoardName.VASTITAS_BOREALIS_NOVA:
        return 'create-game-board-hexagon create-game-vastitas-borealis-nova';
      case BoardName.AMAZONIS:
        return 'create-game-board-hexagon create-game-amazonis';
      case BoardName.ARABIA_TERRA:
        return 'create-game-board-hexagon create-game-arabia-terra';
      case BoardName.TERRA_CIMMERIA:
        return 'create-game-board-hexagon create-game-terra-cimmeria';
      case BoardName.VASTITAS_BOREALIS:
        return 'create-game-board-hexagon create-game-vastitas-borealis';
      case BoardName.HOLLANDIA:
        return 'create-game-board-hexagon create-game-hollandia';
      default:
        return 'create-game-board-hexagon create-game-random';
      }
    },
    getPlayerCubeColorClass(color: Color): string {
      return playerColorClass(color, 'bg');
    },
    getPlayerContainerColorClass(color: Color): string {
      return playerColorClass(color, 'bg_transparent');
    },
    boardHref(boardName: BoardName | RandomBoardOption) {
      const options: Record<BoardName | RandomBoardOption, string> = {
        [BoardName.THARSIS]: 'tharsis',
        [BoardName.HELLAS]: 'hellas',
        [BoardName.ELYSIUM]: 'elysium',
        [BoardName.ARABIA_TERRA]: 'arabia-terra',
        [BoardName.UTOPIA_PLANITIA]: 'utopia-planitia',
        [BoardName.VASTITAS_BOREALIS_NOVA]: 'vastitas-borealis-nova',
        [BoardName.VASTITAS_BOREALIS]: 'vastitas-borealis',
        [BoardName.AMAZONIS]: 'amazonis-planatia',
        [BoardName.TERRA_CIMMERIA]: 'terra-cimmeria',
        [BoardName.TERRA_CIMMERIA_NOVA]: 'terra-cimmeria-nova',
        [BoardName.HOLLANDIA]: 'hollandia',
        [RandomBoardOption.OFFICIAL]: '',
        [RandomBoardOption.ALL]: '',
      };
      return `${WIKI}/Maps#${options[boardName]}`;
    },
    async serializeSettings(): Promise<NewGameConfig | undefined> {
      let players = this.players.slice(0, this.playersCount);

      if (this.randomFirstPlayer) {
        // Shuffle players array to assign each player a random seat around the table
        players = players.map((a) => ({sort: Math.random(), value: a}))
          .sort((a, b) => a.sort - b.sort)
          .map((a) => a.value);
        this.firstIndex = Math.floor(this.seed * this.playersCount) + 1;
      }

      // Auto assign an available color if there are duplicates
      const uniqueColors = new Set(players.map((player) => player.color));
      if (uniqueColors.size !== players.length) {
        const usedColors: Set<Color> = new Set();
        // This filter retains the default player color order.
        const unusedColors = PLAYER_COLORS.filter((c) => !uniqueColors.has(c));
        for (const player of players) {
          const color = player.color;
          if (usedColors.has(color)) {
            // Pulling off the front of the list also helps retain the default player color order.
            player.color = unusedColors.shift() as Color;
            usedColors.add(color);
          } else {
            usedColors.add(color);
          }
        }
      }

      // Set player name automatically if not entered
      const isSoloMode = this.playersCount === 1;

      this.players.forEach((player) => {
        if (player.name === '') {
          if (isSoloMode) {
            player.name = this.$t('You');
          } else {
            const defaultPlayerName = this.$t(player.color.charAt(0).toUpperCase() + player.color.slice(1));
            player.name = defaultPlayerName;
          }
        }
      });

      players.map((player: any) => {
        player.first = (this.firstIndex === player.index);
        return player;
      });

      let clonedGamedId: undefined | GameId = undefined;

      // Clone game checks
      if (this.clonedGameId !== undefined && this.seededGame) {
        const gameData = await fetch(paths.API_CLONEABLEGAME + '?id=' + this.clonedGameId)
          .then((response) => {
            if (response.ok) {
              return response.json();
            }
            if (response.status === 404) {
              return undefined;
            }
            return response.text().then((res) => new Error(res));
          });
        if (gameData === undefined) {
          alert(this.$t('Game id ' + this.clonedGameId + ' not found'));
          return undefined;
        }
        if (gameData instanceof Error) {
          alert(this.$t('Error looking for predefined game ' + gameData.message));
          return undefined;
        }
        clonedGamedId = this.clonedGameId;
        if (gameData.playerCount !== players.length) {
          alert(this.$t('Player count mismatch'));
          this.playersCount = gameData.playerCount;
          return undefined;
        }
      } else if (!this.seededGame) {
        clonedGamedId = undefined;
      }

      const config = this.newGameConfig;
      return {
        ...config,
        players,
        clonedGamedId,
        escapeVelocity: config.escapeVelocity === undefined ? undefined : sanitizeEscapeVelocityOptions(config.escapeVelocity),
      };
    },
    async createGame() {
      if (this.hasBlockingValidationErrors) {
        return;
      }
      const newGameConfig = await this.serializeSettings();

      if (newGameConfig === undefined) {
        return;
      }
      createGameSettingsStorage.saveSettings(newGameConfig);
      const onSuccess = (json: any) => {
        if (json.players.length === 1) {
          window.location.href = 'player?id=' + json.players[0].id;
          return;
        } else {
          window.history.replaceState(json, `${constants.APP_NAME} - Game`, 'game?id=' + json.id);
          vueRoot(this).game = json;
          vueRoot(this).screen = 'game-home';
        }
      };

      fetch(paths.API_CREATEGAME, {'method': 'POST', 'body': JSON.stringify(newGameConfig), 'headers': {'Content-Type': 'application/json'}})
        .then((response) => response.text())
        .then((text) => {
          try {
            const json = JSON.parse(text);
            onSuccess(json);
          } catch (err) {
            throw new Error(text);
          }
        })
        .catch((error: Error) => {
          alert(error.message);
        });
    },
  },
});

</script>
