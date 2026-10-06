<template>
    <div class="wf-component wf-component--select-card choice-block" :class="choiceBlockClass(playerinput.cards?.length ?? 0, isHandSelection)" :style="choiceBlockStyle(playerinput.cards?.length ?? 0)">
        <!-- Cards as a choice block (choice_block.less): as square as possible and centered in the tab box;
             comment inside, so the caller's v-show hits the root -->
        <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
        <!-- Header row above the cards: "Select all" on the left, on the right the same sorting as in the hand tab -->
        <!-- Hand cards (e.g. selling): the same filter and sorting as in the hand tab, in one row -->
        <CardFilterBar v-if="isHandSelection" :cards="playerinput.cards" :filter="handCardFilter" :context="filterContext">
          <template #lead>
            <AppButton v-if="showSelectAll" class="select-card-toolbar__select-all" size="small" @click="toggleSelectAll" :title="selectAllTitle" />
          </template>
          <template #sort="{compact}">
            <HandSortControl :playerView="playerView" :compact="compact"/>
          </template>
        </CardFilterBar>
        <!-- Other card lists (buying, actions …): no card size slider – few cards, the zoom only adds noise there;
             "Select all" only where it makes sense -->
        <div v-else-if="showSelectAll" :class="isMobile ? 'select-card-toolbar' : 'card-filter-bar card-filter-bar--plain'">
          <AppButton class="select-card-toolbar__select-all" size="small" @click="toggleSelectAll" :title="selectAllTitle" />
        </div>
        <CardFilterEmptyHint v-if="nothingShown" @reset="resetCardFilter(handCardFilter)"/>
        <label v-for="card in getOrderedCards()" :key="card.name" :class="getCardBoxClass(card)" @click="keepCurrentPick(card)">
            <template v-if="!card.isDisabled">
              <input v-if="selectOnlyOneCard" type="radio" v-model="cards" :value="card" >
              <input v-else type="checkbox" v-model="cards" :value="card" :disabled="playerinput.max !== undefined && Array.isArray(cards) && cards.length >= playerinput.max && cards.includes(card) === false" >
            </template>
            <Card :card="card" :actionUsed="isCardActivated(card)" :robotCard="robotCard(card)">
              <!-- Draft: the card picked this round stays in its place, marked as the current choice that can still be changed;
                   inside the card so the tab sits flush on its border like the selection tab -->
              <span v-if="isCurrentPick(card)" class="current-pick-tab">{{ (cardsSelected() === 0 ? '✓ ' : '') + $t(cardsSelected() === 0 ? 'Your pick – can be changed' : 'Previous pick') }}</span>
              <template v-if="playerinput.showOwner">
                <div :class="'card-owner-label player_translucent_bg_color_'+ getOwner(card).color">
                  {{getOwner(card).name}}
                </div>
              </template>
            </Card>
        </label>
        <div v-if="hasCardWarning()" class="card-warning" v-i18n>{{ warning }}</div>
        <WarningsComponent :warnings="warnings"/>
        <TabPanelFooterSlot>
        <div v-if="showsave === true" class="nofloat select-card-actions">
            <!-- Chosen cards the filter hides are still sold/discarded: say so next to the button -->
            <span v-if="hiddenSelectedCount > 0" class="card-filter-hidden-note">{{ hiddenSelectedText }}</span>
            <!-- Disabled while fewer cards are chosen than required: shows that a card must be chosen first.
                 With Skip next to it: Confirm green, Skip red (button_tones.less) -->
            <!-- Too little money: note left of the buttons (footer, also fine on the phone carousel), buying is disabled;
                 discarding remains so the game can go on -->
            <template v-if="cannotAfford">
              <span class="select-card-unaffordable" v-i18n="affordNote">Not enough money: a card costs ${0} M€, you only have ${1} M€</span>
              <AppButton :disabled="true" type="submit" :title="$t('Buy')" class="btn-tone-success" />
              <AppButton type="submit" @click="saveData" :title="$t('Discard')" class="btn-tone-danger" />
            </template>
            <AppButton v-else :disabled="!hasRequiredSelection" type="submit" @click="saveData" :title="buttonLabel()"
              :class="{'btn-tone-success': isOptionalToManyCards}" />
            <AppButton :disabled="isOptionalToManyCards && cardsSelected() > 0" v-if="isOptionalToManyCards" @click="saveData" type="submit" :title="$t(skipLabel)"
              class="btn-tone-danger" />
        </div>
        </TabPanelFooterSlot>
    </div>
