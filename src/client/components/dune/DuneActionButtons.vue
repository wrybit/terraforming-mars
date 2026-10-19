<template>
  <!-- Buttons of a module tab: each opens its move right here in the tab (DuneMovePanel.vue, duneMoves.ts), or – for a
       move with its own tab in the action menu – that tab (actionTabRequest.ts); greyed out with the reason when the
       move is not possible right now. Only for a player, not for spectators. -->
  <div v-if="actions.length > 0 && isPlayer" class="dune-actions" data-test="dune-actions">
    <div v-for="action in actions" :key="action.label" class="dune-actions__item">
      <button type="button" :class="['dune-actions__button', {'dune-actions__button--open': isOpen(action)}]" :disabled="!offered(action)" @click="open(action)">{{ $t(action.label) }}</button>
      <span v-if="!offered(action)" class="dune-actions__reason">{{ $t(action.unavailable) }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import {vueRoot} from '@/client/components/vueRoot';
import {closeMove, isMoveOffered, openDuneMove, openMove} from './duneMoves';
import {DuneTabAction} from './duneTabActions';
import {requestActionTab} from '@/client/components/actionTabRequest';

export default defineComponent({
  name: 'DuneActionButtons',
  props: {
    tab: {
      type: String as PropType<DuneBoardTabId>,
      required: true,
    },
    actions: {
      type: Array as PropType<ReadonlyArray<DuneTabAction>>,
      required: true,
    },
  },
  computed: {
    isPlayer(): boolean {
      return vueRoot(this).playerView !== undefined;
    },
    waitingFor(): PlayerInputModel | undefined {
      return vueRoot(this).playerView?.waitingFor;
    },
  },
  methods: {
    offered(action: DuneTabAction): boolean {
      return isMoveOffered(this.waitingFor, action.path);
    },
    isOpen(action: DuneTabAction): boolean {
      return action.actionTab !== true && openDuneMove.tab === this.tab && openDuneMove.path[0]?.title === action.path[0]?.title;
    },
    // A second tap closes the move again
    open(action: DuneTabAction): void {
      if (action.actionTab === true) {
        closeMove();
        requestActionTab(action.path[0].title);
      } else if (this.isOpen(action)) {
        closeMove();
      } else {
        openMove(this.tab, action.path);
      }
    },
  },
});
</script>
