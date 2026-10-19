<template>
  <!-- A whole trade in one view (Dune: CHOAM offer, black market, moving spice): what you give on the left, what you
       get on the right, each as resource tiles with the own stock; the amounts below. With a fixed rate one slider moves
       both sides (AmountConverter, before → after like other conversions); without a rate (CHOAM) one slider per side.
       The summary above the button repeats the deal. -->
  <div class="trade-select">
    <div v-if="showtitle === true" class="amount-select__title">{{ $t(playerinput.title) }}</div>
    <!-- Two groups side by side (stacked when narrow): each with its label, its resources and – without a rate – its
         amount, so everything of one side belongs together (law of proximity) -->
    <div class="trade-select__sides">
      <section class="trade-select__side" data-test="trade-give">
        <h4 class="trade-select__label">{{ $t(hasRate ? 'You give' : 'You offer') }}</h4>
        <div class="trade-select__resources">
          <button v-for="option in playerinput.give" :key="option.resource" type="button"
            :class="['trade-select__resource', {'trade-select__resource--selected': option.resource === give}]"
            :title="$t(resourceName(option.resource))" @click="chooseGive(option.resource)">
            <i :class="'resource_icon resource_icon--' + option.resource"></i>
            <span class="trade-select__stock">{{ stockOf(option.resource) }}</span>
          </button>
        </div>
        <div v-if="!hasRate" class="amount-slider-plain trade-select__slider">
          <AmountSlider v-model="giveAmount" :min="1" :max="giveMax"/>
        </div>
      </section>
      <section class="trade-select__side" data-test="trade-get">
        <h4 class="trade-select__label">{{ $t(hasRate ? 'You get' : 'You want in return') }}</h4>
        <div class="trade-select__resources">
          <button v-for="resource in playerinput.get" :key="resource" type="button" :disabled="!receivable(give, resource)"
            :class="['trade-select__resource', {'trade-select__resource--selected': resource === get}]"
            :title="$t(resourceName(resource))" @click="chooseGet(resource)">
            <i :class="'resource_icon resource_icon--' + resource"></i>
            <span class="trade-select__stock">{{ stockOf(resource) }}</span>
          </button>
        </div>
        <div v-if="!hasRate" class="amount-slider-plain trade-select__slider">
          <AmountSlider v-model="getAmount" :min="1" :max="playerinput.maxGet"/>
        </div>
      </section>
    </div>
    <div v-if="conversion !== undefined" class="choice-block choice-block--natural trade-select__amounts">
      <AmountConverter v-model="units" :conversion="conversion" :min="1" :max="maxUnits" :player="playerView.thisPlayer"/>
    </div>
    <div class="trade-select__summary" data-test="trade-summary">
      <span>{{ finalGive }} <i :class="'resource_icon resource_icon--' + give"></i></span>
      <span class="trade-select__summary-arrow" aria-hidden="true">⇄</span>
      <span>{{ finalGet }} <i :class="'resource_icon resource_icon--' + get"></i></span>
    </div>
    <TabPanelFooterSlot>
      <div v-if="showsave === true" class="amount-select__actions">
        <AppButton hotkey="proceed" type="submit" :title="$t(playerinput.buttonLabel || 'Confirm')" @click="saveData"/>
      </div>
    </TabPanelFooterSlot>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import AppButton from '@/client/components/common/AppButton.vue';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import AmountConverter from '@/client/components/amount/AmountConverter.vue';
import AmountSlider from '@/client/components/amount/AmountSlider.vue';
import {AmountConversion} from '@/client/components/amount/amountConversion';
import {resourceSnapshot} from '@/client/components/selectPlayerResource';
import {SelectTradeModel, TradeGiveOption, TradeRate} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SelectTradeResponse} from '@/common/inputs/InputResponse';
import {isPricedTrade, tradeRate} from '@/common/inputs/tradeRate';
import {Resource} from '@/common/Resource';

// Names of the resources (translated; the Dune theme swaps them for its own words)
const RESOURCE_NAMES: Readonly<Record<Resource, string>> = {
  megacredits: 'M€',
  steel: 'Steel',
  titanium: 'Titanium',
  plants: 'Plants',
  energy: 'Energy',
  heat: 'Heat',
};

