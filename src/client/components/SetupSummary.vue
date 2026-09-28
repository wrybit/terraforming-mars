<template>
  <!-- Bilanz der Startauswahl als Kennzahlen-Leiste (setup_summary.less): was vom Start-Kapital nach Präludien und
       Kartenkauf bleibt, daneben der Status (was noch fehlt). Werte ohne gewählten Konzern als Gedankenstrich. -->
  <dl class="setup-summary">
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
      <dd>{{ signed(-purchasedCount * cardCost) }}</dd>
    </div>
    <div class="setup-summary-item">
      <dt>{{ $t('Remaining') }}</dt>
      <!-- Ergebnis der Rechnung als gelbe M€-Münze wie im Spiel -->
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
</template>

<script setup lang="ts">
import {computed} from 'vue';

const props = defineProps<{
  // Start-M€ des gewählten Konzerns; undefined, solange keiner (oder mehrere) gewählt sind
  startMegacredits: number | undefined;
  // M€-Wirkung der gewählten Präludien; undefined ohne Präludium-Erweiterung (dann entfällt die Kennzahl)
  preludeMegacredits: number | undefined;
  purchasedCount: number;
  cardCost: number;
  // Hinweis, was noch fehlt, bzw. "bereit" (Übersetzungsschlüssel)
  status: string;
  statusReady: boolean;
}>();

const remaining = computed(() => props.startMegacredits === undefined ?
  undefined :
  props.startMegacredits + (props.preludeMegacredits ?? 0) - props.purchasedCount * props.cardCost);

// Negative Werte mit typografischem Minus, wie in der ganzen Leiste
function withMinus(value: number): string {
  return value < 0 ? '−' + Math.abs(value) : String(value);
}

// Vorzeichen immer zeigen, 0 als ±0 – so liest sich die Zeile als Rechnung
function signed(value: number): string {
  if (value === 0) {
    return '±0';
  }
  return value > 0 ? '+' + value : withMinus(value);
}
</script>
