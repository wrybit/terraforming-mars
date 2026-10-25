<template>
  <!-- Envy track on a card (Sardaukar Raid; canvas RazziaVarianten B2, Jens 25 Oct 2026): the free steps, then the hit
       steps as their own group with a red bracket below; the bracket leads to the lost influence, the icon exactly
       under its middle (the minus hangs left of it and does not count for the centre) -->
  <div class="card-envy-track" aria-hidden="true">
    <ol class="card-envy-track__steps card-envy-track__steps--free">
      <li v-for="level in freeLevels" :key="level" :class="stepClass(level)">{{ level }}</li>
    </ol>
    <div class="card-envy-track__hit">
      <ol class="card-envy-track__steps">
        <li v-for="level in hitLevels" :key="level" :class="stepClass(level)">{{ level }}</li>
      </ol>
      <svg class="card-envy-track__bracket" viewBox="0 0 100 18" preserveAspectRatio="none">
        <path d="M2 2V7H98V2M50 7V16" vector-effect="non-scaling-stroke"/>
      </svg>
      <span class="card-envy-track__loss">
        <span class="card-envy-track__minus">−</span>
        <img v-for="index in item.influenceLoss" :key="index" class="card-envy-track__influence red-outline" :src="INFLUENCE_ICON" alt="">
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ICardRenderEnvyTrack} from '@/common/cards/render/Types';
import {ENVY_LEVELS} from './envyLevels';
import {duneGraphic} from './duneGraphic';

const INFLUENCE_ICON = duneGraphic('res-landsraad');

export default defineComponent({
  name: 'CardEnvyTrack',
  props: {
    item: {
      type: Object as PropType<ICardRenderEnvyTrack>,
      required: true,
    },
  },
  computed: {
    INFLUENCE_ICON(): string {
      return INFLUENCE_ICON;
    },
    freeLevels(): ReadonlyArray<number> {
      return ENVY_LEVELS.filter((level) => level < this.item.hitFrom);
    },
    hitLevels(): ReadonlyArray<number> {
      return ENVY_LEVELS.filter((level) => level >= this.item.hitFrom);
    },
  },
  methods: {
    stepClass(level: number): Array<string> {
      return ['card-envy-track__step', 'card-envy-track__step--' + level];
    },
  },
});
</script>
