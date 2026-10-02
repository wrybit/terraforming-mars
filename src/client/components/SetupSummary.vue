<template>
  <!-- Balance of the start selection as a key-figure bar (setup_summary.less): what remains of the starting capital after
       preludes and card purchase, next to it the status (what is still missing). Values without a chosen corporation as a dash.
       On the right of the card the slot for the start button. -->
  <div class="setup-summary">
    <dl class="setup-summary-values">
      <div class="setup-summary-item">
        <dt>{{ $t('Starting M€') }}</dt>
        <dd>{{ startMegacredits === undefined ? '–' : startMegacredits }}</dd>
      </div>
      <div v-if="preludeMegacredits !== undefined" class="setup-summary-item">
        <dt>{{ $t('Prelude cards') }}</dt>
        <dd>{{ signed(preludeMegacredits) }}</dd>
      </div>
      <div class="setup-summary-item">
        <dt>{{ $t('Purchase') }} ({{ purchasedCount }} × {{ cardCost }})</dt>
        <!-- Red if the purchase exceeds the starting capital: cards are paid before the preludes take effect -->
        <dd :class="{'setup-summary-value--negative': startMegacredits !== undefined && purchasedCount * cardCost > startMegacredits}">
          {{ signed(-purchasedCount * cardCost) }}
        </dd>
      </div>
      <div class="setup-summary-item">
        <dt>{{ $t('Remaining') }}</dt>
        <!-- Result of the calculation as a yellow M€ coin like in the game -->
        <dd>
          <span v-if="remaining !== undefined"
            :class="['setup-summary-coin', {'setup-summary-coin--negative': remaining < 0}]">{{ withMinus(remaining) }}</span>
          <template v-else>–</template>
        </dd>
      </div>
      <div class="setup-summary-item setup-summary-item--status">
        <dt>{{ $t('Status') }}</dt>
        <dd :class="statusReady ? 'setup-summary-status--ready' : 'setup-summary-status--open'">{{ $t(status) }}</dd>
      </div>
    </dl>
    <div class="setup-summary-actions">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {remainingMegacredits} from '@/client/components/setupBalance';

const props = defineProps<{
  // Starting M€ of the chosen corporation; undefined while none (or several) are chosen
  startMegacredits: number | undefined;
  // M€ effect of the chosen preludes; undefined without the prelude expansion (then the figure is omitted)
  preludeMegacredits: number | undefined;
  purchasedCount: number;
  cardCost: number;
  // Hint about what is still missing, or "ready" (translation key)
  status: string;
  statusReady: boolean;
}>();

const remaining = computed(() => props.startMegacredits === undefined ?
  undefined :
  remainingMegacredits(props.startMegacredits, props.preludeMegacredits, props.purchasedCount, props.cardCost));

// Negative values with a typographic minus, as in the whole bar
function withMinus(value: number): string {
  return value < 0 ? '−' + Math.abs(value) : String(value);
}

// Always show the sign, 0 as ±0 – so the row reads as a calculation
function signed(value: number): string {
  if (value === 0) {
    return '±0';
  }
  return value > 0 ? '+' + value : withMinus(value);
}
</script>
