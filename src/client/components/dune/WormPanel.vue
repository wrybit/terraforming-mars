<template>
  <!-- Shai-Hulud (Dune module C): the worm's trail on a small map of Arrakis and what it does to the spaces it crosses.
       Choosing the distance and paying a levy come as inputs of their own (WormMoveInput.vue, levy input). -->
  <div class="dune-worm" data-test="dune-worm">
    <WormTrail :trail="worm.trail"/>
    <ul class="dune-worm__effects">
      <li v-for="effect in EFFECTS" :key="effect.tile">
        <img class="dune-worm__tile" :src="graphic(effect.tile)" alt="">
        <span>{{ $t(effect.text) }}</span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormModel} from '@/common/dune/DuneModel';
import {duneGraphic} from './duneGraphic';
import WormTrail from './WormTrail.vue';

const EFFECTS = [
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
