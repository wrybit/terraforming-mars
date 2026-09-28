<template>
  <div :class="['wf-options', {'wf-options--tabs': asTabs}]">
    <label v-if="showtitle"><div>{{ $t(playerinput.title) }}</div></label>
    <label v-if="playerinput.warning !== undefined" class="card-warning"><div>({{ $t(playerinput.warning) }})</div></label>

    <!-- Aktionsmenü: Tabs mit Kurzlabel und Zähler verfügbarer Einträge; leere Tabs sind abgeschwächt, aber anklickbar -->
    <div v-if="asTabs" class="or-tabs" role="tablist">
      <!-- Handkarten immer als erster Tab (nur Ansicht); vorausgewählt bleibt die erste echte Aktion -->
      <HandCardsTab :count="handCards.length" :active="handTabActive" @select="handTabActive = true"/>
      <!-- Anzeige-Reihenfolge per tabDisplayOrder (Weitergeben/Beenden ans Ende); idx bleibt der Index in displayedOptions -->
      <button v-for="idx in tabDisplayOrder(displayedOptions.map((option) => option.title))" :key="idx"
        :data-option-index="idx"
        type="button"
        role="tab"
        :title="$t(fullTabTitle(displayedOptions[idx].title))"
        :aria-label="$t(shortTabLabel(displayedOptions[idx].title))"
        :aria-selected="selectedIdx === idx"
        :class="['or-tab', {
          'or-tab--active': !handTabActive && selectedIdx === idx,
          'or-tab--empty': availableCount(displayedOptions[idx]) === 0,
          'or-tab--icon': tabIcon(displayedOptions[idx].title) !== undefined,
        }, tabToneClass('or-tab--tone-', displayedOptions[idx])]"
        @click="selectOptionTab(displayedOptions[idx])">
        <OrOptionsTabIcon v-if="tabIcon(displayedOptions[idx].title) !== undefined" :icon="tabIcon(displayedOptions[idx].title)!"/>
        <span v-else class="or-tab-title">{{ $t(shortTabLabel(displayedOptions[idx].title)) }}</span>
        <span v-if="availableCount(displayedOptions[idx]) !== undefined" class="or-tab-count">{{ availableCount(displayedOptions[idx]) }}</span>
      </button>
    </div>

    <!-- Im Tab-Modus ist dieser Container die mit dem aktiven Tab verbundene Box (Inhalt + Speichern) -->
    <div v-docked-tab :class="[{'or-tab-panel': asTabs, 'or-tab-panel--view': asTabs && handTabActive}, asTabs && !handTabActive ? tabToneClass('or-tab-panel--tone-', selectedOption) : '']" :role="asTabs ? 'tabpanel' : undefined">
      <SortableCards v-if="asTabs && handTabActive" :playerId="playerView.id" :cards="handCards"/>
      <!-- Erklärung, wo sonst nur ein Button stünde (tabIntro.ts): Bild, was passiert, Hinweis -->
      <div v-if="asTabs && !handTabActive && selectedIntro !== undefined" class="or-tab-intro">
        <img v-if="selectedIntro.tileImage !== undefined" class="or-tab-intro-tile" :src="selectedIntro.tileImage" alt="">
        <i v-if="selectedIntro.resourceIcon !== undefined" :class="'resource_icon or-tab-intro-resource resource_icon--' + selectedIntro.resourceIcon"></i>
        <div>
          <div class="or-tab-intro-title">{{ $t(fullTabTitle(selectedOption!.title)) }}</div>
          <div v-if="selectedIntro.hint === 'click-space'" class="or-tab-intro-hint" v-i18n>Click a highlighted space on Mars</div>
          <div v-else class="or-tab-intro-hint">{{ $t(temperatureHint(playerView.game.temperature)) }}</div>
        </div>
      </div>
      <!-- v-show statt v-if: Eingaben der gewählten Aktion bleiben beim Blick in die Hand erhalten -->
      <PlayerInputFactory v-if="asTabs && selectedIdx !== -1" v-show="!handTabActive" ref="inputfactory" @validity="childValid = $event" :key="selectedIdx" v-bind="childInputProps(selectedIdx)" />

      <!-- Meilenstein/Auszeichnung wählen: Bild-Kacheln wie auf dem Brett statt Radio-Liste -->
      <MilestoneAwardOptions v-if="!asTabs && maKind !== undefined"
        :kind="maKind"
        :options="displayedOptions"
        :selected="selectedOption"
        :groupName="radioElementName"
        @select="selectedOption = $event"/>
      <!-- Unsichtbar mitlaufender Kind-Input der gewählten Kachel: saveData() fragt dessen Antwort ab -->
      <PlayerInputFactory v-if="!asTabs && maKind !== undefined && selectedIdx !== -1" v-show="false"
        ref="inputfactory" :key="selectedIdx" v-bind="childInputProps(selectedIdx)"/>

      <template v-else-if="!asTabs">
        <div v-for="(option, idx) in displayedOptions" :key="idx">
          <label class="form-radio" ref="optionLabels">
            <input v-model="selectedOption" type="radio" :name="radioElementName" :value="option" >
            <i class="form-icon" ></i>
            <span>{{ $t(option.title) }}</span>
          </label>
          <div v-if="selectedIdx === idx" style="margin-left: 30px">
            <PlayerInputFactory ref="inputfactory" v-bind="childInputProps(idx)" @validity="childValid = $event" />
          </div>
        </div>
      </template>

      <!-- Bei Feldauswahl im Tab-Modus kein Button: bestätigt wird über die Sprechblase am Feld (SpaceConfirmPopover) -->
      <!-- Kein Button, wenn nichts auswählbar ist (Zähler 0, z. B. kein Standardprojekt bezahlbar) -->
      <div v-if="showsave && selectedOption && !showChildSaveButton(selectedOption) && !(asTabs && selectedOption.type === 'space')
        && !(asTabs && availableCount(selectedOption) === 0)" v-show="!(asTabs && handTabActive)">
        <div :class="['wf-action', {'or-tab-save': asTabs}, asTabs && tabButtonTone(selectedOption.title) ? 'or-tab-save--' + tabButtonTone(selectedOption.title) : '']" :style="asTabs ? undefined : 'margin: 5px 30px 10px'">
          <!-- Gesperrt, solange die gewählte Option noch keine gültige Auswahl hat (z. B. keine Karte gewählt) -->
          <AppButton :title="$t(asTabs ? tabButtonLabel(selectedOption.title, selectedOption.buttonLabel) : selectedOption.buttonLabel)" type="submit" size="normal" :disabled="!childValid" @click="saveData" />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">

