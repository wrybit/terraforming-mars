<template>
    <div class="wf-component wf-component--select-card choice-block" :style="choiceBlockStyle(playerinput.cards?.length ?? 0)">
        <!-- Cards as a choice block (choice_block.less): as square as possible and centered in the tab box;
             comment inside, so the caller's v-show hits the root -->
        <div v-if="showtitle === true" class="nofloat wf-component-title">{{ $t(playerinput.title) }}</div>
        <!-- Header row above the cards: "Select all" on the left, on the right the same sorting as in the hand tab -->
        <div v-if="showSelectAll || isHandSelection" class="select-card-toolbar">
          <AppButton v-if="showSelectAll" class="select-card-toolbar__select-all" size="small" @click="toggleSelectAll"
            :title="allSelected ? $t('Deselect All') : $t('Select All')" />
          <HandSortControl v-if="isHandSelection" :playerView="playerView" class="select-card-toolbar__sort hand-cards-panel__sort"/>
        </div>
        <label v-for="card in getOrderedCards()" :key="card.name" :class="getCardBoxClass(card)">
            <template v-if="!card.isDisabled">
              <input v-if="selectOnlyOneCard" type="radio" v-model="cards" :value="card" >
              <input v-else type="checkbox" v-model="cards" :value="card" :disabled="playerinput.max !== undefined && Array.isArray(cards) && cards.length >= playerinput.max && cards.includes(card) === false" >
            </template>
            <Card :card="card" :actionUsed="isCardActivated(card)" :robotCard="robotCard(card)">
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
            <!-- Disabled while fewer cards are chosen than required: shows that a card must be chosen first.
                 With Skip next to it: Confirm green, Skip red (button_tones.less) -->
            <AppButton :disabled="!hasRequiredSelection" type="submit" @click="saveData" :title="buttonLabel()"
              :class="{'btn-tone-success': isOptionalToManyCards}" />
            <AppButton :disabled="isOptionalToManyCards && cardsSelected() > 0" v-if="isOptionalToManyCards" @click="saveData" type="submit" :title="$t('Skip this action')"
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
import {choiceBlockStyle} from '@/client/components/choiceBlock';

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
    getCardBoxClass(card: CardModel): string {
      if (this.playerinput.showOwner && this.getOwner(card) !== undefined) {
        return 'cardbox cardbox-with-owner-label';
      }
      return 'cardbox';
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
      if (this.selectOnlyOneCard) {
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
      if (this.allSelected) {
        this.cards = [];
      } else {
        this.cards = this.selectableCards.slice();
      }
    },
  },
  computed: {
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
    isOptionalToManyCards(): boolean {
      return this.playerinput.max !== undefined &&
             this.playerinput.max > 1 &&
             this.playerinput.min === 0;
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
      return Array.isArray(this.cards) && this.cards.length === this.selectableCards.length;
    },
  },
});

</script>
