<template>
  <!-- Buttons of a module tab: each opens its move in the action menu (duneActions.ts); greyed out with the reason
       when the move is not possible right now. Only for a player, not for spectators. -->
  <div v-if="actions.length > 0 && isPlayer" class="dune-actions" data-test="dune-actions">
    <div v-for="action in actions" :key="action.label" class="dune-actions__item">
      <button type="button" class="dune-actions__button" :disabled="!offered(action)" @click="open(action)">{{ $t(action.label) }}</button>
      <span v-if="!offered(action)" class="dune-actions__reason">{{ $t(action.unavailable) }}</span>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {vueRoot} from '@/client/components/vueRoot';
import {isOffered, requestDuneAction} from './duneActions';
import {DuneTabAction} from './duneTabActions';

export default defineComponent({
  name: 'DuneActionButtons',
  props: {
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
      const last = action.path[action.path.length - 1];
      return last !== undefined && isOffered(this.waitingFor, last);
    },
    open(action: DuneTabAction): void {
      requestDuneAction(action.path);
    },
  },
});
</script>
