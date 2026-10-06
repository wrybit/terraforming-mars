<template>
  <span :class="['track-bonus-chip', 'track-bonus-chip--' + kind, {'track-bonus-chip--choice': bonus.icons.length > 1, 'track-bonus-chip--wide': hasCount && !bonus.production}]">
    <span v-if="bonus.victoryPoints !== undefined" class="track-bonus-chip__vp">{{ bonus.victoryPoints }}</span>
    <span v-else-if="bonus.text !== undefined" class="track-bonus-chip__text">{{ bonus.text }}</span>
    <template v-else>
      <b v-if="hasCount">{{ bonus.count }}</b>
      <template v-for="(icon, index) in bonus.icons" :key="index">
        <i v-if="index > 0" class="track-bonus-chip__or">/</i>
        <span v-if="bonus.production" class="track-bonus-chip__production"><img :src="'assets/' + icon" alt=""></span>
        <img v-else :src="'assets/' + icon" alt="">
      </template>
    </template>
  </span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {TrackBonus, TrackBonusKind} from './trackBonus';

export default defineComponent({
  name: 'TrackBonusChip',
  props: {
    bonus: {
      type: Object as PropType<TrackBonus>,
      required: true,
    },
    kind: {
      type: String as PropType<TrackBonusKind>,
      default: 'own',
    },
  },
  computed: {
    hasCount(): boolean {
      return this.bonus.count !== undefined && this.bonus.count > 1;
    },
  },
});
</script>