export default defineComponent({
  name: 'SelectTrade',
  components: {
    AppButton,
    AmountConverter,
    AmountSlider,
    TabPanelFooterSlot,
  },
  props: {
    playerView: {
      type: Object as () => PlayerViewModel,
      required: true,
    },
    playerinput: {
      type: Object as () => SelectTradeModel,
      required: true,
    },
    onsave: {
      type: Function as unknown as () => (out: SelectTradeResponse) => void,
      required: true,
    },
    showsave: {
      type: Boolean,
    },
    showtitle: {
      type: Boolean,
    },
  },
  data() {
    // Start with the largest stock that buys something, and the first resource it buys
    const input = this.playerinput;
    const buys = (give: TradeGiveOption, get: Resource) => get !== give.resource &&
      (tradeRate(input, give.resource, get)?.give ?? 1) <= give.max;
    const usable = input.give.filter((option) => input.get.some((get) => buys(option, get)));
    const options = usable.length > 0 ? usable : input.give;
    const largest = options.reduce((best, option) => option.max > best.max ? option : best, options[0]);
    const get = input.get.find((resource) => buys(largest, resource)) ?? input.get[0];
    return {
      give: largest.resource,
      get,
      // With a rate: number of whole rate steps. Starts at 1, not at the most: a trade must never spend the whole
      // stock by default (black market with 24 M€ would otherwise offer all of it)
      units: 1,
      giveAmount: 1,
      getAmount: 1,
    };
  },
  computed: {
    // Priced trade (fixed rate or worth per resource): one slider for both sides
    hasRate(): boolean {
      return isPricedTrade(this.playerinput);
    },
    // Rate of the chosen pair (black market: from the worth of both resources)
    pairRate(): TradeRate | undefined {
      return tradeRate(this.playerinput, this.give, this.get);
    },
    giveOption(): TradeGiveOption {
      return this.playerinput.give.find((option) => option.resource === this.give) ?? this.playerinput.give[0];
    },
    giveMax(): number {
      return this.giveOption.max;
    },
    maxUnits(): number {
      const rate = this.pairRate;
      if (rate === undefined) {
        return 1;
      }
      return Math.max(1, Math.min(Math.floor(this.giveMax / rate.give), Math.floor(this.playerinput.maxGet / rate.get)));
    },
    conversion(): AmountConversion | undefined {
      const rate = this.pairRate;
      if (rate === undefined) {
        return undefined;
      }
      return {
        from: {kind: 'stock', resource: this.give, perStep: rate.give},
        to: {kind: 'stock', resource: this.get, perStep: rate.get},
      };
    },
    finalGive(): number {
      const rate = this.pairRate;
      return rate === undefined ? this.giveAmount : this.units * rate.give;
    },
    finalGet(): number {
      const rate = this.pairRate;
      return rate === undefined ? this.getAmount : this.units * rate.get;
    },
  },
  methods: {
    resourceName(resource: Resource): string {
      return RESOURCE_NAMES[resource];
    },
    // Can `give` buy at least one unit of `get`? Never the same resource; a priced trade needs enough for its rate
    receivable(give: Resource, get: Resource): boolean {
      if (get === give) {
        return false;
      }
      const option = this.playerinput.give.find((candidate) => candidate.resource === give);
      const rate = tradeRate(this.playerinput, give, get);
      return option !== undefined && (rate === undefined || rate.give <= option.max);
    },
    stockOf(resource: Resource): number {
      return resourceSnapshot(this.playerView.thisPlayer, resource).stock;
    },
    // A new resource to give: the other side must differ, the amounts stay within the new limits
    chooseGive(resource: Resource): void {
      this.give = resource;
      if (!this.receivable(resource, this.get)) {
        this.get = this.playerinput.get.find((other) => this.receivable(resource, other)) ?? this.get;
      }
      this.clampAmounts();
    },
    chooseGet(resource: Resource): void {
      this.get = resource;
      this.clampAmounts();
    },
    // A new pair has a new rate and limit: keep the amounts inside it
    clampAmounts(): void {
      this.giveAmount = Math.min(this.giveAmount, this.giveMax);
      this.units = Math.max(1, Math.min(this.units, this.maxUnits));
    },
    saveData(): void {
      this.onsave({type: 'trade', give: this.give, giveAmount: this.finalGive, get: this.get, getAmount: this.finalGet});
    },
  },
});
</script>
