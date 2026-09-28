<template>
  <div class="select-initial-cards">
    <ConfirmDialog
      message="Continue without buying any project cards?"
      ref="confirmation"
      @accept="confirmSelection" />
    <!-- Teile der Startauswahl als Spalten nebeneinander (setup_columns.less): Konzern, Präludien und Karten lassen sich
         direkt vergleichen. Jede Spalte scrollt für sich; Kopf mit Kurztitel, voller Aufforderung und Zähler
         gewählt/benötigt (grün sobald erledigt). -->
    <div class="setup-columns">
      <section v-for="section in sections" :key="section.key" :class="['setup-column', 'setup-column--' + section.key]">
        <header class="setup-column-head">
          <div class="setup-column-title-row">
            <h2 class="setup-column-title">{{ $t(shortTabLabel(section.title)) }}</h2>
            <span :class="['setup-column-count', {'setup-column-count--done': section.done}]">{{ section.badge }}</span>
          </div>
          <div class="setup-column-subtitle">{{ $t(section.title) }}</div>
        </header>
        <div class="setup-column-body">
          <template v-if="section.key === 'corporation'">
            <SelectCard :playerView="playerView" :playerinput="corpCardOption" :showtitle="false" :onsave="noop" @cardschanged="corporationChanged" />
            <div v-if="playerCanChooseAridor" class="player_home_colony_cont">
              <div v-i18n>These are the colony tiles Aridor may choose from:</div>
              <div class="discarded-colonies-for-aridor">
                <div class="player_home_colony small_colony" v-for="colonyName in playerView.game.discardedColonies" :key="colonyName">
                  <Colony :colony="getColony(colonyName)" :active="getColony(colonyName).isActive"/>
                </div>
              </div>
            </div>
          </template>
          <SelectCard v-else-if="section.key === 'prelude'" :playerView="playerView" :playerinput="preludeCardOption" :onsave="noop" :showtitle="false" @cardschanged="preludesChanged" />
          <SelectCard v-else-if="section.key === 'ceo'" :playerView="playerView" :playerinput="ceoCardOption" :onsave="noop" :showtitle="false" @cardschanged="ceosChanged" />
          <SelectCard v-else :playerView="playerView" :playerinput="projectCardOption" :onsave="noop" :showtitle="false" @cardschanged="cardsChanged" />
        </div>
      </section>
    </div>

    <!-- Bilanz (Start-M€, Präludien, Kauf, Status) und "Beginne" gelten für die ganze Auswahl: als Leiste unter den
         Spalten. Früher rechts unter Mars und Meilensteinen – dort passte der Button bei 1080 px Höhe nicht mehr hin. -->
    <div class="select-initial-cards-footer">
      <SetupSummary
        :startMegacredits="corporationMegacredits()"
        :preludeMegacredits="hasPrelude ? getAfterPreludes() : undefined"
        :purchasedCount="selectedCards.length"
        :cardCost="cardCost()"
        :status="warning ?? 'Ready to start'"
        :statusReady="valid && warning === undefined">
        <!-- :key=warning is a way of validing that the state of the button should change. If the warning changes, or disappears, that's a signal that the button might change. -->
        <AppButton :disabled="!valid" v-if="showsave" @click="saveIfConfirmed" type="submit" :title="playerinput.buttonLabel" class="select-initial-cards-start"/>
      </SetupSummary>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent} from 'vue';

