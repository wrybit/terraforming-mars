<template>
<TabPanelFooterSlot>
<section class="payments_form" v-trim-whitespace>
  <div class="payments_prices">
    <!-- Balance block (payments.less): what you pay | total | what is left afterwards.
         One grid, so icons, numbers and "=" share an axis per column; every group title sits in row 1.
         With only one currency there is nothing to split: just the cost and what is left. -->
    <div class="payments_balance" :class="{'payments_balance--single': !hasCurrencyChoice}">
      <template v-if="hasCurrencyChoice">
        <span class="payments_group_title payments_group_title--cost" v-i18n>Costs</span>
        <span class="payments_group_title payments_group_title--total" v-i18n>Sum</span>
      </template>
      <span v-else class="payments_group_title payments_group_title--total" v-i18n>Costs</span>
      <span class="payments_group_title payments_group_title--rest" v-i18n>Left over</span>

      <template v-for="(unit, index) of visibleUnits" :key="unit">
        <template v-if="hasCurrencyChoice">
          <div class="payments_unit" :style="{gridRow: index + 2}">
            <PaymentUnitComponent
              v-model.number="payment[unit]"
              :unit="unit"
              :description="descriptions[unit]"
              :target="targetValue(unit)"
              :targetReached="targetValue(unit) === payment[unit]"
              @plus="addValue(unit)"
              @minus="reduceValue(unit)"
              @max="maxValue(unit)"/>
            <div v-if="ledger[unit]?.reserved" class="card-warning" v-i18n="$t(unit)">
            Some ${0} are reserved and unavailable here.</div>
          </div>
          <!-- Value of this row in M€; dimmed at 0 instead of empty, so the column stays calm -->
          <span class="payments_unit_subtotal" :class="{'payments_unit_subtotal--zero': payment[unit] === 0}" :style="{gridRow: index + 2}">
            <span class="payments_equals">=</span>
            <span>{{ ledger[unit].rate * payment[unit] }}</span>
            <i class="resource_icon payments_type_smallicon resource_icon--megacredits"></i>
          </span>
        </template>
        <!-- What is left of this currency after paying, in the row of its currency -->
        <span class="payments_rest" :class="{'payments_rest--empty': restOf(unit) === 0}" :style="{gridRow: index + 2}" :data-test="'rest-' + unit">
          <span>{{ restOf(unit) }}</span>
          <i class="resource_icon payments_type_smallicon" :class="iconClass(unit)"></i>
        </span>
      </template>

      <!-- Total: only whether the split fits (green), falls short (red) or overpays (yellow) – the amounts are in the rows -->
      <div v-if="hasCurrencyChoice" class="payments_total" :class="totalSpentClass()" :style="{gridRow: '2 / span ' + visibleUnits.length}">
        <span class="payments_total_value" :title="$t(totalSpentTitle())">
          <template v-if="totalSpent() === cost">✓ <span v-i18n>Fits</span></template>
          <template v-else>
            <span>{{ Math.abs(totalSpent() - cost) }}</span>
            <i class="resource_icon payments_type_smallicon resource_icon--megacredits"></i>
            <span v-if="totalSpent() < cost" v-i18n>missing</span>
            <span v-else v-i18n>too much</span>
          </template>
        </span>
      </div>
      <div v-else class="payments_total payments_single" :style="{gridRow: '2 / span ' + visibleUnits.length}">
        <span class="payments_total_value">
          <span>{{ cost }}</span>
          <i class="resource_icon payments_type_smallicon resource_icon--megacredits"></i>
        </span>
      </div>

      <span v-if="hasCurrencyChoice" class="payments_divider payments_divider--total" :style="{gridRow: '1 / span ' + (visibleUnits.length + 1)}"></span>
      <span class="payments_divider payments_divider--rest" :style="{gridRow: '1 / span ' + (visibleUnits.length + 1)}"></span>
    </div>

    <div v-if="warning !== undefined" class="tm-warning">
      <label class="label label-error">{{ $t(warning) }}</label>
    </div>
  </div>

  <div v-if="showsave" class="payments_save">
    <AppButton size="big" @click="handleSave()" :title="$t(buttonLabel)" data-test="save"/>
  </div>
