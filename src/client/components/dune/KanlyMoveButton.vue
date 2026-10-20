<template>
  <!-- A Kanly move right on the war field card (KanlyBattleCard slot): opens it below the card in the Kanly tab
       (DuneMovePanel.vue, duneMoves.ts); a second tap closes it. A normal app button (AppButton) with the cost as the
       M€ coin inside, like "Buy [2] for (6)" (Jens, 20 Oct 2026). While the move is not offered it is greyed out and
       the reason stands below it; only for a player. -->
  <div v-if="isPlayer" class="kanly-move">
    <AppButton :title="label" :counts="counts" :disabled="!offered" :disableOnServerBusy="false"
      :class="['kanly-move-button', {'kanly-move-button--open': isOpen}]" @click="toggle"/>
    <span v-if="!offered && reason !== undefined" class="kanly-move__reason">{{ $t(reason) }}</span>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {vueRoot} from '@/client/components/vueRoot';
import AppButton from '@/client/components/common/AppButton.vue';
import {ButtonCountPart} from '@/client/components/common/buttonCount';
import {closeMove, isMoveOffered, openDuneMove, openMove} from './duneMoves';

export default defineComponent({
  name: 'KanlyMoveButton',
  components: {AppButton},
  props: {
    // English title of the move (common/dune/duneActionTitles.ts)
    moveTitle: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
    },
    // Solari the move costs, shown as the M€ coin in the button
    cost: {
      type: Number,
      default: undefined,
    },
    // Why the move is not possible right now (English key), shown below the greyed-out button
    reason: {
      type: String,
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
      return isMoveOffered(this.waitingFor, [{title: this.moveTitle}]);
    },
    isOpen(): boolean {
      return openDuneMove.tab === 'kanly' && openDuneMove.path[0]?.title === this.moveTitle;
    },
    counts(): ReadonlyArray<ButtonCountPart> {
      return this.cost === undefined ? [] : [{kind: 'megacredits', value: this.cost}];
    },
  },
  methods: {
    toggle(): void {
      if (this.isOpen) {
        closeMove();
      } else {
        openMove('kanly', [{title: this.moveTitle}]);
      }
    },
  },
});
</script>
