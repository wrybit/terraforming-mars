<template>
  <!-- Shai-Hulud (Dune module C): the worm's trail on a small map of Arrakis and what it does to the spaces it crosses.
       Choosing the distance and paying a levy come as inputs of their own (WormMoveInput.vue, levy input). -->
  <div class="dune-worm" data-test="dune-worm">
    <WormTrail :trail="worm.trail"/>
    <ul class="dune-worm__effects">
      <li v-for="effect in EFFECTS" :key="effect.tile">
        <img class="dune-worm__tile" :src="graphic(effect.tile)" alt="">
        <span>{{ $t(effect.text) + (effect.detail === undefined ? '' : ' ' + effect.detail) }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormModel} from '@/common/dune/DuneModel';
import {duneGraphic} from './duneGraphic';
import WormTrail from './WormTrail.vue';
import {WORM_START_SPACES} from '@/common/dune/wormStartSpaces';
import {arrakisCoordinate} from '@/common/dune/arrakisCoordinates';

// First rule: where the worm starts (Jens, 19 Oct 2026), with the coordinates of the start spaces after the text
const START_SPACES = WORM_START_SPACES.map((spaceId) => arrakisCoordinate(spaceId)).join(', ');

const EFFECTS = [
  {tile: 'token-worm', text: 'Start: the worm starts at random on one of these spaces:', detail: START_SPACES},
  {tile: 'tile-small-spicefield', text: 'Spice field: +1 spice for each adjacent tile of a player'},
  {tile: 'tile-small-sietch', text: 'City: worm riders, the owner gains 1 spice and 2 heat'},
  {tile: 'tile-small-planting', text: 'Greenery: trampled, the owner loses 3 plants'},
  {tile: 'tile-small-special', text: 'Special tile: damaged, the owner loses 3 M€'},
  {tile: 'special-worm-domain', text: 'Natural Preserve: the worm stops, the owner gains 1 TR'},
];

export default defineComponent({
  name: 'WormPanel',
  components: {WormTrail},
  props: {
    worm: {
      type: Object as PropType<WormModel>,
      required: true,
    },
  },
  computed: {
    EFFECTS(): typeof EFFECTS {
      return EFFECTS;
    },
  },
  methods: {
    graphic: duneGraphic,
  },
});
</script>