</section>
</TabPanelFooterSlot>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {Payment} from '@/common/inputs/Payment';
import {SpendableResource} from '@/common/inputs/Spendable';
import {getPreferences} from '@/client/utils/PreferencesManager';
import TabPanelFooterSlot from '@/client/components/TabPanelFooterSlot.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import PaymentUnitComponent from '@/client/components/PaymentUnit.vue';
import {Ledger} from '@/client/components/PaymentLedger';
import {paymentIconClass} from '@/client/components/paymentIcon';
import {computeDefaultPayment} from '@/client/components/PaymentDefaults';
import {sum} from '@/common/utils/utils';
import {Message} from '@/common/logs/Message';
import {LogMessageDataType} from '@/common/logs/LogMessageDataType';

const DESCRIPTIONS: Record<SpendableResource, string> = {
  steel: 'Steel',
  titanium: 'Titanium',
  heat: 'Heat',
  seeds: 'Seeds',
  auroraiData: 'Data',
  kuiperAsteroids: 'Asteroids',
  spireScience: 'Science',
  megacredits: 'M€',
  floaters: 'Floaters',
  graphene: 'Graphene',
  lunaArchivesScience: 'Science',
  microbes: 'Microbes',
  plants: 'Plants',
};

function mapRecord<T extends string, U, V>(record: Record<T, U>, f: (value: U) => V): Record<T, V> {
  const entries: Array<[T, U]> = Object.entries(record) as Array<[T, U]>;
  const mapped: Array<[T, V]> = entries.map(([k, v]) => [k, f(v)]);
  return Object.fromEntries(mapped) as Record<T, V>;
}

const IN_SENTENCE_DESCRIPTIONS: Record<SpendableResource, string> = {
  ...mapRecord(DESCRIPTIONS, (v) => v.toLowerCase()),
  megacredits: 'M€',
};

type DataModel = {
  payment: Payment;
  warning: string | Message | undefined;
};

