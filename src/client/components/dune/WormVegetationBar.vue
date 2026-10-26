<template>
  <!-- How far the worm may move (common/dune/wormDistance.ts): the vegetation track as hexes in three groups, above
       them the distance of each group as a round button. Placed greeneries fill from the right; the first free
       hex from the right is outlined, its group gives the distance (Jens, 21 Oct 2026). -->
  <div class="worm-vegetation" data-test="worm-vegetation">
    <div class="worm-vegetation__track">
      <!-- Row labels: the distances above, the vegetation track below ('Oxygen' reads Vegetation in the Dune theme) -->
      <span class="worm-vegetation__labels">
        <span class="worm-vegetation__label worm-vegetation__label--distance">{{ $t('Worm path (max.)') }}</span>
        <span class="worm-vegetation__label worm-vegetation__label--track">{{ $t('Oxygen') }}</span>
      </span>
      <!-- 0: the worm stays where it is (Jens, 26 Oct 2026); no steps of the track belong to it -->
      <div class="worm-vegetation__section">
        <button type="button"
          :class="['worm-vegetation__distance', {'worm-vegetation__distance--chosen': chosen === 0}]"
          :disabled="!choosable.includes(0)" :aria-pressed="chosen === 0"
          @click="$emit('choose', 0)">0</button>
        <!-- Its slot in the track: the empty step with the worm on it, so the 0 is not a gap (Jens, 26 Oct 2026) -->
        <span class="worm-vegetation__hexes">
          <span class="worm-vegetation__hex worm-vegetation__hex--worm"><img :src="wormToken" alt=""></span>
        </span>
      </div>
      <template v-for="section in sections" :key="section.distance">
      <!-- Dashed line between the steps, in the row of the track (Jens, 26 Oct 2026) -->
      <span class="worm-vegetation__divider" aria-hidden="true"></span>
      <div class="worm-vegetation__section">
        <!-- The distances are buttons too, for players who pick the number instead of the space on the map (and where
             two targets share a space after a bounce). Beyond the reach of the worm they are disabled (Jens, 25 Oct 2026) -->
        <button type="button"
          :class="['worm-vegetation__distance', {'worm-vegetation__distance--chosen': section.distance === chosen}]"
          :disabled="!choosable.includes(section.distance)" :aria-pressed="section.distance === chosen"
          @click="$emit('choose', section.distance)">{{ section.distance }}</button>
        <span class="worm-vegetation__hexes">
          <span v-for="step in section.steps" :key="step.index"
            :class="['worm-vegetation__hex', {'worm-vegetation__hex--front': step.front}]">
            <img v-if="step.filled" :src="greenery" alt="">
          </span>
        </span>
      </div>
      </template>
    </div>
    <p class="worm-vegetation__caption">{{ caption }}</p>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
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
    /** Distances the player can choose (one per option of the input) */
    choosable: {
      type: Array as PropType<ReadonlyArray<number>>,
      default: () => [],
    },
    /** Distance of the chosen way, undefined before a choice */
    chosen: {
      type: Number,
      default: undefined,
    },
  },
  emits: ['choose'],
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
    wormToken(): string {
      return duneGraphic('token-worm');
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
