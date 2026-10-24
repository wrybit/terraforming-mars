<template>
  <!-- Prophecy of the CHOAM tab (Jens 24 Oct 2026, _mockups/dune/choam/choam-prototyp.html): three boxes – the order as
       a form (label | control) on the left, what it brings on the right, the own open orders below. Selling binds the
       goods, buying the Solari; the bet premium only for selling. -->
  <div class="choam-order" data-test="choam-prophecy">
    <div class="choam-order__top">
      <div class="choam-card choam-form">
        <h4 class="choam-card__title">{{ $t('Prophecy') }}</h4>
        <div class="choam-form__row">
          <span class="choam-form__label">{{ $t('Direction') }}</span>
          <div class="choam-form__control">
            <div class="exchange-order__sides" role="radiogroup">
              <button v-for="option in SIDES" :key="option" type="button" role="radio" :aria-checked="side === option"
                :disabled="!canSide(option)" :class="['exchange-order__side', {'exchange-order__side--on': side === option}]"
                @click="chooseSide(option)">{{ $t(option === 'sell' ? 'Selling' : 'Buying') }}</button>
            </div>
          </div>
        </div>
        <div class="choam-form__row">
          <span class="choam-form__label">{{ $t('Commodity') }}</span>
          <div class="choam-form__control">
            <div class="trade-select__resources choam-form__goods">
              <button v-for="option in GOODS" :key="option" type="button" :disabled="side === 'sell' && stockOf(option) === 0"
                :class="['trade-select__resource', {'trade-select__resource--selected': option === good}]"
                :title="$t(label(option))" @click="chooseGood(option)">
                <i :class="'resource_icon resource_icon--' + option"></i>
                <span class="trade-select__stock">{{ stockOf(option) }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="choam-form__row">
          <span class="choam-form__label">{{ $t('Amount') }}</span>
          <div class="choam-form__control">
            <div class="amount-slider-plain"><AmountSlider v-model="amount" :min="1" :max="amountMax"/></div>
          </div>
        </div>
        <div class="choam-form__row">
          <span class="choam-form__label">{{ $t(side === 'sell' ? 'Rate from' : 'Rate up to') }}</span>
          <div class="choam-form__control">
            <div class="amount-slider-plain"><AmountSlider v-model="limit" :min="limits.min" :max="limits.max"/></div>
            <p class="choam-info choam-info--left">{{ ratesLine }}</p>
          </div>
        </div>
      </div>

      <div class="choam-card choam-result">
        <h4 class="choam-card__title">{{ $t('If it comes true') }}</h4>
        <div class="choam-result__big">+{{ side === 'sell' ? span : amount }} <img :src="side === 'sell' ? coin : graphic(good)" alt=""></div>
        <ul class="choam-result__list">
          <li><span>{{ $t('Bound now') }}</span><b>{{ bound }} <img :src="side === 'sell' ? graphic(good) : coin" alt=""></b></li>
          <li><span>{{ $t('Withdrawing brings') }}</span><b>{{ refund }} <img :src="side === 'sell' ? graphic(good) : coin" alt=""></b></li>
          <template v-if="side === 'sell'">
            <li><span>{{ $t('Bet premium in it') }}</span><b>+{{ premium }} <img :src="coin" alt=""></b></li>
            <li><span>{{ $t('Sold normally') }}</span><b>{{ amount * todayRate }} <img :src="coin" alt=""></b></li>
          </template>
          <template v-else>
            <li><span>{{ $t('You pay') }}</span><b>{{ span }} <img :src="coin" alt=""></b></li>
            <li><span>{{ $t('Bought normally') }}</span><b>{{ amount * todayRate }} <img :src="coin" alt=""></b></li>
          </template>
        </ul>
        <p :class="['choam-result__status', comesTrue ? 'choam-result__status--yes' : 'choam-result__status--no']">{{ status }}</p>
      </div>
    </div>

    <div class="choam-card choam-open">
      <h4 class="choam-card__title">{{ $t('Your open prophecies') }}</h4>
      <p v-if="orders.length === 0" class="choam-info choam-info--left">{{ $t('No open prophecy') }}</p>
      <div v-for="order in orders" :key="order.id" class="choam-open__row">
        <span class="exchange-order__verb">{{ $t(order.side === 'sell' ? 'Selling' : 'Buying') }}</span>
        <span class="choam-input__goods"><b>{{ order.amount }}</b><img :src="graphic(order.good)" :alt="$t(label(order.good))"></span>
        <span class="exchange-order__condition">{{ order.side === 'sell' ? '≥' : '≤' }} {{ order.limit }}<img :src="coin" alt=""></span>
        <span class="choam-open__note">{{ order.side === 'sell' ? premiumLabel(order.premium) : boundLabel(order.amount * order.limit) }}<img :src="coin" alt=""></span>
        <AppButton size="small" class="choam-input__move choam-input__move--withdraw" :title="$t('Withdraw')"
          :disabled="withdrawIndex(order.id) === -1" @click="$emit('withdraw', withdrawIndex(order.id))"/>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import AmountSlider from '@/client/components/amount/AmountSlider.vue';
import {EXCHANGE_GOODS, ExchangeGood, ExchangeModel, ExchangeSide, NORMAL_RATES, bestRate, orderBound, orderLimits, orderPremium, orderRefund} from '@/common/dune/smugglingExchange';
import {ProphecyModel} from '@/common/dune/DuneModel';
import {PlayerInputModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectTradeResponse} from '@/common/inputs/InputResponse';
import {PROPHECY_BUY_TITLE, PROPHECY_SELL_TITLE, PROPHECY_WITHDRAW_TITLE} from '@/common/dune/duneActionTitles';
import {Resource} from '@/common/Resource';
import {translateTextWithParams} from '@/client/directives/i18n';
import {RESOURCE_LABEL, choiceIndex, resourceGraphic, titleKey} from './choamGraphics';
import {duneGraphic} from './duneGraphic';
import {resourceSnapshot} from '@/client/components/selectPlayerResource';

const SIDES: ReadonlyArray<ExchangeSide> = ['sell', 'buy'];

export default defineComponent({
  name: 'ProphecyPane',
  components: {AppButton, AmountSlider},
  props: {
    playerView: {type: Object as PropType<PlayerViewModel>, required: true},
    options: {type: Array as PropType<ReadonlyArray<PlayerInputModel>>, required: true},
    exchange: {type: Object as PropType<ExchangeModel>, required: true},
    orders: {type: Array as PropType<ReadonlyArray<ProphecyModel>>, required: true},
  },
  emits: ['withdraw', 'ready'],
  data() {
    // Selling by default (spice when there is any, else the first good in stock), buying when there is nothing to sell
    const sells = this.options.some((option) => titleKey(option) === PROPHECY_SELL_TITLE);
    const side: ExchangeSide = sells ? 'sell' : 'buy';
    const inStock = EXCHANGE_GOODS.filter((candidate) => resourceSnapshot(this.playerView.thisPlayer, candidate).stock > 0);
    const good: ExchangeGood = side === 'sell' && !inStock.includes(Resource.TITANIUM) ? (inStock[0] ?? Resource.TITANIUM) : Resource.TITANIUM;
    return {side, good, amount: 1, limit: orderLimits(side, good).max};
  },
  computed: {
    SIDES(): typeof SIDES {
      return SIDES;
    },
    GOODS(): ReadonlyArray<ExchangeGood> {
      return EXCHANGE_GOODS;
    },
    coin(): string {
      return duneGraphic('coin');
    },
    limits(): {min: number, max: number} {
      return orderLimits(this.side, this.good);
    },
    amountMax(): number {
      return Math.max(1, this.side === 'sell' ? this.stockOf(this.good) : Math.floor(this.playerView.thisPlayer.megacredits / this.limit));
    },
    todayRate(): number {
      const board = this.exchange[this.side];
      return board.history[board.history.length - 1][this.good];
    },
    nextRate(): number | undefined {
      return this.exchange[this.side].next?.[this.good];
    },
    best(): number {
      return bestRate(this.side, this.good);
    },
    premium(): number {
      return orderPremium(this.side, this.good, this.amount, this.limit);
    },
    // What the order brings (sell) or costs (buy): at the limit, or at the best rate the exchange can reach
    span(): string {
      const sell = this.side === 'sell';
      const low = sell ? this.amount * this.limit + this.premium : this.amount * this.best;
      const high = sell ? this.amount * this.best + this.premium : this.amount * this.limit;
      return low === high ? String(low) : low + '–' + high;
    },
    bound(): number {
      return orderBound(this.side, this.amount, this.limit);
    },
    refund(): number {
      return orderRefund(this.bound);
    },
    comesTrue(): boolean {
      const next = this.nextRate;
      return next !== undefined && (this.side === 'sell' ? next >= this.limit : next <= this.limit);
    },
    ratesLine(): string {
      const next = this.nextRate === undefined ? '' : ' · G' + (this.playerView.game.generation + 1) + ': ' + this.nextRate;
      return translateTextWithParams('today ${0}', [String(this.todayRate)]) + next + ' · ' +
        translateTextWithParams('normal ${0}', [String(NORMAL_RATES[this.side][this.good])]) + ' · ' +
        translateTextWithParams('at best ${0}', [String(this.best)]);
    },
    status(): string {
      const next = String(this.playerView.game.generation + 1);
      return this.comesTrue ? translateTextWithParams('comes true in G${0}', [next]) :
        translateTextWithParams('G${0}: still waiting · lost at game end', [next]);
    },
    available(): boolean {
      return this.input(this.side) !== undefined;
    },
    // Whether the footer button can place the order now (the tab's button is outside this pane)
    ready(): boolean {
      const enough = this.side === 'sell' ? this.stockOf(this.good) >= this.amount : this.playerView.thisPlayer.megacredits >= this.amount * this.limit;
      return this.available && enough;
    },
  },
  watch: {
    ready: {
      handler(value: boolean): void {
        this.$emit('ready', value);
      },
      immediate: true,
    },
    // A new side or good has new limits and a new most: keep the sliders inside them
    side(): void {
      this.clamp();
    },
    good(): void {
      this.clamp();
    },
    limit(): void {
      this.amount = Math.min(this.amount, this.amountMax);
    },
  },
  methods: {
    graphic(resource: Resource): string {
      return resourceGraphic(resource);
    },
    label(resource: Resource): string {
      return RESOURCE_LABEL[resource];
    },
    stockOf(resource: Resource): number {
      return resourceSnapshot(this.playerView.thisPlayer, resource).stock;
    },
    input(side: ExchangeSide): SelectTradeModel | undefined {
      const title = side === 'sell' ? PROPHECY_SELL_TITLE : PROPHECY_BUY_TITLE;
      return this.options.find((option): option is SelectTradeModel => option.type === 'trade' && titleKey(option) === title);
    },
    canSide(side: ExchangeSide): boolean {
      return this.input(side) !== undefined;
    },
    chooseSide(side: ExchangeSide): void {
      this.side = side;
      // Selling needs a good in stock
      if (side === 'sell' && this.stockOf(this.good) === 0) {
        this.good = EXCHANGE_GOODS.find((good) => this.stockOf(good) > 0) ?? this.good;
      }
      this.limit = side === 'sell' ? orderLimits(side, this.good).max : orderLimits(side, this.good).min;
    },
    chooseGood(good: ExchangeGood): void {
      this.good = good;
      this.limit = this.side === 'sell' ? orderLimits(this.side, good).max : orderLimits(this.side, good).min;
    },
    clamp(): void {
      this.limit = Math.min(this.limits.max, Math.max(this.limits.min, this.limit));
      this.amount = Math.min(Math.max(1, this.amount), this.amountMax);
    },
    premiumLabel(premium: number): string {
      return translateTextWithParams('Premium ${0}', [String(premium)]);
    },
    boundLabel(bound: number): string {
      return translateTextWithParams('Bound ${0}', [String(bound)]);
    },
    withdrawIndex(id: number): number {
      return choiceIndex(this.options, PROPHECY_WITHDRAW_TITLE, id);
    },
    /** The order as the trade the server expects (server/dune/Prophecy.ts), with the index of its choice */
    answer(): {index: number, response: SelectTradeResponse} | undefined {
      const title = this.side === 'sell' ? PROPHECY_SELL_TITLE : PROPHECY_BUY_TITLE;
      const index = this.options.findIndex((option) => titleKey(option) === title);
      if (index === -1 || !this.ready) {
        return undefined;
      }
      const response: SelectTradeResponse = this.side === 'sell' ?
        {type: 'trade', give: this.good, giveAmount: this.amount, get: Resource.MEGACREDITS, getAmount: this.limit} :
        {type: 'trade', give: Resource.MEGACREDITS, giveAmount: this.limit, get: this.good, getAmount: this.amount};
      return {index, response};
    },
  },
});
</script>
