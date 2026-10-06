<template>
  <!-- Planet photo of a colony in a round frame, the disc filling it exactly (colonyView.ts) -->
  <span class="colony-planet"><img :src="image.src" :style="image.style" alt=""></span>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {ColonyName} from '@/common/colonies/ColonyName';
import {PlanetImage, planetImage} from './colonyView';

export default defineComponent({
  name: 'ColonyPlanet',
  props: {
    name: {
      type: String as PropType<ColonyName>,
      required: true,
    },
  },
  computed: {
    image(): PlanetImage {
      return planetImage(this.name);
    },
  },
});
</script>
