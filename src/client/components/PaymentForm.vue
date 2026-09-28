<template>
<TabPanelFooterSlot>
<section class="payments_form" v-trim-whitespace>
  <div class="payments_prices">
    <!-- Nur eine Währung: keine Regler, nur der Preis -->
    <div v-if="!hasCurrencyChoice" class="payments_single">
      {{ cost }}
      <i class="resource_icon payments_type_smallicon resource_icon--megacredits"></i>
    </div>
    <table v-else class="payments_table">
      <tbody>
        <template v-for="unit of order" :key="unit">
          <template v-if="ledger[unit]?.available > 0">
            <tr>
              <td>
                <PaymentUnitComponent
                  v-model.number="payment[unit]"
                  :unit="unit"
                  :description="descriptions[unit]"
                  :rate="ledger[unit].rate"
                  @plus="addValue(unit)"
                  @minus="reduceValue(unit)"
                  @max="maxValue(unit)"/>
                <div v-if="ledger[unit]?.reserved" class="card-warning" v-i18n="$t(unit)">
                Some ${0} are reserved and unavailable here.</div>
              </td>
              <!-- Wert dieser Zeile in M€; bei 0 abgeschwächt statt leer, damit die Spalte ruhig bleibt -->
              <td class="payments_unit_subtotal" :class="{'payments_unit_subtotal--zero': payment[unit] === 0}" v-if="ledger[unit].rate !== undefined">
                = {{ ledger[unit].rate * payment[unit] }}
                <i class="resource_icon payments_type_smallicon resource_icon--megacredits"></i>
              </td>
            </tr>
          </template>
        </template>
      </tbody>
    </table>
    <!-- Summe gegen Kosten rechts neben den Währungen; Farbe zeigt, ob der Betrag passt (grün),
         fehlt (rot) oder zu hoch ist (gelb) -->
    <div v-if="hasCurrencyChoice" class="payments_total" :class="totalSpentClass()">
      <div class="payments_total_heading"><span v-i18n>Total</span>:</div>
      <div class="payments_total_value" :title="$t(totalSpentTitle())" :aria-label="$t(totalSpentTitle())">
        {{ totalSpent() }} / {{ cost }}
        <i class="resource_icon payments_type_smallicon resource_icon--megacredits"></i>
      </div>
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
    // Regler und Summe nur, wenn es wirklich etwas aufzuteilen gibt (mehr als eine verfügbare Währung)
    hasCurrencyChoice(): boolean {
      return this.order.filter((unit) => (this.ledger[unit]?.available ?? 0) > 0).length > 1;
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
      // Amount of money non-megacredit resources account for.
      const nonMCspend = this.totalSpent() - this.payment.megacredits;

      // Amount MC has to make up for
      const remainingMC = Math.max(0, this.cost - nonMCspend);

      // If MC has to make up for more than it has, this caps it.
      const megacredits = Math.min(this.ledger.megacredits.available, remainingMC);
      this.payment.megacredits = megacredits;
    },
    maxValue(unit: SpendableResource): void {
      const target = Math.min(this.ledger[unit].available, Math.floor(this.cost / this.ledger[unit].rate));

      if (this.payment[unit] < target) {
        this.payment[unit] = target;

        if (unit !== 'megacredits') {
          this.setRemainingMCValue();
        } else {
          const saved = this.payment.megacredits;
          this.payment = computeDefaultPayment(this.cost, this.order, this.ledger, /* reserveMegacredits=*/ true);
          this.payment.megacredits = saved;
        }
      }
    },
    totalSpent(): number {
      return sum(this.order.map((unit) => this.payment[unit] * this.ledger[unit].rate));
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
