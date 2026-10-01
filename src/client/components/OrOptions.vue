<template>
  <div :class="['wf-options', {'wf-options--tabs': asTabs}]">
    <!-- Entscheidung einer Karte mit eigenen Tabs: statt der Frage steht die Karte oben in der Box (CardIntroBlock) -->
    <label v-if="showtitle && sourceCard === undefined"><div>{{ $t(playerinput.title) }}</div></label>
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
          'or-tab--highlight': tabHighlighted(displayedOptions[idx].title),
          'or-tab--end': isEndTab(displayedOptions[idx].title),
        }, tabToneClass('or-tab--tone-', displayedOptions[idx])]"
        @click="selectOptionTab(displayedOptions[idx])">
        <OrOptionsTabIcon v-if="tabIcon(displayedOptions[idx].title) !== undefined" :icon="tabIcon(displayedOptions[idx].title)!"/>
        <span v-else class="or-tab-title">{{ $t(shortTabLabel(displayedOptions[idx].title)) }}</span>
        <span v-if="availableCount(displayedOptions[idx]) !== undefined" class="or-tab-count">{{ availableCount(displayedOptions[idx]) }}</span>
      </button>
    </div>

    <!-- Im Tab-Modus ist dieser Container die mit dem aktiven Tab verbundene Box (Inhalt + Speichern) -->
    <div v-docked-tab :class="[{'or-tab-panel': asTabs, 'or-tab-panel--view': asTabs && handTabActive, 'or-tab-panel--end': asTabs && !handTabActive && selectedOption !== undefined && isEndTab(selectedOption.title), 'or-tab-panel--centered-button': asTabs && !handTabActive && selectedOption !== undefined && tabButtonCentered(selectedOption.title)}, asTabs && !handTabActive ? tabToneClass('or-tab-panel--tone-', selectedOption) : '']" :role="asTabs ? 'tabpanel' : undefined">
      <HandCardsPanel v-if="asTabs && handTabActive" :playerView="playerView"/>
      <!-- Erklärung, wo sonst nur ein Button stünde (tabIntro.ts): Bild, was passiert, Hinweis -->
      <TabIntroBlock v-if="asTabs && !handTabActive && selectedIntro !== undefined" :intro="selectedIntro" :title="fullTabTitle(selectedOption!.title)" :playerView="playerView" :card="sourceCard"/>
      <CardIntroBlock v-else-if="asTabs && !handTabActive && sourceCard !== undefined && selectedOption !== undefined" :card="sourceCard" :title="fullTabTitle(selectedOption.title)"/>
      <!-- Weitergeben: Erklärung, was passiert (mittig mit dem Button, or-tab-panel--end) -->
      <p v-if="asTabs && !handTabActive && selectedOption !== undefined && endTabHint(selectedOption.title) !== undefined" class="or-tab-end-hint">
        {{ $t(endTabHint(selectedOption.title)!) }}
      </p>
      <!-- v-show statt v-if: Eingaben der gewählten Aktion bleiben beim Blick in die Hand erhalten -->
      <PlayerInputFactory v-if="asTabs && selectedIdx !== -1" v-show="!handTabActive" ref="inputfactory" @validity="childValid = $event" :key="selectedIdx" v-bind="childInputProps(selectedIdx)" />

      <!-- Meilenstein/Auszeichnung wählen: Bild-Kacheln wie auf dem Brett statt Radio-Liste -->
      <MilestoneAwardOptions v-if="!asTabs && maKind !== undefined"
        :kind="maKind"
        :options="displayedOptions"
        :selected="selectedOption"
        :groupName="radioElementName"
        @select="selectedOption = $event"/>
      <!-- Einfache Entscheidung (choiceMenu.ts): Optionen als Kacheln, die gewählte pulsiert wie Karten;
           eine Spielerwahl oder Option gegen einen Spieler wird zur Spieler-Kachel mit der betroffenen Ressource -->
      <div v-if="!asTabs && maKind === undefined && isChoice" :class="['choice-options', 'choice-block', {'choice-options--players': hasPlayerChoice}]" :style="choiceBlockStyle(choiceTileCount)" role="radiogroup">
        <template v-for="(option, idx) in displayedOptions" :key="idx">
          <!-- Optionen gegen einen Spieler ("Entferne 4 Stahl von …", playerTargetOption.ts): Kacheln in dessen Farbe,
               mehrere gegen denselben Spieler als Gruppe mit kleinerem Abstand (Gesetz der Nähe) -->
          <div v-if="targetGroupStarts(idx)" class="player-option-group">
            <PlayerOptionTile v-for="member in targetGroup(idx)" :key="member"
              :color="optionTarget(displayedOptions[member])!"
              :player="findPlayer(optionTarget(displayedOptions[member])!)"
              :effect="optionEffect(displayedOptions[member])"
              :caption="displayedOptions[member].title"
              :selected="selectedIdx === member"
              :groupName="radioElementName"
              @select="selectedOption = displayedOptions[member]"/>
          </div>
          <!-- weitere Mitglieder einer Gruppe stehen schon in ihr -->
          <template v-else-if="optionTarget(option) !== undefined"></template>
          <template v-else-if="option.type === 'player'">
            <PlayerOptionTile v-for="color in option.players" :key="color"
              :color="color"
              :player="findPlayer(color)"
              :effect="optionEffect(option)"
              :selected="selectedIdx === idx && selectedPlayer === color"
              :groupName="radioElementName"
              @select="selectPlayerTile(option, $event)"/>
          </template>
          <!-- Übrige Optionen: Kachel mit Text, bei einer Ressource mit Symbol und eigenem Stand vorher → nachher -->
          <ChoiceOptionTile v-else
            :title="option.title"
            :player="playerView.thisPlayer"
            :selected="selectedIdx === idx"
            :groupName="radioElementName"
            @select="selectedOption = option"/>
        </template>
      </div>
      <!-- Unsichtbar mitlaufender Kind-Input der gewählten Kachel: saveData() fragt dessen Antwort ab
           (Spieler-Kacheln antworten selbst, siehe saveData) -->
      <PlayerInputFactory v-if="!asTabs && (maKind !== undefined || isChoice) && selectedIdx !== -1 && selectedOption.type !== 'player'" v-show="false"
        ref="inputfactory" :key="selectedIdx" v-bind="childInputProps(selectedIdx)"/>

      <template v-else-if="!asTabs && !isChoice">
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

      <!-- In einer Tab-Box (z. B. einfache Entscheidung in WaitingForTabs) sitzt der Button unten im Fuß -->
      <TabPanelFooterSlot v-if="!asTabs && showOwnSaveButton()">
        <div class="wf-action or-options-save">
          <AppButton :title="$t(selectedOption.buttonLabel)" type="submit" size="normal" :disabled="!childValid || awaitingPlayer" @click="saveData" />
        </div>
      </TabPanelFooterSlot>

      <!-- Tab-Modus: klebender Fußbereich unten an der Box (tabPanelFooter.ts); Bezahlbereiche hängen sich per Teleport ein -->
      <div v-if="asTabs" v-show="!handTabActive" :id="footerId" class="or-tab-footer">
        <div v-if="showOwnSaveButton()" :class="['wf-action', 'or-tab-save', tabButtonTone(selectedOption.title) ? 'or-tab-save--' + tabButtonTone(selectedOption.title) : '']">
          <!-- Gesperrt, solange die gewählte Option noch keine gültige Auswahl hat (z. B. keine Karte gewählt) -->
          <AppButton :title="$t(tabButtonLabel(selectedOption.title, selectedOption.buttonLabel))" type="submit" size="normal" :disabled="!childValid" @click="saveData" />
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
import {InputResponse, OrOptionsResponse} from '@/common/inputs/InputResponse';
import {TAB_PANEL_FOOTER, newTabPanelFooterId} from '@/client/components/tabPanelFooter';
import {isChoiceMenu} from '@/client/components/choiceMenu';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {fullTabTitle, shortTabLabel, tabButtonLabel, tabButtonTone, tabButtonCentered, endTabHint, isEndTab, tabDisplayOrder, tabHighlighted, tabIcon} from '@/client/components/orOptionsShortLabels';
import {tabIntro, TabIntro} from '@/client/components/tabIntro';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import OrOptionsTabIcon from '@/client/components/OrOptionsTabIcon.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import MilestoneAwardOptions from '@/client/components/MilestoneAwardOptions.vue';
import PlayerOptionTile from '@/client/components/PlayerOptionTile.vue';
import CardIntroBlock from '@/client/components/CardIntroBlock.vue';
import ChoiceOptionTile from '@/client/components/ChoiceOptionTile.vue';
import {inputSourceCard} from '@/client/components/inputSourceCard';
import {CardName} from '@/common/cards/CardName';
import {PlayerEffect, playerEffect} from '@/client/components/selectPlayerResource';
import {optionTargetPlayer} from '@/client/components/playerTargetOption';
import {Color, ColorWithNeutral} from '@/common/Color';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {milestoneAwardKind, MilestoneAwardKind} from '@/client/components/milestoneAwardChoice';
import {inputAvailableCount} from '@/client/components/inputAvailableCount';
import {displayedOptionIndices} from '@/client/components/orOptionsDisplayed';
import {allCardsInHand} from '@/client/utils/handCards';
import {choiceBlockStyle} from '@/client/components/choiceBlock';
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
    TabPanelFooterSlot,
    TabIntroBlock,
    AppButton,
    OrOptionsTabIcon,
    HandCardsPanel,
    HandCardsTab,
    MilestoneAwardOptions,
    PlayerOptionTile,
    CardIntroBlock,
    ChoiceOptionTile,
  },
  setup() {
    const asTabs = inject<boolean>(OR_OPTIONS_AS_TABS, false);
    // Verschachtelte Auswahlen innerhalb dieses Menüs bleiben Radio-Listen
    provide(OR_OPTIONS_AS_TABS, false);
    // Nur die Tab-Box bietet einen Fußbereich an; verschachtelte Menüs nutzen den der äußeren Box
    const footerId = newTabPanelFooterId();
    if (asTabs) {
      provide(TAB_PANEL_FOOTER, '#' + footerId);
    }
    return {asTabs, footerId};
  },
  data() {
    const originalIndices = displayedOptionIndices(this.playerinput);
    const displayedOptions: Array<PlayerInputModel> = originalIndices.map((index) => this.playerinput.options[index]);
    // initialIdx zählt in Server-Reihenfolge; die Anzeige ist gefiltert und umsortiert (orOptionsDisplayed.ts)
    const initialIdx = Math.max(0, originalIndices.indexOf(this.playerinput.initialIdx ?? 0));
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
      // Gewählte Spieler-Kachel, wenn die Entscheidung eine Spielerwahl enthält (choiceMenu.ts)
      selectedPlayer: undefined as ColorWithNeutral | undefined,
    };
  },
  computed: {
    // Karte, deren Wirkung diese Entscheidung auslöst (nur mit eigenen Tabs; sonst zeigt WaitingForTabs sie)
    sourceCard(): CardName | undefined {
      return this.asTabs ? inputSourceCard(this.playerinput) : undefined;
    },
    // Erklärung oben in der Box der gewählten Aktion (tabIntro.ts)
    selectedIntro(): TabIntro | undefined {
      return this.selectedOption === undefined ? undefined : tabIntro(this.selectedOption);
    },
    // Einfache Entscheidung aus reinen Optionen als Kacheln (choiceMenu.ts)
    isChoice(): boolean {
      return isChoiceMenu(this.playerinput);
    },
    // Meilenstein- bzw. Auszeichnungswahl als Bild-Kacheln (milestoneAwardChoice.ts)
    maKind(): MilestoneAwardKind | undefined {
      return milestoneAwardKind(this.playerinput);
    },
    hasPlayerChoice(): boolean {
      return this.isChoice && this.displayedOptions.some((option) => option.type === 'player' || optionTargetPlayer(option) !== undefined);
    },
    // Spielerwahl ausgewählt, aber noch kein Spieler angetippt: Button gesperrt
    awaitingPlayer(): boolean {
      return this.selectedOption?.type === 'player' && this.selectedPlayer === undefined;
    },
    // Kacheln der einfachen Entscheidung: eine je Option, bei einer Spielerwahl eine je Spieler (Spalten des Auswahl-Blocks)
    choiceTileCount(): number {
      return this.displayedOptions.reduce((count, option) => count + (option.type === 'player' ? option.players.length : 1), 0);
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
    findPlayer(color: ColorWithNeutral): PublicPlayerModel | undefined {
      return this.playerView.players.find((player) => player.color === color);
    },
    optionEffect(option: PlayerInputModel): PlayerEffect | undefined {
      return playerEffect(option.title);
    },
    optionTarget(option: PlayerInputModel): Color | undefined {
      return optionTargetPlayer(option);
    },
    // Erste Option einer Folge gegen denselben Spieler (Sabotage: Stahl oder M€); dort beginnt die Gruppe
    targetGroupStarts(idx: number): boolean {
      const target = optionTargetPlayer(this.displayedOptions[idx]);
      return target !== undefined && (idx === 0 || optionTargetPlayer(this.displayedOptions[idx - 1]) !== target);
    },
    // Indizes der Folge gegen denselben Spieler ab idx
    targetGroup(idx: number): Array<number> {
      const target = optionTargetPlayer(this.displayedOptions[idx]);
      const members: Array<number> = [];
      for (let member = idx; member < this.displayedOptions.length && optionTargetPlayer(this.displayedOptions[member]) === target; member++) {
        members.push(member);
      }
      return members;
    },
    selectPlayerTile(option: PlayerInputModel, color: ColorWithNeutral) {
      this.selectedOption = option;
      this.selectedPlayer = color;
    },
    selectOptionTab(option: PlayerInputModel) {
      this.handTabActive = false;
      this.selectedOption = option;
    },
    choiceBlockStyle,
    shortTabLabel,
    fullTabTitle,
    tabIcon,
    tabDisplayOrder,
    tabButtonLabel,
    tabButtonTone,
    tabHighlighted,
    isEndTab,
    tabButtonCentered,
    endTabHint,
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
    // Eigener Button des Menüs: nicht, wenn die Eingabe selbst einen hat, bei Feldauswahl im Tab-Modus
    // (bestätigt wird über die Sprechblase am Feld, SpaceConfirmPopover) und wenn nichts auswählbar ist
    // (Zähler 0, z. B. kein Standardprojekt bezahlbar)
    showOwnSaveButton(): boolean {
      const option = this.selectedOption;
      if (!this.showsave || option === undefined || this.showChildSaveButton(option)) {
        return false;
      }
      return !(this.asTabs && (option.type === 'space' || this.availableCount(option) === 0));
    },
    showChildSaveButton(option: PlayerInputModel): boolean {
      return option.type === 'card' && !(option.max === 1 && option.min === 1);
    },
    saveData() {
      // Spieler-Kachel: Antwort direkt, ohne unsichtbaren SelectPlayer
      if (!this.asTabs && this.isChoice && this.selectedOption?.type === 'player') {
        if (this.selectedPlayer !== undefined) {
          this.playerFactorySaved(this.selectedIdx)({type: 'player', player: this.selectedPlayer});
        }
        return;
      }
      let ref = this.$refs['inputfactory'] as {saveData: () => void} | Array<{saveData: () => void}>;
      if (Array.isArray(ref)) {
        ref = ref[0];
      }
      ref.saveData();
    },
  },
});

</script>

