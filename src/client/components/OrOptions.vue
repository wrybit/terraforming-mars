<template>
  <div :class="['wf-options', {'wf-options--tabs': asTabs}]">
    <!-- A card's decision with its own tabs: instead of the question, the card sits at the top of the box (CardIntroBlock) -->
    <label v-if="showtitle && sourceCard === undefined"><div>{{ $t(playerinput.title) }}</div></label>
    <label v-if="playerinput.warning !== undefined" class="card-warning"><div>({{ $t(playerinput.warning) }})</div></label>

    <!-- Action menu: tabs with short label and count of available entries; empty tabs are dimmed but clickable -->
    <div v-if="asTabs" class="or-tabs" role="tablist">
      <!-- Hand cards always as the first tab (view only); the first real action stays preselected -->
      <HandCardsTab :count="handCards.length" :active="handTabActive" @select="handTabActive = true"/>
      <!-- Display order via tabDisplayOrder (pass/end at the end); idx stays the index in displayedOptions.
           The CEO action has no tab of its own: it is part of the "Actions" tab (ceoActions.ts) -->
      <button v-for="idx in visibleTabOrder" :key="idx"
        :data-option-index="idx"
        type="button"
        role="tab"
        :title="$t(fullTabTitle(tabTitle(idx)))"
        :aria-label="$t(shortTabLabel(tabTitle(idx)))"
        :aria-selected="tabActive(idx)"
        :class="['or-tab', {
          'or-tab--active': !handTabActive && tabActive(idx),
          'or-tab--empty': tabCount(idx) === 0,
          'or-tab--icon': tabIcon(tabTitle(idx)) !== undefined,
          'or-tab--highlight': tabHighlighted(tabTitle(idx)),
          'or-tab--end': isEndTab(tabTitle(idx)),
        }, tabToneClass('or-tab--tone-', displayedOptions[idx])]"
        @click="selectOptionTab(displayedOptions[idx])">
        <OrOptionsTabIcon v-if="tabIcon(tabTitle(idx)) !== undefined" :icon="tabIcon(tabTitle(idx))!"/>
        <span v-else class="or-tab-title">{{ $t(shortTabLabel(tabTitle(idx))) }}</span>
        <span v-if="tabCount(idx) !== undefined" class="or-tab-count">{{ tabCount(idx) }}</span>
      </button>
    </div>

    <!-- In tab mode this container is the box attached to the active tab (content + save) -->
    <div v-docked-tab :class="[{'or-tab-panel': asTabs, 'or-tab-panel--view': asTabs && handTabActive, 'or-tab-panel--end': asTabs && !handTabActive && selectedOption !== undefined && isEndTab(selectedOption.title), 'or-tab-panel--centered-button': asTabs && !handTabActive && selectedOption !== undefined && tabButtonCentered(selectedOption)}, asTabs && !handTabActive ? tabToneClass('or-tab-panel--tone-', selectedOption) : '']" :role="asTabs ? 'tabpanel' : undefined">
      <HandCardsPanel v-if="asTabs && handTabActive" :playerView="playerView"/>
      <!-- Explanation where there would otherwise be just a button (tabIntro.ts): image, what happens, hint -->
      <TabIntroBlock v-if="asTabs && !handTabActive && selectedIntro !== undefined" :intro="selectedIntro" :title="fullTabTitle(selectedOption!.title)" :playerView="playerView" :card="selectedCard"/>
      <CardIntroBlock v-else-if="asTabs && !handTabActive && selectedCard !== undefined && selectedOption !== undefined" :card="selectedCard" :title="fullTabTitle(selectedOption.title)"/>
      <!-- Pass: explanation of what happens (centered with the button, or-tab-panel--end) -->
      <p v-if="asTabs && !handTabActive && selectedOption !== undefined && endTabHint(selectedOption.title) !== undefined" class="or-tab-end-hint">
        {{ $t(endTabHint(selectedOption.title)!) }}
      </p>
      <!-- "Actions" tab with CEO (ceoActions.ts): action cards and below them the own CEO cards as sub-sections,
           headings like in the hand cards tab (only when both sections exist). One card across both sections:
           choosing a CEO resets the action cards, choosing an action card drops the CEO -->
      <div v-if="inActionsGroup" v-show="!handTabActive" class="actions-tab-sections">
        <section v-if="actionsIdx !== -1" class="hand-cards-panel__section">
          <h3 class="hand-cards-panel__title">{{ $t('Action cards') }} <small>{{ availableCount(displayedOptions[actionsIdx]) }}</small></h3>
          <PlayerInputFactory ref="inputfactory" :key="'actions-' + actionsResetKey" @validity="onActionCardsValidity" v-bind="childInputProps(actionsIdx)" />
        </section>
        <section class="hand-cards-panel__section">
          <h3 v-if="actionsIdx !== -1" class="hand-cards-panel__title">{{ $t('CEO') }} <small>{{ ownCeoCards.length }}</small></h3>
          <CeoActionSection :cards="ownCeoCards" :option="ceoOption" :selected="selectedCeo" :groupName="radioElementName + '-ceo'" @select="selectCeo"/>
        </section>
      </div>
      <!-- v-show instead of v-if: inputs of the selected action survive a look at the hand -->
      <PlayerInputFactory v-else-if="asTabs && selectedIdx !== -1" v-show="!handTabActive" ref="inputfactory" @validity="childValid = $event" :key="selectedIdx" v-bind="childInputProps(selectedIdx)" />

      <!-- Choose milestone/award: image tiles as on the board instead of a radio list -->
      <MilestoneAwardOptions v-if="!asTabs && maKind !== undefined"
        :kind="maKind"
        :options="displayedOptions"
        :selected="selectedOption"
        :groupName="radioElementName"
        @select="selectedOption = $event"/>
      <!-- Simple decision (choiceMenu.ts): options as tiles, the selected one pulses like cards;
           a player selection or an option against a player becomes a player tile with the affected resource -->
      <div v-if="!asTabs && maKind === undefined && isChoice" :class="['choice-options', 'choice-block', {'choice-options--players': hasPlayerChoice}]" :style="choiceBlockStyle(choiceTileCount)" role="radiogroup">
        <template v-for="(option, idx) in displayedOptions" :key="idx">
          <!-- Options against a player ("Remove 4 steel from …", playerTargetOption.ts): tiles in that player's color,
               several against the same player as a group with smaller spacing (law of proximity) -->
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
          <!-- further members of a group are already inside it -->
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
          <!-- Remaining options: tile with text; for a resource with icon and own amount before → after -->
          <ChoiceOptionTile v-else
            :title="option.title"
            :player="playerView.thisPlayer"
            :sourceCard="decisionCard"
            :selected="selectedIdx === idx"
            :groupName="radioElementName"
            @select="selectedOption = option"/>
        </template>
      </div>
      <!-- Invisible child input of the selected tile running alongside: saveData() queries its answer
           (player tiles answer themselves, see saveData) -->
      <!-- A card selection or amount behind a tile (card decision, choiceMenu.ts) is visible below the tiles -->
      <PlayerInputFactory v-if="!asTabs && (maKind !== undefined || isChoice) && selectedIdx !== -1 && selectedOption.type !== 'player'" v-show="isInlineInput(selectedOption)"
        ref="inputfactory" :key="selectedIdx" v-bind="childInputProps(selectedIdx)" @validity="childValid = $event"/>

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

      <!-- In a tab box (e.g. simple decision in WaitingForTabs) the button sits in the footer -->
      <TabPanelFooterSlot v-if="!asTabs && showOwnSaveButton()">
        <div class="wf-action or-options-save">
          <AppButton :title="$t(selectedOption.buttonLabel)" type="submit" size="normal" :disabled="!childValid || awaitingPlayer" @click="saveData" />
        </div>
      </TabPanelFooterSlot>

      <!-- Tab mode: sticky footer at the bottom of the box (tabPanelFooter.ts); payment areas hook in via Teleport -->
      <div v-if="asTabs" v-show="!handTabActive" :id="footerId" class="or-tab-footer">
        <!-- Cancel an action that is still only a plan: left in the footer (cancelAction.ts) -->
        <CancelActionButton/>
        <div v-if="showOwnSaveButton()" :class="['wf-action', 'or-tab-save', tabToneClass('or-tab-save--', selectedOption)]">
          <!-- Disabled while the selected option has no valid selection yet (e.g. no card chosen) -->
          <AppButton :title="$t(tabButtonLabel(selectedOption.title, selectedOption.buttonLabel))" type="submit" size="normal" :disabled="!childValid || awaitingCeo" @click="saveData" />
        </div>
      </div>
      <!-- Tab with a single centered button (raise temperature …): nothing has happened yet, Cancel just leaves the tab.
           Own footer bar at the bottom like everywhere else; the centered button keeps its place above it -->
      <div v-if="asTabs && !handTabActive && selectedOption !== undefined && tabButtonCentered(selectedOption) && !isEndTab(selectedOption.title)"
        class="or-tab-footer or-tab-footer--bar">
        <AppButton class="cancel-action-button" :title="$t('Cancel')" @click="handTabActive = true"/>
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
import {INLINE_INPUT_TYPES, isChoiceMenu} from '@/client/components/choiceMenu';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {OR_OPTIONS_AS_TABS} from '@/client/components/orOptionsLayout';
import {fullTabTitle, shortTabLabel, tabButtonLabel, optionTone, tabButtonCentered, endTabHint, isEndTab, tabDisplayOrder, tabHighlighted, tabIcon} from '@/client/components/orOptionsShortLabels';
import {tabIntro, TabIntro} from '@/client/components/tabIntro';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import OrOptionsTabIcon from '@/client/components/OrOptionsTabIcon.vue';
import HandCardsPanel from '@/client/components/HandCardsPanel.vue';
import HandCardsTab from '@/client/components/HandCardsTab.vue';
import MilestoneAwardOptions from '@/client/components/MilestoneAwardOptions.vue';
import PlayerOptionTile from '@/client/components/PlayerOptionTile.vue';
import CardIntroBlock from '@/client/components/CardIntroBlock.vue';
import ChoiceOptionTile from '@/client/components/ChoiceOptionTile.vue';
import CancelActionButton from '@/client/components/CancelActionButton.vue';
import {inputSourceCard, optionSourceCard} from '@/client/components/inputSourceCard';
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
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {Message} from '@/common/logs/Message';
import CeoActionSection from '@/client/components/CeoActionSection.vue';
import {ACTION_CARDS_TITLE, isActionCardsOption, isCeoActionOption, ownCeoCards} from '@/client/utils/ceoActions';

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
    CancelActionButton,
    CeoActionSection,
  },
  setup() {
    const asTabs = inject<boolean>(OR_OPTIONS_AS_TABS, false);
    // Nested selections within this menu stay radio lists
    provide(OR_OPTIONS_AS_TABS, false);
    // Only the tab box offers a footer; nested menus use the outer box's
    const footerId = newTabPanelFooterId();
    if (asTabs) {
      provide(TAB_PANEL_FOOTER, '#' + footerId);
    }
    return {asTabs, footerId};
  },
  data() {
    const originalIndices = displayedOptionIndices(this.playerinput);
    const displayedOptions: Array<PlayerInputModel> = originalIndices.map((index) => this.playerinput.options[index]);
    // initialIdx counts in server order; the display is filtered and reordered (orOptionsDisplayed.ts)
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
      // Hand cards tab (tab mode only) active – independent of the selected action, which is kept
      handTabActive: false,
      // Whether the child input may save (SelectCard reports this via "validity"); other inputs report nothing
      childValid: true,
      // Selected player tile when the decision contains a player selection (choiceMenu.ts)
      selectedPlayer: undefined as ColorWithNeutral | undefined,
      // CEO chosen in the "Actions" tab (CeoActionSection)
      selectedCeo: undefined as CardName | undefined,
      // Raised when a CEO is chosen: remounts the action cards input so its selection is cleared
      actionsResetKey: 0,
    };
  },
  computed: {
    // Card whose effect triggers this decision (only with own tabs; otherwise WaitingForTabs shows it)
    sourceCard(): CardName | undefined {
      return this.asTabs ? inputSourceCard(this.playerinput) : undefined;
    },
    // Card that triggers this decision, also without own tabs: "this card" in option titles refers to it (ChoiceOptionTile)
    decisionCard(): CardName | undefined {
      return inputSourceCard(this.playerinput);
    },
    // Card shown at the top of the box: the input's card, or for a content-free option (only a button)
    // the card it triggers (e.g. corporation first action), so it is clear what the button does
    selectedCard(): CardName | undefined {
      if (this.sourceCard !== undefined || this.selectedOption === undefined || this.selectedOption.type !== 'option') {
        return this.sourceCard;
      }
      return this.asTabs ? optionSourceCard(this.selectedOption) : undefined;
    },
    // Explanation at the top of the selected action's box (tabIntro.ts)
    selectedIntro(): TabIntro | undefined {
      return this.selectedOption === undefined ? undefined : tabIntro(this.selectedOption);
    },
    // Simple decision of plain options as tiles (choiceMenu.ts)
    isChoice(): boolean {
      return isChoiceMenu(this.playerinput);
    },
    // Milestone or award choice as image tiles (milestoneAwardChoice.ts)
    maKind(): MilestoneAwardKind | undefined {
      return milestoneAwardKind(this.playerinput);
    },
    hasPlayerChoice(): boolean {
      return this.isChoice && this.displayedOptions.some((option) => option.type === 'player' || optionTargetPlayer(option) !== undefined);
    },
    // Player selection chosen but no player tapped yet: button disabled
    awaitingPlayer(): boolean {
      return this.selectedOption?.type === 'player' && this.selectedPlayer === undefined;
    },
    // Tiles of the simple decision: one per option, for a player selection one per player (columns of the choice block)
    choiceTileCount(): number {
      return this.displayedOptions.reduce((count, option) => count + (option.type === 'player' ? option.players.length : 1), 0);
    },
    handCards(): Array<CardModel> {
      return allCardsInHand(this.playerView);
    },
    // Only the action menu (tabs) groups the CEO; nested menus never need the tableau
    ownCeoCards(): Array<CardModel> {
      const player = this.playerView.thisPlayer as PlayerViewModel['thisPlayer'] | undefined;
      return this.asTabs && player !== undefined ? ownCeoCards(player) : [];
    },
    actionsIdx(): number {
      return this.asTabs ? this.displayedOptions.findIndex((option) => isActionCardsOption(option)) : -1;
    },
    ceoIdx(): number {
      return this.asTabs ? this.displayedOptions.findIndex((option) => isCeoActionOption(option)) : -1;
    },
    ceoOption(): SelectCardModel | undefined {
      const option = this.ceoIdx === -1 ? undefined : this.displayedOptions[this.ceoIdx];
      return isCeoActionOption(option) ? option : undefined;
    },
    // CEO action and action cards share the "Actions" tab – only when the player has a CEO and one of both is offered
    ceoGrouped(): boolean {
      return this.ownCeoCards.length > 0 && (this.actionsIdx !== -1 || this.ceoIdx !== -1);
    },
    // Tab standing for the group: "Actions", or the CEO action alone when no action card is usable
    groupTabIdx(): number {
      return this.actionsIdx !== -1 ? this.actionsIdx : this.ceoIdx;
    },
    inActionsGroup(): boolean {
      return this.ceoGrouped && this.selectedIdx !== -1 && (this.selectedIdx === this.actionsIdx || this.selectedIdx === this.ceoIdx);
    },
    visibleTabOrder(): Array<number> {
      const order = tabDisplayOrder(this.displayedOptions.map((option) => option.title));
      return this.ceoGrouped && this.actionsIdx !== -1 ? order.filter((idx) => idx !== this.ceoIdx) : order;
    },
    // CEO action selected but no CEO card chosen yet: button disabled
    awaitingCeo(): boolean {
      return this.inActionsGroup && this.selectedIdx === this.ceoIdx && this.selectedCeo === undefined;
    },
  },
  watch: {
    selectedOption(newOption: PlayerInputModel) {
      this.selectedIdx = this.displayedOptions.indexOf(newOption);
      if (this.selectedIdx !== this.ceoIdx) {
        this.selectedCeo = undefined;
      }
      // New child input: valid until it reports otherwise
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
    // First option of a run against the same player (Sabotage: steel or M€); the group starts there
    targetGroupStarts(idx: number): boolean {
      const target = optionTargetPlayer(this.displayedOptions[idx]);
      return target !== undefined && (idx === 0 || optionTargetPlayer(this.displayedOptions[idx - 1]) !== target);
    },
    // Indices of the run against the same player starting at idx
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
      // Back to the "Actions" tab with a CEO already chosen: keep that choice
      if (this.inActionsGroup && this.displayedOptions.indexOf(option) === this.groupTabIdx) {
        return;
      }
      this.selectedOption = option;
    },
    // Title for label, tooltip and icon of a tab: the CEO action alone stands in for the "Actions" tab
    tabTitle(idx: number): string | Message {
      return this.ceoGrouped && idx === this.ceoIdx ? ACTION_CARDS_TITLE : this.displayedOptions[idx].title;
    },
    tabActive(idx: number): boolean {
      return this.ceoGrouped && idx === this.groupTabIdx ? this.inActionsGroup : this.selectedIdx === idx;
    },
    // "Actions" tab counts usable action cards plus usable CEOs
    tabCount(idx: number): number | undefined {
      if (!(this.ceoGrouped && idx === this.groupTabIdx)) {
        return this.availableCount(this.displayedOptions[idx]);
      }
      const members = [this.actionsIdx, this.ceoIdx].filter((member) => member !== -1);
      return members.reduce((sum, member) => sum + (this.availableCount(this.displayedOptions[member]) ?? 0), 0);
    },
    selectCeo(name: CardName) {
      this.selectedCeo = name;
      if (this.ceoIdx !== -1) {
        this.selectedOption = this.displayedOptions[this.ceoIdx];
      }
      this.actionsResetKey++;
    },
    // An action card was chosen: it replaces a chosen CEO; validity only counts while the action cards are selected
    onActionCardsValidity(valid: boolean) {
      if (valid && this.selectedIdx !== this.actionsIdx) {
        this.selectedOption = this.displayedOptions[this.actionsIdx];
        return;
      }
      if (this.selectedIdx === this.actionsIdx) {
        this.childValid = valid;
      }
    },
    choiceBlockStyle,
    shortTabLabel,
    fullTabTitle,
    tabIcon,
    tabDisplayOrder,
    tabButtonLabel,
    tabHighlighted,
    isEndTab,
    tabButtonCentered,
    endTabHint,
    // Color class for the tab/box of pass (green) and end (red), otherwise none
    tabToneClass(prefix: string, option: PlayerInputModel | undefined): string {
      const tone = option === undefined ? undefined : optionTone(option);
      return tone === undefined ? '' : prefix + tone;
    },
    // Shared with WaitingForTabs (inputAvailableCount.ts)
    availableCount(option: PlayerInputModel): number | undefined {
      return inputAvailableCount(option);
    },
    // Shared props for the child input, whether tab or radio presentation
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
      // Tabs are reordered; the ref list follows display order, so look up by option index
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
    // The menu's own button: not when the input has its own, for space selection in tab mode
    // (confirmed via the speech bubble at the space, SpaceConfirmPopover) and when nothing is selectable
    // (count 0, e.g. no standard project affordable)
    showOwnSaveButton(): boolean {
      const option = this.selectedOption;
      if (!this.showsave || option === undefined || this.showChildSaveButton(option)) {
        return false;
      }
      return !(this.asTabs && (option.type === 'space' || this.availableCount(option) === 0));
    },
    // Card decision: card selection/amount visible below the tiles (choiceMenu.ts); plain options stay invisible
    isInlineInput(option: PlayerInputModel): boolean {
      return INLINE_INPUT_TYPES.includes(option.type);
    },
    showChildSaveButton(option: PlayerInputModel): boolean {
      return option.type === 'card' && !(option.max === 1 && option.min === 1);
    },
    saveData() {
      // CEO from the "Actions" tab: answer the CEO action directly with the chosen card
      if (this.inActionsGroup && this.selectedIdx === this.ceoIdx) {
        if (this.selectedCeo !== undefined) {
          this.playerFactorySaved(this.ceoIdx)({type: 'card', cards: [this.selectedCeo]});
        }
        return;
      }
      // Player tile: answer directly, without an invisible SelectPlayer
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

