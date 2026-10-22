<template>
  <!-- How far the worm may move (common/dune/wormDistance.ts): the vegetation track as hexes in three groups, above
       them the distance of each group, the active one in a ring. Placed greeneries fill from the right; the first free
       hex from the right is outlined, its group gives the distance (Jens, 21 Oct 2026). -->
  <div class="worm-vegetation" data-test="worm-vegetation">
    <div class="worm-vegetation__track">
      <!-- Row labels: the distances above, the vegetation track below ('Oxygen' reads Vegetation in the Dune theme) -->
      <span class="worm-vegetation__labels">
        <span class="worm-vegetation__label worm-vegetation__label--distance">{{ $t('Worm path (max.)') }}</span>
        <span class="worm-vegetation__label worm-vegetation__label--track">{{ $t('Oxygen') }}</span>
      </span>
      <div v-for="section in sections" :key="section.distance"
        :class="['worm-vegetation__section', {'worm-vegetation__section--active': section.distance === distance}]">
        <span class="worm-vegetation__distance">{{ section.distance }}</span>
        <span class="worm-vegetation__hexes">
          <span v-for="step in section.steps" :key="step.index"
            :class="['worm-vegetation__hex', {'worm-vegetation__hex--front': step.front}]">
            <img v-if="step.filled" :src="greenery" alt="">
          </span>
        </span>
      </div>
    </div>
    <p class="worm-vegetation__caption">{{ caption }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {THUMPER_DISTANCE, wormDistanceFor, wormDistanceSections} from '@/common/dune/wormDistance';
import {translateTextWithParams} from '@/client/directives/i18n';
import {duneGraphic} from './duneGraphic';

type Step = {index: number, filled: boolean, front: boolean};

export default defineComponent({
  name: 'WormVegetationBar',
  props: {
    /** Vegetation level (oxygen steps) */
    vegetation: {
      type: Number,
      required: true,
    },
    /** Top of the vegetation track of the board */
    maximum: {
      type: Number,
      required: true,
    },
    /** Thumper card this generation: up to THUMPER_DISTANCE spaces, whatever the vegetation (Jens 22 Oct 2026) */
    thumper: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    distance(): number {
      const byVegetation = wormDistanceFor(this.vegetation, this.maximum);
      return this.thumper ? Math.max(THUMPER_DISTANCE, byVegetation) : byVegetation;
    },
    sections(): Array<{distance: number, steps: Array<Step>}> {
      const free = Math.max(0, this.maximum - this.vegetation);
      let index = 0;
      return wormDistanceSections(this.maximum).map((size, section) => ({
        distance: section + 1,
        steps: Array.from({length: size}, () => {
          const step = {index, filled: index >= free, front: index === free - 1};
          index++;
          return step;
        }),
      }));
    },
    greenery(): string {
      return duneGraphic('tile-planting');
    },
    caption(): string {
      if (this.thumper) {
        return translateTextWithParams('Thumper: the worm moves up to ${0} space(s), whatever the vegetation', [String(this.distance)]);
      }
      return translateTextWithParams('${0} of ${1} greeneries: the worm moves up to ${2} space(s)',
        [String(Math.min(this.vegetation, this.maximum)), String(this.maximum), String(this.distance)]);
    },
  },
});
</script>