</template>

<script lang="ts">

import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import WarningsComponent from '@/client/components/WarningsComponent.vue';
import HandSortControl from '@/client/components/HandSortControl.vue';
import CardFilterBar from '@/client/components/cardfilter/CardFilterBar.vue';
import {mobileLayout} from '@/client/utils/mobileLayout';
import CardFilterEmptyHint from '@/client/components/cardfilter/CardFilterEmptyHint.vue';
import {CardFilterContext, resetCardFilter} from '@/client/utils/cardFilter';
import {cardVisibility, CardVisibility, handCardFilter, unmatchedCards} from '@/client/utils/cardFilterState';
import {translateTextWithParams} from '@/client/directives/i18n';
import {allCardsInHand} from '@/client/utils/handCards';
import {Color} from '@/common/Color';
import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {CardOrderStorage} from '@/client/utils/CardOrderStorage';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import Card from '@/client/components/card/Card.vue';
import {CardModel} from '@/common/models/CardModel';
import {CardName} from '@/common/cards/CardName';
import {SelectCardModel} from '@/common/models/PlayerInputModel';
import {sortActiveCards} from '@/client/utils/ActiveCardsSortingOrder';
import {SelectCardResponse} from '@/common/inputs/InputResponse';
import {Warning} from '@/common/cards/Warning';
import {choiceBlockClass, choiceBlockStyle} from '@/client/components/choiceBlock';
import {currentDraftPicks} from '@/client/utils/draftedCards';
import {keepDraftCardOrder} from '@/client/utils/draftCardOrder';

type Owner = {
  name: string;
  color: Color;
}

type WidgetDataModel = {
  // The selected item or items
  cards: CardModel | Array<CardModel>;
  warning: string | Message | undefined;
  warnings: ReadonlyArray<Warning> | undefined;
  owners: Map<CardName, Owner>,
}