import AppButton from '@/client/components/common/AppButton.vue';
import {getCard, getCardOrThrow} from '@/client/cards/ClientCardManifest';
import {CardName} from '@/common/cards/CardName';
import * as constants from '@/common/constants';
import {PlayerInputModel, SelectCardModel, SelectInitialCardsModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import SelectCard from '@/client/components/SelectCard.vue';
import SetupSummary from '@/client/components/SetupSummary.vue';
import {remainingMegacredits} from '@/client/components/setupBalance';
import ConfirmDialog from '@/client/components/common/ConfirmDialog.vue';
import {getPreferences, Preferences, PreferencesManager} from '@/client/utils/PreferencesManager';
import {Tag} from '@/common/cards/Tag';
import {SelectInitialCardsResponse} from '@/common/inputs/InputResponse';
import {CardType} from '@/common/cards/CardType';
import Colony from '@/client/components/colonies/Colony.vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import {ColonyModel, simpleColonyModel} from '@/common/models/ColonyModel';
import * as titles from '@/common/inputs/SelectInitialCards';
import {sum} from '@/common/utils/utils';
import {shortTabLabel} from '@/client/components/orOptionsShortLabels';


type DataModel = {
  selectedCards: Array<CardName>,
  // End result will be a single CEO, but the player may select multiple while deciding what to keep.
  selectedCeos: Array<CardName>,
  // End result will be a single corporation, but the player may select multiple while deciding what to keep.
  selectedCorporations: Array<CardName>,
  selectedPreludes: Array<CardName>,
  valid: boolean,
  warning: string | undefined,
}

type InitialCardsSection = 'corporation' | 'prelude' | 'ceo' | 'projects';

type SectionColumn = {
  key: InitialCardsSection,
  title: string,
  badge: string,
  done: boolean,
};

type Refs = {
  confirmation: InstanceType<typeof ConfirmDialog>;
};

export default defineComponent({
  name: 'SelectInitialCards',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectInitialCardsModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectInitialCardsResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: true,
    },
    showtitle: {
      type: Boolean,
      default: true,
    },
    preferences: {
      type: Object as () => Readonly<Preferences>,
      default: () => PreferencesManager.INSTANCE.values(),
    },
  },
  components: {
    AppButton,
    SelectCard,
    SetupSummary,
    ConfirmDialog,
    Colony,
  },
  data(): DataModel {
    return {
      selectedCards: [],
      selectedCeos: [],
      selectedCorporations: [],
      selectedPreludes: [],
      valid: false,
      warning: undefined,
    };
  },
  methods: {
    shortTabLabel,
    // Badge "gewählt/benötigt" bzw. nur "gewählt", wenn es keine Pflichtanzahl gibt (Karten kaufen)
    sectionColumn(key: InitialCardsSection, input: SelectCardModel, selected: number): SectionColumn {
      const required = input.min > 0 ? input.min : undefined;
      return {
        key,
        title: typeof input.title === 'string' ? input.title : input.title.message,
        badge: required === undefined ? String(selected) : selected + '/' + required,
        done: required !== undefined && selected >= required,
      };
    },
    noop() {
      throw new Error('should not be called');
    },
    getAfterPreludes() {
      return sum(this.selectedPreludes.map((prelude) => {
        const card = getCardOrThrow(prelude);
        const base = card.startingMegaCredits ?? 0;
        return base + this.extra(prelude);
      }));
    },
    extra(prelude: CardName): number {
      const card = getCardOrThrow(prelude);
      switch (this.selectedCorporations.length === 1 ? this.selectedCorporations[0] : undefined) {
      // For each step you increase the production of a resource ... you also gain that resource.
      case CardName.MANUTECH:
        return card.productionBox?.megacredits ?? 0;

      // When you place a city tile, gain 3 M€.
      case CardName.THARSIS_REPUBLIC:
        switch (prelude) {
        case CardName.SELF_SUFFICIENT_SETTLEMENT:
        case CardName.EARLY_SETTLEMENT:
        case CardName.STRATEGIC_BASE_PLANNING:
          return 3;
        }
        return 0;

      // When ANY microbe tag is played ... lose 4 M€ or as much as possible.
      case CardName.PHARMACY_UNION:
        const tags = card.tags.filter((tag) => tag === Tag.MICROBE).length;
        return (-4 * tags);

      // When a microbe tag is played, incl. this, THAT PLAYER gains 2 M€,
      case CardName.SPLICE:
        const microbeTags = card.tags.filter((tag) => tag === Tag.MICROBE).length;
        return (2 * microbeTags);

      // Whenever Venus is terraformed 1 step, you gain 2 M€
      case CardName.APHRODITE:
        switch (prelude) {
        case CardName.VENUS_FIRST:
          return 4;
        case CardName.HYDROGEN_BOMBARDMENT:
          return 2;
        }
        return 0;

      // When any player raises any Moon Rate, gain 1M€ per step.
      case CardName.LUNA_FIRST_INCORPORATED:
        switch (prelude) {
        case CardName.FIRST_LUNAR_SETTLEMENT:
        case CardName.CORE_MINE:
        case CardName.BASIC_INFRASTRUCTURE:
          return 1;
        case CardName.MINING_COMPLEX:
          return 2;
        }
        return 0;

      // When you place an ocean tile, gain 4MC
      case CardName.POLARIS:
        switch (prelude) {
        case CardName.AQUIFER_TURBINES:
        case CardName.POLAR_INDUSTRIES:
          return 4;
        case CardName.GREAT_AQUIFER:
          return 8;
        }
        return 0;

      // Gain 2 MC for each project card in hand.
      case CardName.HEAD_START:
        return this.selectedCards.length * 2;

      // Gain 4MC for playing a card with no tags.
      // Gain 1MC for playing a card with 1 tag.
      case CardName.SAGITTA_FRONTIER_SERVICES:
        const count = card.tags.filter((tag) => tag !== Tag.WILD).length;
        return count === 0 ? 4 : count === 1 ? 1 : 0;

      default:
        return 0;
      }
    },
    // Start-M€ des gewählten Konzerns (vor dem Kartenkauf); undefined, solange nicht genau einer gewählt ist
    corporationMegacredits(): number | undefined {
      if (this.selectedCorporations.length !== 1) {
        return undefined;
      }
      const corpName = this.selectedCorporations[0];
      // The ?? 0 is only because ClientCard applies to _all_ cards.
      const starting = getCardOrThrow(corpName).startingMegaCredits ?? 0;
      // Effect for playing itself.
      return corpName === CardName.SAGITTA_FRONTIER_SERVICES ? starting + 4 : starting;
    },
    // Preis je Startkarte; manche Konzerne (z. B. Polyphemos) weichen vom Standard ab,
    // der Einsteiger-Konzern bekommt seine Karten gratis (wie server/inputs/SelectInitialCards.ts)
    cardCost(): number {
      const corporation = this.selectedCorporations.length === 1 ? getCardOrThrow(this.selectedCorporations[0]) : undefined;
      if (corporation?.name === CardName.BEGINNER_CORPORATION) {
        return 0;
      }
      return corporation?.cardCost ?? constants.CARD_COST;
    },
    saveIfConfirmed() {
      const projectCards = this.selectedCards.filter((name) => getCard(name)?.type !== CardType.PRELUDE);
      let showAlert = false;
      if (this.preferences.show_alerts && projectCards.length === 0) {
        showAlert = true;
      }
      if (showAlert) {
        this.typedRefs.confirmation.show();
      } else {
        this.saveData();
      }
    },
    saveData() {
      const result: SelectInitialCardsResponse = {
        type: 'initialCards',
        responses: [],
      };

      if (this.selectedCorporations.length === 1) {
        result.responses.push({
          type: 'card',
          cards: [this.selectedCorporations[0]],
        });
      }
      if (this.hasPrelude) {
        result.responses.push({
          type: 'card',
          cards: this.selectedPreludes,
        });
      }
      if (this.hasCeo) {
        result.responses.push({
          type: 'card',
          cards: this.selectedCeos,
        });
      }
      result.responses.push({
        type: 'card',
        cards: this.selectedCards,
      });
      this.onsave(result);
    },

    cardsChanged(cards: Array<CardName>) {
      this.selectedCards = cards;
      this.validate();
    },
    ceosChanged(cards: Array<CardName>) {
      this.selectedCeos = cards;
      this.validate();
    },
    corporationChanged(cards: Array<CardName>) {
      this.selectedCorporations = cards;
      this.validate();
    },
    preludesChanged(cards: Array<CardName>) {
      this.selectedPreludes = cards;
      this.validate();
    },

    calcuateWarning(): boolean {
      // Start with warning being empty.
      this.warning = undefined;
      if (this.selectedCorporations.length === 0) {
        this.warning = 'Select a corporation';
        return false;
      }
      if (this.selectedCorporations.length > 1) {
        this.warning = 'You selected too many corporations';
        return false;
      }
      if (this.hasPrelude) {
        if (this.selectedPreludes.length < 2) {
          this.warning = 'Select 2 preludes';
          return false;
        }
        if (this.selectedPreludes.length > 2) {
          this.warning = 'You selected too many preludes';
          return false;
        }
      }
      if (this.hasCeo) {
        if (this.selectedCeos.length < 1) {
          this.warning = 'Select 1 CEO';
          return false;
        }
        if (this.selectedCeos.length > 1) {
          this.warning = 'You selected too many CEOs';
          return false;
        }
      }
      // Kartenkauf zahlt man vom Start-Kapital des Konzerns, bevor Präludien wirken (Server-Prüfung in
      // server/inputs/SelectInitialCards.ts)
      const purchaseCost = this.selectedCards.length * this.cardCost();
      if (purchaseCost > (getCardOrThrow(this.selectedCorporations[0]).startingMegaCredits ?? 0)) {
        this.warning = 'Not enough starting M€ for these cards';
        return false;
      }
      // Auch nach den Präludien darf nichts im Minus stehen (gleiche Rechnung wie die Bilanz, setupBalance.ts)
      const startMegacredits = this.corporationMegacredits() ?? 0;
      if (remainingMegacredits(startMegacredits, this.hasPrelude ? this.getAfterPreludes() : undefined, this.selectedCards.length, this.cardCost()) < 0) {
        this.warning = 'Not enough M€ left after preludes';
        return false;
      }
      if (this.selectedCards.length === 0) {
        this.warning = 'You haven\'t selected any project cards';
        return true;
      }
      return true;
    },
    validate() {
      this.valid = this.calcuateWarning();
    },
    confirmSelection() {
      this.saveData();
    },
    getColony(colonyName: ColonyName): ColonyModel {
      return simpleColonyModel(colonyName);
    },
  },
  computed: {
    // Spalten der Startauswahl in Spielreihenfolge; Präludien und CEO nur, wenn die Erweiterung aktiv ist
    sections(): Array<SectionColumn> {
      const columns = [this.sectionColumn('corporation', this.corpCardOption, this.selectedCorporations.length)];
      if (this.hasPrelude) {
        columns.push(this.sectionColumn('prelude', this.preludeCardOption, this.selectedPreludes.length));
      }
      if (this.hasCeo) {
        columns.push(this.sectionColumn('ceo', this.ceoCardOption, this.selectedCeos.length));
      }
      columns.push(this.sectionColumn('projects', this.projectCardOption, this.selectedCards.length));
      return columns;
    },
    typedRefs(): Refs {
      return this.$refs as Refs;
    },
    playerCanChooseAridor() {
      return this.playerView.dealtCorporationCards.some((card) => card.name === CardName.ARIDOR);
    },
    hasPrelude() {
      return hasOption(this.playerinput.options, titles.SELECT_PRELUDE_TITLE);
    },
    hasCeo() {
      return hasOption(this.playerinput.options, titles.SELECT_CEO_TITLE);
    },
    corpCardOption() {
      const option = getOption(this.playerinput.options, titles.SELECT_CORPORATION_TITLE);
      if (getPreferences().experimental_ui) {
        option.min = 1;
        option.max = option.cards.length;
      }
      return option;
    },
    preludeCardOption() {
      const option = getOption(this.playerinput.options, titles.SELECT_PRELUDE_TITLE);
      if (getPreferences().experimental_ui) {
        option.max = option.cards.length;
      }
      return option;
    },
    ceoCardOption() {
      const option = getOption(this.playerinput.options, titles.SELECT_CEO_TITLE);
      if (getPreferences().experimental_ui) {
        option.max = option.cards.length;
      }
      return option;
    },
    projectCardOption() {
      return getOption(this.playerinput.options, titles.SELECT_PROJECTS_TITLE);
    },
  },
  mounted() {
    this.validate();
  },
});

function getOption(options: Array<PlayerInputModel>, title: string): SelectCardModel {
  const option = options.find((option) => option.title === title);
  if (option === undefined) {
    throw new Error('invalid input, missing option');
  }
  if (option.type !== 'card') {
    throw new Error('invalid input, Not a SelectCard option');
  }
  return option;
}

function hasOption(options: Array<PlayerInputModel>, title: string): boolean {
  const option = options.find((option) => option.title === title);
  return option !== undefined;
}
</script>