import {defineComponent, inject, provide} from 'vue';
import {vDockedTab} from '@/client/directives/DockedTab';
import AppButton from '@/client/components/common/AppButton.vue';
import {isHTMLElement} from '@/client/utils/vueUtils';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {OrOptionsModel, PlayerInputModel} from '@/common/models/PlayerInputModel';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {fullTabTitle, shortTabLabel, tabButtonLabel, tabButtonTone, tabDisplayOrder, tabIcon} from '@/client/components/orOptionsShortLabels';
import {tabIntro, temperatureHint, TabIntro} from '@/client/components/tabIntro';
import OrOptionsTabIcon from '@/client/components/OrOptionsTabIcon.vue';
import SortableCards from '@/client/components/SortableCards.vue';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import MilestoneAwardOptions from '@/client/components/MilestoneAwardOptions.vue';
import {milestoneAwardKind, MilestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {allCardsInHand} from '@/client/utils/handCards';
import {CardModel} from '@/common/models/CardModel';

let unique = 0;

export default defineComponent({
  name: 'OrOptions',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => OrOptionsModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: OrOptionsResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  directives: {
    dockedTab: vDockedTab,
  },
  components: {
    AppButton,
    OrOptionsTabIcon,
    SortableCards,
    HandCardsTab,
    MilestoneAwardOptions,
  },
  setup() {
    const asTabs = inject<boolean>(OR_OPTIONS_AS_TABS, false);
    // Verschachtelte Auswahlen innerhalb dieses Menüs bleiben Radio-Listen
    provide(OR_OPTIONS_AS_TABS, false);
    return {asTabs};
  },
  data() {
    const displayedOptions: Array<PlayerInputModel> = [];
    const originalIndices: Array<number> = [];
    this.playerinput.options.forEach((option, i) => {
      if (option.type === 'card' && option.showOnlyInLearnerMode !== false && !getPreferences().learner_mode) {
        return;
      }
      displayedOptions.push(option);
      originalIndices.push(i);
    });
    const initialIdx = this.playerinput.initialIdx ?? 0;
    // Special case: If the first recommended displayed option is SelectProjectCardToPlay, and none of them are enabled, skip it.
    let selectedIdx = initialIdx;
    if (displayedOptions.length > 1 &&
      displayedOptions[initialIdx].type === 'projectCard' &&
      !displayedOptions[initialIdx].cards.some((card) => card.isDisabled !== true)) {
      selectedIdx = initialIdx + 1;
    }
    return {
      displayedOptions,
      originalIndices,
      radioElementName: 'selectOption' + unique++,
      selectedOption: displayedOptions[selectedIdx],
      selectedIdx,
      // Handkarten-Tab (nur im Tab-Modus) aktiv – unabhängig von der gewählten Aktion, die erhalten bleibt
      handTabActive: false,
      // Ob der Kind-Input speichern darf (SelectCard meldet das per "validity"); andere Inputs melden nichts
      childValid: true,
    };
  },
  computed: {
    // Erklärung oben in der Box der gewählten Aktion (tabIntro.ts)
    selectedIntro(): TabIntro | undefined {
      return this.selectedOption === undefined ? undefined : tabIntro(this.selectedOption);
    },
    // Meilenstein- bzw. Auszeichnungswahl als Bild-Kacheln (milestoneAwardChoice.ts)
    maKind(): MilestoneAwardKind | undefined {
      return milestoneAwardKind(this.playerinput);
    },
    handCards(): Array<CardModel> {
      return allCardsInHand(this.playerView);
    },
  },
  watch: {
    selectedOption(newOption: PlayerInputModel) {
      this.selectedIdx = this.displayedOptions.indexOf(newOption);
      // Neuer Kind-Input: gültig, bis er etwas anderes meldet
      this.childValid = true;
      // Clicking the option can shift elements on the page.
      // This preserves the location of the option button the user just clicked by
      // tracking where it was on the screen, where it moved, and then repositioning it.
      const anchorTop = this.getSelectedOptionTop();
      this.$nextTick(() => {
        const newTop = this.getSelectedOptionTop();
        if (anchorTop !== undefined && newTop !== undefined) {
          const delta = newTop - anchorTop;
          if (Math.abs(delta) > 0.5) {
            window.scrollBy(0, delta);
          }
        }
      });
    },
  },
  methods: {
    selectOptionTab(option: PlayerInputModel) {
      this.handTabActive = false;
      this.selectedOption = option;
    },
    shortTabLabel,
    fullTabTitle,
    tabIcon,
    temperatureHint,
    tabDisplayOrder,
    tabButtonLabel,
    tabButtonTone,
    // Farbklasse für Tab bzw. Box von Weitergeben (grün) und Beenden (rot), sonst keine
    tabToneClass(prefix: string, option: PlayerInputModel | undefined): string {
      const tone = option === undefined ? undefined : tabButtonTone(option.title);
      return tone === undefined ? '' : prefix + tone;
    },
    // Gemeinsam mit WaitingForTabs (inputAvailableCount.ts)
    availableCount(option: PlayerInputModel): number | undefined {
      return inputAvailableCount(option);
    },
    // Gemeinsame Props für den Kind-Input, egal ob Tab- oder Radio-Darstellung
    childInputProps(displayedIdx: number) {
      const option = this.displayedOptions[displayedIdx];
      return {
        playerView: this.playerView,
        playerinput: option,
        onsave: this.playerFactorySaved(displayedIdx),
        showsave: this.showsave && this.showChildSaveButton(option),
        showtitle: false,
      };
    },
    getSelectedOptionTop(): number | undefined {
      const element = this.getSelectedOptionLabelElement();
      return element?.getBoundingClientRect().top;
    },
    getSelectedOptionLabelElement(): HTMLElement | undefined {
      const idx = this.selectedIdx;
      // Tabs sind umsortiert; die ref-Liste folgt der Anzeige-Reihenfolge, daher über den Options-Index suchen
      if (this.asTabs) {
        const tab = (this.$el as HTMLElement).querySelector(`[data-option-index="${idx}"]`) ?? undefined;
        return isHTMLElement(tab) ? tab : undefined;
      }
      const optionLabels = this.$refs.optionLabels as HTMLElement | HTMLElement[] | undefined;
      if (idx === -1 || !optionLabels) {
        return undefined;
      }

      const val = Array.isArray(optionLabels) ? optionLabels[idx] : optionLabels;
      return isHTMLElement(val) ? val : undefined;
    },
    playerFactorySaved(displayedIdx: number) {
      const idx = this.originalIndices[displayedIdx];
      return (out: InputResponse) => {
        this.onsave({
          type: 'or',
          index: idx,
          response: out,
        });
      };
    },
    // When the child component is a multi-select card, let it render its own save button.
    // This allows the child to control the button label (e.g. "Sell 3 patents").
    showChildSaveButton(option: PlayerInputModel): boolean {
      return option.type === 'card' && !(option.max === 1 && option.min === 1);
    },
    saveData() {
      let ref = this.$refs['inputfactory'] as {saveData: () => void} | Array<{saveData: () => void}>;
      if (Array.isArray(ref)) {
        ref = ref[0];
      }
      ref.saveData();
    },
  },
});

</script>