export default defineComponent({
  name: 'SelectCard',
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectCardModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectCardResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      required: false,
      default: false,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data(): WidgetDataModel {
    return {
      cards: [],
      warning: undefined,
      owners: new Map(),
      warnings: undefined,
    };
  },
  components: {
    TabPanelFooterSlot,
    Card,
    WarningsComponent,
    AppButton,
    HandSortControl,
    CardFilterBar,
    CardFilterEmptyHint,
  },
  watch: {
    cards() {
      this.$emit('cardschanged', this.getData());
    },
    // Reports outward whether saving is allowed – OrOptions uses it to disable its own button
    hasRequiredSelection: {
      handler(valid: boolean) {
        this.$emit('validity', valid);
      },
      immediate: true,
    },
  },
  methods: {
    choiceBlockClass,
    choiceBlockStyle,
    cardsSelected(): number {
      if (Array.isArray(this.cards)) {
        return this.cards.length;
      } else if (this.cards === undefined) {
        return 0;
      }
      return 1;
    },
    getOrderedCards(): ReadonlyArray<CardModel> {
      let cards: ReadonlyArray<CardModel> = [];
      if (this.playerinput.cards !== undefined) {
        if (this.playerinput.selectBlueCardAction) {
          cards = sortActiveCards(this.playerinput.cards);
        } else if (this.isDraft) {
          cards = keepDraftCardOrder(this.playerView.id, this.playerinput.cards);
        } else {
          cards = CardOrderStorage.getOrdered(
            CardOrderStorage.getCardOrder(this.playerView.id),
            this.playerinput.cards,
          );
        }
      }

      if (this.playerinput.showOwner) {
        // Optimization so getOwners isn't repeatedly called.
        this.owners.clear();
        this.playerinput.cards.forEach((card) => {
          const owner = this.findOwner(card);
          if (owner !== undefined) {
            this.owners.set(card.name, owner);
          }
        });
      }
      return cards;
    },
    getData(): Array<CardName> {
      return Array.isArray(this.$data.cards) ? this.$data.cards.map((card) => card.name) : [this.$data.cards.name];
    },
    hasCardWarning() {
      // This is pretty clunky, to be honest.
      if (Array.isArray(this.cards)) {
        if (this.cards.length === 1) {
          this.warnings = this.cards[0].warnings;
        }
        return false;
      } else if (typeof this.cards === 'object') {
        this.warnings = this.cards.warnings;
      }
      return false;
    },

    canSave() {
      const len = this.getData().length;
      if (len > this.playerinput.min) {
        return false;
      }
      if (len < this.playerinput.max) {
        return false;
      }
      return true;
    },
    saveData() {
      this.onsave({type: 'card', cards: this.getData()});
    },
    resetCardFilter,
    visibilityOf(card: CardModel): CardVisibility {
      return this.isHandSelection ? cardVisibility(card, handCardFilter, this.filterContext) : 'shown';
    },
    getCardBoxClass(card: CardModel): string {
      const classes = ['cardbox'];
      const visibility = this.visibilityOf(card);
      if (visibility !== 'shown') {
        classes.push('card-filter-' + visibility);
      }
      if (this.playerinput.showOwner && this.getOwner(card) !== undefined) {
        classes.push('cardbox-with-owner-label');
      }
      if (this.isCurrentPick(card)) {
        classes.push(this.cardsSelected() === 0 ? 'cardbox--current-pick' : 'cardbox--current-pick-replaced');
      }
      if (this.cannotAfford) {
        classes.push('cardbox--unaffordable');
      }
      return classes.join(' ');
    },
    // Already picked in this draft round: the server disables it, because picking it again changes nothing
    isCurrentPick(card: CardModel): boolean {
      return card.isDisabled === true && this.currentPicks.has(card.name);
    },
    // A click on the current pick drops a new choice again – the pick stays as it is
    keepCurrentPick(card: CardModel) {
      if (this.isCurrentPick(card)) {
        this.cards = [];
      }
    },
    findOwner(card: CardModel): Owner | undefined {
      for (const player of this.playerView.players) {
        if (player.tableau.find((c) => c.name === card.name)) {
          return {name: player.name, color: player.color};
        }
      }
      return undefined;
    },
    getOwner(card: CardModel): Owner {
      return this.owners.get(card.name) ?? {name: 'unknown', color: 'neutral'};
    },
    isCardActivated(card: CardModel): boolean {
      // Copied from PlayerMixin.
      return this.playerView.thisPlayer.actionsThisGeneration.includes(card.name);
    },
    buttonLabel(): string | Message {
      // Never "Buy 0": without a selection only the action, the number only counts chosen cards
      if (this.selectOnlyOneCard || this.cardsSelected() === 0) {
        return this.playerinput.buttonLabel;
      }
      return {
        message: this.playerinput.buttonLabel + ' ${0}',
        data: [{
          type: LogMessageDataType.RAW_STRING,
          value: String(this.cardsSelected()),
        }],
      };
    },
    robotCard(card: CardModel): CardModel | undefined {
      return this.playerView.thisPlayer.selfReplicatingRobotsCards?.find((r) => r.name === card.name);
    },
    toggleSelectAll() {
      // Only the cards the filter shows; chosen cards outside the filter stay chosen
      const visible = this.visibleSelectableCards;
      const chosen = Array.isArray(this.cards) ? this.cards : [];
      if (this.allSelected) {
        this.cards = chosen.filter((card) => !visible.includes(card));
      } else {
        this.cards = [...chosen.filter((card) => !visible.includes(card)), ...visible];
      }
    },
  },
  computed: {
    // Phone: cards are fitted to the screen, no size slider
    isMobile(): boolean {
      return mobileLayout.value;
    },
    // Buying with too little money (ChooseCards on the server, e.g. Inventors' Guild with 1 M€): no card can be chosen,
    // so the cards look inactive and a note below says why – otherwise it looks like a broken selection
    cannotAfford(): boolean {
      const title = this.playerinput.title;
      return this.playerinput.max === 0 && (typeof title === 'string' ? title : title.message) === 'You cannot afford any cards';
    },
    // Price per card and own money for the note (stock only; Helion heat would also be below the price here)
    affordNote(): [string, string] {
      const player = this.playerView.thisPlayer;
      return [String(player?.cardCost ?? 3), String(player?.megacredits ?? 0)];
    },
    // Choosing cards in a draft round: their order must stay fixed (draftCardOrder.ts)
    isDraft(): boolean {
      return this.playerView.thisPlayer?.needsToDraft !== undefined;
    },
    currentPicks(): ReadonlySet<CardName> {
      return currentDraftPicks(this.playerView, this.playerinput);
    },
    // Enough cards chosen? Otherwise the button stays disabled instead of showing an error after the click
    hasRequiredSelection(): boolean {
      if (this.isOptionalToManyCards && this.cardsSelected() === 0) {
        return false;
      }
      return this.cardsSelected() >= this.playerinput.min;
    },
    selectOnlyOneCard() : boolean {
      return this.playerinput.max === 1 && this.playerinput.min === 1;
    },
    // Choosing is optional (min 0): the main button is only active with a selection and a second button stands for
    // "none" – never a button like "Buy 0". Also with max 1 (Inventors' Guild: buy the top card or discard it)
    isOptionalToManyCards(): boolean {
      return this.playerinput.max !== undefined &&
             this.playerinput.max >= 1 &&
             this.playerinput.min === 0;
    },
    // Buying: cards not bought are discarded, so the "none" button says what happens
    skipLabel(): string {
      return this.playerinput.buttonLabel === 'Buy' ? 'Discard' : 'Skip this action';
    },
    handCardFilter(): typeof handCardFilter {
      return handCardFilter;
    },
    filterContext(): CardFilterContext {
      return {withCost: true};
    },
    visibleSelectableCards(): Array<CardModel> {
      return this.selectableCards.filter((card) => this.visibilityOf(card) !== 'hidden');
    },
    nothingShown(): boolean {
      return this.isHandSelection && unmatchedCards.value === 'hide' && (this.playerinput.cards ?? []).every((card) => this.visibilityOf(card) !== 'shown');
    },
    selectAllTitle(): string {
      if (this.allSelected) {
        return 'Deselect All';
      }
      const visible = this.visibleSelectableCards.length;
      return visible < this.selectableCards.length ? translateTextWithParams('Select all ${0}', [String(visible)]) : 'Select All';
    },
    hiddenSelectedCount(): number {
      return Array.isArray(this.cards) ? this.cards.filter((card) => this.visibilityOf(card) === 'hidden').length : 0;
    },
    hiddenSelectedText(): string {
      return translateTextWithParams('${0} chosen cards hidden by the filter', [String(this.hiddenSelectedCount)]);
    },
    selectableCards(): Array<CardModel> {
      // ?? []: not every input in the upstream tests provides cards
      return (this.playerinput.cards ?? []).filter((card) => !card.isDisabled);
    },
    // "Select all" if the server requires it or all selectable cards may be taken at once
    // (selling, discarding …) – not if only some may be chosen. Only in dialogs with their own
    // confirm button (showsave); the initial selection (SelectInitialCards) has its own balance bar.
    // Never when buying: every card costs M€, so buying should be a deliberate choice per card
    showSelectAll(): boolean {
      if (!this.showsave || this.selectOnlyOneCard || this.playerinput.selectBlueCardAction || this.selectableCards.length < 2) {
        return false;
      }
      if (this.playerinput.buttonLabel === 'Buy') {
        return false;
      }
      const max = this.playerinput.max ?? this.selectableCards.length;
      return this.playerinput.showSelectAll === true || max >= this.selectableCards.length;
    },
    // Selection from the own hand (selling, discarding …): then the same sorting as in the hand tab is offered
    isHandSelection(): boolean {
      const cards = this.playerinput.cards ?? [];
      if (this.playerinput.selectBlueCardAction || cards.length < 2) {
        return false;
      }
      const hand = new Set(allCardsInHand(this.playerView).map((card) => card.name));
      return cards.every((card) => hand.has(card.name));
    },
    allSelected(): boolean {
      // All cards the filter shows are chosen
      const chosen = Array.isArray(this.cards) ? this.cards : [];
      const visible = this.visibleSelectableCards;
      return visible.length > 0 && visible.every((card) => chosen.includes(card));
    },
  },
});

</script>
