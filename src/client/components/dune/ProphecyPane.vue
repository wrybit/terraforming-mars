<template>
  <!-- Prophecy of the CHOAM tab (Jens 24 and 25 Oct 2026, _mockups/dune/choam/prophezeiung-rechner.html): the order as
       a form on the left (direction, good, 2 to 8 units; the rate is fixed one step better than normal), the sum for
       that first better rate on the right, below the chart for every rate the guild can set, then the own open
       orders. Selling counts the units, buying the Solari (a budget; common/dune/prophecyOutcome.ts). -->
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
              <button v-for="option in GOODS" :key="option" type="button" :disabled="!canGood(option)"
                :class="['trade-select__resource', {'trade-select__resource--selected': option === good}]"
                :title="$t(label(option))" @click="chooseGood(option)">
                <i :class="'resource_icon resource_icon--' + option"></i>
                <span class="trade-select__stock">{{ stockOf(option) }}</span>
              </button>
            </div>
          </div>
        </div>
        <div class="choam-form__row">
          <span class="choam-form__label">{{ $t(side === 'sell' ? 'Amount' : 'Budget') }}</span>
          <div class="choam-form__control">
            <div class="amount-slider-plain"><AmountSlider v-model="amount" :min="MIN_UNITS" :max="amountMax" :shownPerStep="side === 'buy' ? normal : 1"/></div>
            <p class="choam-info choam-info--left">{{ amountLine }}</p>
          </div>
        </div>
      </div>

      <!-- The sum like on paper: normal, at the first better rate, what the rate adds, the premium, the sum -->
      <div class="choam-card choam-sum">
        <h4 class="choam-card__title">{{ sumTitle }}</h4>
        <ul class="choam-sum__list">
          <li v-for="line in sumLines" :key="line.label" :class="'choam-sum__line choam-sum__line--' + line.kind">
            <span>{{ line.label }}</span><span class="choam-sum__way">{{ line.way }}</span><b>{{ line.value }}</b>
          </li>
        </ul>
        <p class="choam-info choam-info--left">{{ boundLine }}</p>
      </div>
    </div>

    <div class="choam-card choam-chart">
      <h4 class="choam-card__title">{{ $t('What you get, per rate') }}</h4>
      <div class="choam-chart__keys">
        <span><i class="choam-chart__key choam-chart__key--base"></i>{{ $t('normal') }}</span>
        <span><i class="choam-chart__key choam-chart__key--market"></i>{{ $t('more from the rate') }}</span>
        <span><i class="choam-chart__key choam-chart__key--premium"></i>{{ $t('Bet premium') }}</span>
      </div>
      <ProphecyChart :side="side" :good="good" :units="amount" :nextRate="nextRate" :nextGeneration="playerView.game.generation + 1"/>
    </div>

    <div class="choam-card choam-open">
      <h4 class="choam-card__title">{{ $t('Your open prophecies') }}</h4>
      <p v-if="orders.length === 0" class="choam-info choam-info--left">{{ $t('No open prophecy') }}</p>
      <!-- Each order in figures (Jens 25 Oct 2026): what it binds, what the same goods are worth at the normal rate,
           and what it brings when it comes true; below the bound goods what withdrawing gives back -->
      <div v-for="order in orders" :key="order.id" class="choam-open__row choam-prophecy">
        <div class="choam-prophecy__order">
          <span class="exchange-order__verb">{{ $t(order.side === 'sell' ? 'Selling' : 'Buying') }}</span>
          <span class="choam-input__goods"><b>{{ order.amount }}</b><img :src="graphic(order.good)" :alt="$t(label(order.good))"></span>
          <span class="exchange-order__condition">{{ order.side === 'sell' ? '≥' : '≤' }} {{ order.limit }}<img :src="coin" alt=""></span>
        </div>
        <div class="choam-prophecy__figures">
          <div class="choam-prophecy__figure">
            <span class="choam-prophecy__label">{{ $t('Bound') }}</span>
            <span class="choam-prophecy__value"><template v-if="order.side === 'sell'">{{ order.amount }}<img :src="graphic(order.good)" alt=""></template><template v-else>{{ boundOf(order) }}<img :src="coin" alt=""></template></span>
          </div>
          <div class="choam-prophecy__figure">
            <span class="choam-prophecy__label">{{ $t('Normal rate') }}</span>
            <span v-if="order.budget !== undefined" class="choam-prophecy__value">{{ order.amount }}<img :src="graphic(order.good)" alt=""></span>
            <span v-else class="choam-prophecy__value">{{ normalWorth(order) }}<img :src="coin" alt=""></span>
          </div>
          <div class="choam-prophecy__figure choam-prophecy__figure--gain">
            <span class="choam-prophecy__label">{{ $t('If it comes true') }}</span>
            <!-- The note right after the icon, so the column keeps two lines like the others (Jens 25 Oct 2026) -->
            <span v-if="order.side === 'sell'" class="choam-prophecy__value">≥ {{ order.amount * order.limit + order.premium }}<img :src="coin" alt="">
              <span class="choam-prophecy__hint">{{ premiumLabel(order.premium) }}</span></span>
            <span v-else-if="order.budget !== undefined" class="choam-prophecy__value">≥ {{ budgetUnits(order) }}<img :src="graphic(order.good)" alt="">
              <span class="choam-prophecy__hint">{{ premiumLabel(1) }}</span></span>
            <span v-else class="choam-prophecy__value">+{{ order.amount }}<img :src="graphic(order.good)" alt="">
              <span class="choam-prophecy__hint">{{ savingLabel(order) }}</span></span>
          </div>
        </div>
        <div class="choam-prophecy__withdraw">
          <AppButton size="small" class="choam-input__move choam-input__move--withdraw" :title="$t('Withdraw')"
            :disabled="withdrawIndex(order.id) === -1" @click="$emit('withdraw', withdrawIndex(order.id))"/>
          <span class="choam-prophecy__hint">{{ withdrawCostLabel(order) }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import AmountSlider from '@/client/components/amount/AmountSlider.vue';
import {EXCHANGE_GOODS, ExchangeGood, ExchangeModel, ExchangeSide, NORMAL_RATES, orderBound, orderRefund} from '@/common/dune/smugglingExchange';
import {
  PROPHECY_MAX_UNITS, PROPHECY_MIN_UNITS, prophecyBudget, prophecyLimit, prophecyOutcome, prophecyPremium,
} from '@/common/dune/prophecyOutcome';
import ProphecyChart from './ProphecyChart.vue';
import {ProphecyModel} from '@/common/dune/DuneModel';
import {PlayerInputModel, SelectTradeModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectTradeResponse} from '@/common/inputs/InputResponse';
import {PROPHECY_BUY_TITLE, PROPHECY_SELL_TITLE, PROPHECY_WITHDRAW_TITLE} from '@/common/dune/duneActionTitles';
import {Resource} from '@/common/Resource';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {RESOURCE_LABEL, choiceIndex, resourceGraphic, titleKey} from './choamGraphics';
import {duneGraphic} from './duneGraphic';
import {resourceSnapshot} from '@/client/components/selectPlayerResource';

const SIDES: ReadonlyArray<ExchangeSide> = ['sell', 'buy'];

export default defineComponent({
  name: 'ProphecyPane',
  components: {AppButton, AmountSlider, ProphecyChart},
  props: {
    playerView: {type: Object as PropType<PlayerViewModel>, required: true},
    options: {type: Array as PropType<ReadonlyArray<PlayerInputModel>>, required: true},
    exchange: {type: Object as PropType<ExchangeModel>, required: true},
    orders: {type: Array as PropType<ReadonlyArray<ProphecyModel>>, required: true},
  },
  emits: ['withdraw', 'ready'],
  data() {
    // Selling by default (spice when there is enough, else the first good with enough), buying when nothing can be sold
    const sells = this.options.some((option) => titleKey(option) === PROPHECY_SELL_TITLE);
    const side: ExchangeSide = sells ? 'sell' : 'buy';
    const enough = EXCHANGE_GOODS.filter((candidate) => resourceSnapshot(this.playerView.thisPlayer, candidate).stock >= PROPHECY_MIN_UNITS);
    const good: ExchangeGood = side === 'sell' && !enough.includes(Resource.TITANIUM) ? (enough[0] ?? Resource.TITANIUM) : Resource.TITANIUM;
    return {side, good, amount: PROPHECY_MIN_UNITS};
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
    MIN_UNITS(): number {
      return PROPHECY_MIN_UNITS;
    },
    limit(): number {
      return prophecyLimit(this.side, this.good);
    },
    normal(): number {
      return NORMAL_RATES[this.side][this.good];
    },
    budget(): number {
      return prophecyBudget(this.good, this.amount);
    },
    // Selling: up to the stock; buying: up to what the Solari pay for at the normal rate; both 2 … 8
    amountMax(): number {
      const most = this.side === 'sell' ? this.stockOf(this.good) : Math.floor(this.playerView.thisPlayer.megacredits / NORMAL_RATES.buy[this.good]);
      return Math.max(PROPHECY_MIN_UNITS, Math.min(PROPHECY_MAX_UNITS, most));
    },
    nextRate(): number | undefined {
      return this.exchange[this.side].next?.[this.good];
    },
    unitName(): string {
      return translateText(RESOURCE_LABEL[this.good]);
    },
    amountLine(): string {
      return this.side === 'sell' ?
        translateTextWithParams('${0} ${1}, normal ${2} Solari each', [String(this.amount), this.unitName, String(this.normal)]) :
        translateTextWithParams('${0} Solari, normally ${1} ${2}', [String(this.budget), String(this.amount), this.unitName]);
    },
    sumTitle(): string {
      return translateTextWithParams('Example: the rate reaches ${0}', [String(this.limit)]);
    },
    // The lines of the sum at the first better rate (common/dune/prophecyOutcome.ts)
    sumLines(): Array<{kind: string, label: string, way: string, value: string}> {
      const outcome = prophecyOutcome(this.side, this.good, this.amount, this.limit);
      if (outcome === undefined) {
        return [];
      }
      const up = translateText('rounded up');
      if (this.side === 'sell') {
        return [
          {kind: 'base', label: translateText('Sold normally'), way: `${this.amount} × ${this.normal}`, value: `${outcome.base} Solari`},
          {kind: 'market', label: translateText('more from the rate'), way: `${this.amount} × ${this.limit - this.normal}`, value: `+${outcome.market}`},
          {kind: 'premium', label: translateText('Bet premium'), way: `${this.amount} × 1`, value: `+${outcome.premium}`},
          {kind: 'total', label: translateText('Sum'), way: '', value: `${outcome.total} Solari`},
        ];
      }
      return [
        {kind: 'base', label: translateText('Bought normally'), way: `${this.budget} ÷ ${this.normal}`, value: `${outcome.base} ${this.unitName}`},
        {kind: 'market', label: translateText('more from the rate'), way: `${this.budget} ÷ ${this.limit}, ${up}`, value: `+${outcome.market}`},
        {kind: 'premium', label: translateText('Bet premium'), way: `${prophecyPremium(this.amount)} Solari ÷ ${this.limit}, ${up}`, value: `+${outcome.premium}`},
        {kind: 'total', label: translateText('Sum'), way: '', value: `${outcome.total} ${this.unitName}`},
      ];
    },
    boundLine(): string {
      const bound = this.side === 'sell' ? `${this.amount} ${this.unitName}` : `${this.budget} Solari`;
      return translateTextWithParams('Bound now: ${0} · withdrawing costs half · lost at game end', [bound]);
    },
    available(): boolean {
      return this.input(this.side) !== undefined;
    },
    // Whether the footer button can place the order now (the tab's button is outside this pane)
    ready(): boolean {
      const enough = this.side === 'sell' ? this.stockOf(this.good) >= this.amount : this.playerView.thisPlayer.megacredits >= this.budget;
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
    // A new side or good has a new most: keep the slider inside it
    side(): void {
      this.clamp();
    },
    good(): void {
      this.clamp();
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
    // Selling needs 2 units in stock, buying the Solari for 2 units at the normal rate
    canGood(good: ExchangeGood): boolean {
      return this.side === 'sell' ? this.stockOf(good) >= PROPHECY_MIN_UNITS :
        this.playerView.thisPlayer.megacredits >= prophecyBudget(good, PROPHECY_MIN_UNITS);
    },
    chooseSide(side: ExchangeSide): void {
      this.side = side;
      if (!this.canGood(this.good)) {
        this.good = EXCHANGE_GOODS.find((good) => this.canGood(good)) ?? this.good;
      }
    },
    chooseGood(good: ExchangeGood): void {
      this.good = good;
    },
    clamp(): void {
      this.amount = Math.min(Math.max(PROPHECY_MIN_UNITS, this.amount), this.amountMax);
    },
    premiumLabel(premium: number): string {
      return translateTextWithParams('incl. premium ${0}', [String(premium)]);
    },
    boundOf(order: ProphecyModel): number {
      return order.budget ?? orderBound(order.side, order.amount, order.limit);
    },
    /** A budget order at its limit: the units it brings at least */
    budgetUnits(order: ProphecyModel): number {
      return prophecyOutcome('buy', order.good, order.amount, order.limit)?.total ?? order.amount;
    },
    /** The same goods at the normal rate of the guild: what selling brings or buying costs without the prophecy */
    normalWorth(order: ProphecyModel): number {
      return order.amount * NORMAL_RATES[order.side][order.good];
    },
    savingLabel(order: ProphecyModel): string {
      return translateTextWithParams('pays at most ${0}', [String(this.boundOf(order))]);
    },
    /** What withdrawing costs: the half of the bound goods that does not come back (Jens 25 Oct 2026) */
    withdrawCostLabel(order: ProphecyModel): string {
      const bound = this.boundOf(order);
      const lost = bound - orderRefund(bound);
      return order.side === 'sell' ?
        translateTextWithParams('costs ${0} ${1}', [String(lost), translateText(RESOURCE_LABEL[order.good])]) :
        translateTextWithParams('costs ${0} Solari', [String(lost)]);
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
