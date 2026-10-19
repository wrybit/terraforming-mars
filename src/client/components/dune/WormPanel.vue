<template>
  <!-- Shai-Hulud (Dune module C): the worm's trail on a small map of Arrakis, below it the rules – where it starts and
       what it does to the spaces it crosses. Choosing the distance and paying a levy come as inputs of their own
       (WormMoveInput.vue, levy input). -->
  <div class="dune-worm" data-test="dune-worm">
    <WormTrail :trail="worm.trail"/>
    <DuneRuleCards :rules="WORM_RULES"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormModel} from '@/common/dune/DuneModel';
import WormTrail from './WormTrail.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import {WORM_RULES} from './duneRules';

export default defineComponent({
  name: 'WormPanel',
  components: {WormTrail, DuneRuleCards},
  props: {
    worm: {
      type: Object as PropType<WormModel>,
      required: true,
    },
  },
  computed: {
    WORM_RULES(): typeof WORM_RULES {
      return WORM_RULES;
    },
  },
});
</script>
