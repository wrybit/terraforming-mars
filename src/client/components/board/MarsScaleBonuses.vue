<template>
  <!-- Bonuses next to the Mars scales (marsScaleBonuses.ts): chip outside, connector pointing at the cell,
       handed out ones grey. Same chip and pin as the Moon ring and the track rows (track_bonus.less). -->
  <div v-for="pin in pins" :key="pin.key" class="mars-scale-bonus" :style="pinStyle(pin)" :data-test="'mars-scale-bonus-' + pin.key">
    <span :class="['track-bonus-pin', {'track-bonus-pin--done': pin.done}]">
      <span class="track-bonus-pin__chips" :style="{transform: 'rotate(' + -pin.angle + 'deg)'}">
        <TrackBonusChip :bonus="pin.bonus" :kind="pin.done ? 'done' : 'own'"/>
      </span>
      <span class="track-bonus-link"></span>
    </span>
  </div>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import TrackBonusChip from '@/client/components/trackBonus/TrackBonusChip.vue';
import {ScaleBonusPin, scaleBonusPins} from './marsScaleBonuses';

const props = defineProps<{
  temperature: number;
  oxygen: number;
  // Undefined without Venus
  venus: number | undefined;
}>();

const pins = computed(() => scaleBonusPins({temperature: props.temperature, oxygen: props.oxygen, venus: props.venus}));

// Placed like the scale cells (margins in .global-numbers), then turned so the connector points at the cell
function pinStyle(pin: ScaleBonusPin): Record<string, string> {
  return {
    marginTop: pin.top + 'px',
    marginLeft: pin.left + 'px',
    transform: `translate(-100%, -50%) rotate(${pin.angle}deg)`,
  };
}
</script>
