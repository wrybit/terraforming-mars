<template>
  <!-- A Dune move whose step is a space on Arrakis (opening a Kanly: the war field, duneMoves.ts): the planet is
       enlarged at once and the space chosen there (Jens 21 Oct 2026) – no button in the tab. Lives next to the board
       tabs, not in a tab: switching to the Arrakis tab would otherwise end the selection. Closing the large planet
       keeps the spaces selectable on the small one; the Kanly button closes the move. -->
  <div v-if="spaceInput !== undefined && playerView !== undefined" class="dune-space-move">
    <SelectSpace :key="openDuneMove.path.map((step) => step.title).join('/')" :playerView="playerView" :playerinput="spaceInput"
      :onsave="send" :showsave="true" :showtitle="false" :autoEnlarge="true"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {PlayerInputModel, SelectSpaceModel} from '@/common/models/PlayerInputModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {vueRoot} from '@/client/components/vueRoot';
import SelectSpace from '@/client/components/SelectSpace.vue';
import {inputAt, movePath, openDuneMove, sendMove, wrapResponse} from './duneMoves';

export default defineComponent({
  name: 'DuneSpaceMove',
  components: {SelectSpace},
  setup() {
    return {openDuneMove};
  },
  computed: {
    playerView(): PlayerViewModel | undefined {
      return vueRoot(this).playerView;
    },
    waitingFor(): PlayerInputModel | undefined {
      return this.playerView?.waitingFor;
    },
    chain(): Array<number> | undefined {
      return openDuneMove.tab === undefined ? undefined : movePath(this.waitingFor, openDuneMove.path);
    },
    spaceInput(): SelectSpaceModel | undefined {
      const target = this.chain === undefined || this.waitingFor === undefined ? undefined : inputAt(this.waitingFor, this.chain);
      return target?.type === 'space' ? target : undefined;
    },
  },
  methods: {
    send(response: InputResponse): void {
      if (this.chain !== undefined) {
        sendMove(wrapResponse(this.chain, response));
      }
    },
  },
});
</script>
