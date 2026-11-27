<template>
  <!-- What playing the selected card changes beyond its printed effects (models/cardImpact.ts on the server):
       basis left, result right; sits in the tab footer above the payment area -->
  <div v-if="lines.length > 0" class="card-impact">
    <div v-for="(line, index) in lines" :key="index" class="card-impact-line">
      <CardImpactBasis :basis="line.basis" />
      <span class="card-impact-result">
        <span v-for="(amount, amountIndex) in line.gains" :key="'gain' + amountIndex" :class="amountClass(amount)">
          <template v-if="amount.resource === 'vp'">{{ signed(amount.amount) }} {{ $t('VP') }}</template>
          <template v-else><b>{{ signed(amount.amount) }}</b><i :class="iconClass(amount.resource)"></i></template>
        </span>
        <!-- Attack: every opponent as a chip in their player color with what they would actually lose;
             names only in the tooltip, so 5 players still fit in one line -->
        <span v-for="target in line.targets ?? []" :key="target.player.color"
          :class="['card-impact-target', target.empty ? 'card-impact-target--empty' : 'player_bg_color_' + target.player.color]"
          :title="target.empty ? undefined : target.player.name">
          <template v-if="target.empty"></template>
          <template v-else-if="target.protected">
            <svg class="card-impact-shield" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l8 3v6c0 5-3.4 9.3-8 11-4.6-1.7-8-6-8-11V5z" /></svg>
            <span class="card-impact-hidden">{{ $t('protected') }}</span>
          </template>
          <b v-else>−{{ target.amount }}</b>
        </span>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {CardImpactAmount, CardImpactLine, CardImpactResource} from '@/common/models/CardImpact';
import CardImpactBasis from '@/client/components/cardImpact/CardImpactBasis.vue';
import {impactIconClass} from '@/client/components/cardImpact/cardImpactIcons';

const props = defineProps<{
  impact: ReadonlyArray<CardImpactLine> | undefined;
}>();

const lines = computed(() => props.impact ?? []);

const signed = (amount: number) => (amount < 0 ? '−' : '+') + Math.abs(amount);
const iconClass = (resource: CardImpactResource) => impactIconClass(resource);

// Same chips as the log's effects: production on a brown area, losses in red, victory points in gold
function amountClass(amount: CardImpactAmount): Array<string> {
  if (amount.resource === 'vp') {
    return ['card-impact-vp'];
  }
  const classes = ['log-effect'];
  if (amount.production) {
    classes.push('log-effect--production');
  }
  if (amount.amount < 0) {
    classes.push('log-effect--loss');
  }
  return classes;
}

</script>
