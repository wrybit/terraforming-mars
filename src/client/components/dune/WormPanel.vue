<template>
  <!-- Shai-Hulud (Dune module C): the worm's trail on a small map of Arrakis, below it the rules – where it starts and
       what it does to the spaces it crosses. Choosing the distance and paying a levy come as inputs of their own
       (WormMoveInput.vue, levy input). -->
  <div class="dune-worm" data-test="dune-worm">
    <WormTrail :trail="worm.trail" :board="board"/>
    <DuneRuleCards :rules="rules"/>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {WormModel} from '@/common/dune/DuneModel';
import WormTrail from './WormTrail.vue';
import DuneRuleCards from './DuneRuleCards.vue';
import {DuneRule, wormRules} from './duneRules';
import {BoardName} from '@/common/boards/BoardName';
import {arrakisLayout} from '@/common/dune/arrakisLayout';

export default defineComponent({
  name: 'WormPanel',
  components: {WormTrail, DuneRuleCards},
  props: {
    worm: {
      type: Object as PropType<WormModel>,
      required: true,
    },
    /** The game's Arrakis board (standard or large) */
    board: {
      type: String as PropType<BoardName>,
      default: BoardName.ARRAKIS,
    },
  },
  computed: {
    rules(): ReadonlyArray<DuneRule> {
      return wormRules(arrakisLayout(this.board));
    },
  },
});
</script>