export default defineComponent({
  name: 'PaymentForm',
  components: {
    TabPanelFooterSlot,
    AppButton,
    PaymentUnitComponent,
  },
  props: {
    cost: {
      type: Number,
      required: true,
    },
    // Rename to something related to how it is both display order and documents the
    // resources in use.
    order: {
      type: Array as () => ReadonlyArray<SpendableResource>,
      required: true,
    },
    ledger: {
      type: Object as () => Ledger,
      required: true,
    },
    showsave: {
      type: Boolean,
      default: false,
    },
    buttonLabel: {
      type: String,
      required: true,
    },
  },
  emits: ['save', 'change'],
  data(): DataModel {
    return {
      payment: computeDefaultPayment(this.cost, this.order, this.ledger, /* reserveMegacredits=*/ false),
      warning: undefined,
    };
  },
  computed: {
    descriptions(): Record<SpendableResource, string> {
      return DESCRIPTIONS;
    },
    // Currencies with a stock; only these get a row
    availableUnits(): ReadonlyArray<SpendableResource> {
      return this.order.filter((unit) => (this.ledger[unit]?.available ?? 0) > 0);
    },
    // Sliders and total only if there is really something to split (more than one available currency)
    hasCurrencyChoice(): boolean {
      return this.availableUnits.length > 1;
    },
    // Rows of the balance block; with a single currency it is the M€ row (what is left after paying the cost)
    visibleUnits(): ReadonlyArray<SpendableResource> {
      return this.hasCurrencyChoice ? this.availableUnits : ['megacredits'];
    },
  },
  watch: {
    payment: {
      deep: true,
      immediate: true,
      handler(val: Payment) {
        this.$emit('change', val);
      },
    },
  },
  methods: {
    /**
     * Returns the most MC necessary, capped by the cost of the payment.
     */
    getMegaCreditsMax(): number {
      return Math.min(this.ledger['megacredits'].available, this.cost);
    },
    addValue(unit: SpendableResource): void {
      // MC is special-cased because it's the currency being spent.
      if (unit === 'megacredits') {
        if (this.payment[unit] < this.getMegaCreditsMax()) {
          this.payment[unit] += 1;
        }
      } else {
        if (this.payment[unit] < this.ledger[unit].available) {
          this.payment[unit] += 1;
          this.setRemainingMCValue();
        }
      }
    },
    reduceValue(unit: SpendableResource): void {
      if (this.payment[unit] > 0) {
        this.payment[unit] -= 1;
        if (unit !== 'megacredits') {
          this.setRemainingMCValue();
        }
      }
    },
    setRemainingMCValue(): void {
      this.payment = this.withRemainingMCValue(this.payment);
    },
    // M€ make up for whatever the other resources leave open, capped by the M€ available
    withRemainingMCValue(payment: Payment): Payment {
      // Amount of money non-megacredit resources account for.
      const nonMCspend = this.totalSpent(payment) - payment.megacredits;

      // Amount MC has to make up for
      const remainingMC = Math.max(0, this.cost - nonMCspend);

      // If MC has to make up for more than it has, this caps it.
      return {...payment, megacredits: Math.min(this.ledger.megacredits.available, remainingMC)};
    },
    // Payment after a click on the target button of this unit – pure, so the button can show the
    // resulting value beforehand (targetValue) and the click sets exactly that.
    // M€ balance the payment: exactly what the other resources leave open (never overpaying).
    // Other resources: as many as are useful for the cost without overpaying, M€ make up the rest.
    paymentAfterMax(unit: SpendableResource): Payment {
      if (unit === 'megacredits') {
        return this.withRemainingMCValue(this.payment);
      }
      const target = Math.min(this.ledger[unit].available, Math.floor(this.cost / this.ledger[unit].rate));
      if (this.payment[unit] >= target) {
        return this.payment;
      }
      return this.withRemainingMCValue({...this.payment, [unit]: target});
    },
    targetValue(unit: SpendableResource): number {
      return this.paymentAfterMax(unit)[unit];
    },
    maxValue(unit: SpendableResource): void {
      this.payment = this.paymentAfterMax(unit);
    },
    restOf(unit: SpendableResource): number {
      const paid = this.hasCurrencyChoice ? this.payment[unit] : this.cost;
      return (this.ledger[unit]?.available ?? 0) - paid;
    },
    iconClass(unit: SpendableResource): string {
      return paymentIconClass(unit);
    },
    totalSpent(payment?: Payment): number {
      const paid = payment ?? this.payment;
      return sum(this.order.map((unit) => paid[unit] * this.ledger[unit].rate));
    },
    handleSave(): void {
      this.warning = undefined;
      if (this.cost === 0) {
        this.$emit('save', this.payment);
        return;
      }
      for (const unit of this.order) {
        if (this.payment[unit] > this.ledger[unit].available) {
          this.warning = {
            message: 'You do not have enough ${0}',
            data: [{type: LogMessageDataType.STRING, value: IN_SENTENCE_DESCRIPTIONS[unit]}],
          };
          return;
        }
      }
      const delta = this.totalSpent() - this.cost;
      if (delta < 0) {
        this.warning = 'Haven\'t spent enough';
        return;
      }
      if (delta > 0) {
        for (const unit of this.order) {
          if (this.payment[unit] > 0 && delta >= this.ledger[unit].rate) {
            this.warning = {
              message: 'You cannot overspend ${0}',
              data: [{type: LogMessageDataType.STRING, value: IN_SENTENCE_DESCRIPTIONS[unit]}],
            };
            return;
          }
        }
        if (getPreferences().show_alerts) {
          if (!confirm('Warning: You are overpaying by ' + delta + ' M€')) {
            this.warning = 'Please adjust payment amount';
            return;
          }
        }
      }
      this.$emit('save', this.payment);
    },
    totalSpentClass(): string {
      const total = this.totalSpent();
      if (total < this.cost) {
        return 'payments_total_under';
      } else if (total > this.cost) {
        return 'payments_total_over';
      } else {
        return 'payments_total_exact';
      }
    },
    totalSpentTitle(): string {
      const total = this.totalSpent();
      if (total < this.cost) {
        return 'Underpaying';
      } else if (total > this.cost) {
        return 'Overpaying';
      }
      return '';
    },
  },
});
</script>
