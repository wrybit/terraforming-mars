<template>
  <div class="trade-colony" data-test="trade-colony">
    <!-- Trade reads like a deal (mockup with-extensions): on top what you pay – all three fees, the ones you can't
         afford greyed out –, below what each colony gives you, then a receipt: what you pay → what you get, who else
         gets a colony bonus, where the marker drops back. The board switches to the Colonies tab and previews the pick. -->
    <div class="trade-colony__column trade-colony__column--fees">
      <div class="deal-step__label">{{ $t('You pay') }}</div>
      <div class="trade-colony__fees">
        <button v-for="fee in fees" :key="fee.index" type="button"
          :class="['trade-colony__fee', {'deal-step__tile--on': fee.index === feeIndex}]"
          :data-test="'trade-fee-' + fee.kind"
          @click="feeIndex = fee.index">
          <img :src="'assets/' + FEE_ICON[fee.kind]" alt="">
          <span class="trade-colony__fee-text">
            <b>{{ feeLabel(fee) }}</b>
            <small v-if="stock(fee) !== undefined && fee.amount !== undefined">{{ stock(fee) }} → {{ stock(fee)! - fee.amount }}</small>
          </span>
        </button>
        <span v-for="fee in unavailableFees" :key="fee.kind" class="trade-colony__fee trade-colony__fee--off" :data-test="'trade-fee-off-' + fee.kind">
          <img :src="'assets/' + FEE_ICON[fee.kind]" alt="">
          <span class="trade-colony__fee-text">
            <b>{{ fee.amount }} {{ $t(FEE_NAME[fee.kind]) }}</b>
            <small>{{ haveText(fee.kind) }}</small>
          </span>
        </span>
      </div>
    </div>
    <div class="deal-step__arrow" aria-hidden="true">↓</div>
    <div class="trade-colony__column trade-colony__column--wide">
      <div class="deal-step__label">{{ $t('You get') }}</div>
      <div class="trade-colony__offers">
        <button v-for="colony in colonies" :key="colony.model.name" type="button"
          :class="['trade-colony__offer', {'deal-step__tile--on': colony.model.name === pick, 'trade-colony__offer--off': !isTradeable(colony)}]"
          :disabled="!isTradeable(colony)"
          :data-test="'trade-offer-' + colony.model.name"
          @click="choose(colony)">
          <span class="trade-colony__offer-head">
            <span class="trade-colony__offer-planet">
              <ColonyPlanet :name="colony.model.name"/>
              <TradeShip v-if="colony.model.visitor !== undefined" class="trade-colony__offer-ship" :color="colony.model.visitor" :size="30"/>
            </span>
            <b>{{ $t(colony.model.name) }}</b>
          </span>
          <span class="trade-colony__gain">+{{ colony.tradeValue }}<span :class="{'colonies-board__production': colony.tradeIcon.production}"><img :src="'assets/' + colony.tradeIcon.src" alt=""></span></span>
          <small>{{ offerNote(colony) }}</small>
        </button>
      </div>
      <div v-if="picked !== undefined && selectedFee !== undefined" class="trade-colony__receipt">
        <span class="trade-colony__receipt-line">
          <span class="trade-colony__pay">−{{ selectedFee.amount ?? '' }}<img :src="'assets/' + FEE_ICON[selectedFee.kind]" alt=""></span>
          <i>→</i>
          <span class="trade-colony__get">+{{ picked.tradeValue }}<img :src="'assets/' + picked.tradeIcon.src" alt=""></span>
        </span>
        <small>{{ receiptNote }}</small>
      </div>
      <div v-else class="trade-colony__receipt trade-colony__receipt--empty">{{ $t('Pick a colony …') }}</div>
    </div>
    <TabPanelFooterSlot>
      <div v-if="showsave" class="wf-action">
        <AppButton :title="playerinput.buttonLabel" type="submit" size="normal" @click="saveData" :disabled="!canSave()"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {AndOptionsModel} from '@/common/models/PlayerInputModel';
import {AndOptionsResponse} from '@/common/inputs/InputResponse';
import {ColonyName} from '@/common/colonies/ColonyName';
import {Color} from '@/common/Color';
import {translateMessage, translateText, translateTextWithParams} from '@/client/directives/i18n';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {BoardTabId} from '@/client/components/boardTabs/boardTabs';
import {boardTabState, selectBoardTab} from '@/client/components/boardTabs/boardTabState';
import ColonyPlanet from './ColonyPlanet.vue';
import TradeShip from './TradeShip.vue';
import {ColonyView, colonyView} from './colonyView';
import {setColonyPreview} from './colonyTradeState';
import {FEE_ICON, MissingFee, TradeFee, missingFees, tradeFees, tradeInput} from './tradeInput';

const FEE_NAME: Record<MissingFee['kind'], string> = {megacredits: 'M€', energy: 'Energy', titanium: 'Titanium'};

