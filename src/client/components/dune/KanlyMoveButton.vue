<template>
  <!-- A Kanly move right on the war field card (KanlyBattleCard slot): opens it below the card in the Kanly tab
       (DuneMovePanel.vue, duneMoves.ts); a second tap closes it. Greyed out while the move is not offered, only for a
       player (Jens, 19 Oct 2026). -->
  <button v-if="isPlayer" type="button" :class="['dune-actions__button', 'kanly-move-button', {'dune-actions__button--open': isOpen}]"
    :disabled="!offered" @click="toggle">
    {{ $t(label) }}
    <span v-if="cost !== undefined" class="kanly-move-button__cost">(<i class="resource_icon resource_icon--megacredits"></i>{{ cost }})</span>
  </button>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {vueRoot} from '@/client/components/vueRoot';
import {closeMove, isMoveOffered, openDuneMove, openMove} from './duneMoves';

export default defineComponent({
  name: 'KanlyMoveButton',
  props: {
    // English title of the move (common/dune/duneActionTitles.ts)
    title: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    // Solari the move costs, shown in brackets
    cost: {
      type: Number,
      default: undefined,
    },
  },
  computed: {
    isPlayer(): boolean {
      return vueRoot(this).playerView !== undefined;
    },
    waitingFor(): PlayerInputModel | undefined {
      return vueRoot(this).playerView?.waitingFor;
    },
    offered(): boolean {
      return isMoveOffered(this.waitingFor, [{title: this.title}]);
    },
    isOpen(): boolean {
      return openDuneMove.tab === 'kanly' && openDuneMove.path[0]?.title === this.title;
    },
  },
  methods: {
    toggle(): void {
      if (this.isOpen) {
        closeMove();
      } else {
        openMove('kanly', [{title: this.title}]);
      }
    },
  },
});
</script>