type DataModel = {
  feeIndex: number;
  pick: ColonyName | undefined;
  previousBoard: BoardTabId;
};

export default defineComponent({
  name: 'TradeColony',
  components: {TabPanelFooterSlot, AppButton, ColonyPlanet, TradeShip},
  props: {
    playerView: {
      type: Object as PropType<PlayerViewModel>,
      required: true,
    },
    playerinput: {
      type: Object as PropType<AndOptionsModel>,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: AndOptionsResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
      default: true,
    },
  },
  data(): DataModel {
    return {
      feeIndex: 0,
      pick: undefined,
      previousBoard: boardTabState.active,
    };
  },
  computed: {
    FEE_ICON(): typeof FEE_ICON {
      return FEE_ICON;
    },
    FEE_NAME(): typeof FEE_NAME {
      return FEE_NAME;
    },
    unavailableFees(): Array<MissingFee> {
      return missingFees(this.fees);
    },
    fees(): Array<TradeFee> {
      const input = tradeInput(this.playerinput);
      return input === undefined ? [] : tradeFees(input.fee);
    },
    selectedFee(): TradeFee | undefined {
      return this.fees.find((fee) => fee.index === this.feeIndex);
    },
    tradeableNames(): ReadonlyArray<ColonyName> {
      return tradeInput(this.playerinput)?.colony.coloniesModel.map((colony) => colony.name) ?? [];
    },
    // All colonies of the game; the ones you can't trade with stay visible but disabled
    colonies(): Array<ColonyView> {
      return this.playerView.game.colonies.map(colonyView);
    },
    picked(): ColonyView | undefined {
      return this.colonies.find((colony) => colony.model.name === this.pick);
    },
    receiptNote(): string {
      const picked = this.picked;
      if (picked === undefined) {
        return '';
      }
      const others = picked.model.colonies.filter((owner) => owner !== this.playerView.thisPlayer.color);
      const drop = translateTextWithParams('${0} marker drops to step ${1}', [translateText(picked.model.name), String(picked.resetPosition + 1)]);
      if (others.length === 0) {
        return drop;
      }
      const bonus = translateTextWithParams('Bonus for ${0}: ${1}', [this.names(others), translateText(picked.metadata.colony.description)]);
      return bonus + ' · ' + drop;
    },
  },
  mounted() {
    // The board shows the colonies while trading and previews the pick there
    selectBoardTab('colonies');
    setColonyPreview('trade', this.pick);
  },
  beforeUnmount() {
    setColonyPreview(undefined);
    if (boardTabState.active === 'colonies') {
      selectBoardTab(this.previousBoard);
    }
  },
  methods: {
    feeLabel(fee: TradeFee): string {
      return typeof fee.title === 'string' ? translateText(fee.title) : translateMessage(fee.title);
    },
    haveText(kind: MissingFee['kind']): string {
      return translateTextWithParams('you have ${0}', [String(this.stockOf(kind))]);
    },
    stockOf(kind: MissingFee['kind']): number {
      const player = this.playerView.thisPlayer;
      return kind === 'megacredits' ? player.megacredits : kind === 'energy' ? player.energy : player.titanium;
    },
    stock(fee: TradeFee): number | undefined {
      const player = this.playerView.thisPlayer;
      switch (fee.kind) {
      case 'megacredits':
        return player.megacredits;
      case 'energy':
        return player.energy;
      case 'titanium':
        return player.titanium;
      default:
        return undefined;
      }
    },
    isTradeable(colony: ColonyView): boolean {
      return this.tradeableNames.includes(colony.model.name);
    },
    names(colors: ReadonlyArray<Color>): string {
      return colors.map((color) => this.playerView.players.find((player) => player.color === color)?.name ?? color).join(', ');
    },
    offerNote(colony: ColonyView): string {
      if (!colony.model.isActive) {
        return translateText('inactive');
      }
      if (colony.model.visitor !== undefined) {
        return translateText('taken');
      }
      if (colony.model.colonies.includes(this.playerView.thisPlayer.color)) {
        return translateText('+ your colony bonus');
      }
      if (colony.model.colonies.length > 0) {
        return translateTextWithParams('Bonus for ${0}', [this.names(colony.model.colonies)]);
      }
      return '';
    },
    choose(colony: ColonyView) {
      this.pick = colony.model.name;
      setColonyPreview('trade', this.pick);
    },
    canSave(): boolean {
      return this.pick !== undefined && this.selectedFee !== undefined;
    },
    saveData() {
      if (!this.canSave() || this.pick === undefined) {
        return;
      }
      this.onsave({
        type: 'and',
        responses: [
          {type: 'or', index: this.feeIndex, response: {type: 'option'}},
          {type: 'colony', colonyName: this.pick},
        ],
      });
    },
  },
});
</script>
