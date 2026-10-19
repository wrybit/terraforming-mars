<template>
  <!-- The move opened in this module tab (duneMoves.ts): choices as tiles level by level, the last step with the input
       of the app (confirm button, amount stepper, space on the board). Takes the hotkeys while open (Enter confirms). -->
  <div v-if="target !== undefined" class="dune-move" data-test="dune-move" data-hotkey-group data-hotkey-group-active="true">
    <div class="dune-move__head">
      <span class="dune-move__title">{{ $t(target.title) }}</span>
      <button type="button" class="dune-move__close" :aria-label="$t('Close')" :title="$t('Close')" @click="close">✕</button>
    </div>
    <div v-for="level in levels" :key="level.depth" class="dune-move__level">
      <span v-if="level.depth > 0" class="dune-move__subtitle">{{ $t(level.input.title) }}</span>
      <div class="choice-options dune-move__tiles">
        <ChoiceOptionTile v-for="(option, index) in level.options" :key="index"
          :title="option.title"
          :player="thisPlayer"
          :selected="chosen[level.depth] === index"
          :groupName="'dune-move-' + level.depth"
          @select="choose(level.depth, index)"/>
      </div>
    </div>
    <div v-if="leaf !== undefined && leaf.type === 'option'" class="dune-move__confirm">
      <AppButton hotkey="proceed" size="big" :title="$t(leaf.buttonLabel)" @click="confirmOption"/>
    </div>
    <div v-else-if="leaf !== undefined && playerView !== undefined" class="dune-move__input">
      <PlayerInputFactory :key="chosen.join('-')" :playerView="playerView" :playerinput="leaf" :onsave="sendLeaf" :showsave="true" :showtitle="chosen.length > 0"/>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {InputResponse} from '@/common/inputs/InputResponse';
import {DuneBoardTabId} from '@/client/components/boardTabs/boardTabs';
import {vueRoot} from '@/client/components/vueRoot';
import ChoiceOptionTile from '@/client/components/ChoiceOptionTile.vue';
import AppButton from '@/client/components/common/AppButton.vue';
import {duneInputComponent} from './duneInputs';
import {closeMove, inputAt, movePath, openDuneMove, optionsOf, sendMove, wrapResponse} from './duneMoves';

type Level = {depth: number, input: PlayerInputModel, options: ReadonlyArray<PlayerInputModel>};

export default defineComponent({
  name: 'DuneMovePanel',
  components: {
    ChoiceOptionTile,
    AppButton,
    // PlayerInputFactory is registered globally (main.ts)
  },
  props: {
    tab: {
      type: String as PropType<DuneBoardTabId>,
      required: true,
    },
  },
  data() {
    return {
      // Chosen option per level below the move
      chosen: [] as Array<number>,
    };
  },
  computed: {
    playerView(): PlayerViewModel | undefined {
      return vueRoot(this).playerView;
    },
    thisPlayer(): PublicPlayerModel | undefined {
      return this.playerView?.thisPlayer;
    },
    waitingFor(): PlayerInputModel | undefined {
      return this.playerView?.waitingFor;
    },
    // Indices from the waiting input to the move; undefined when this tab has no open move or it is gone
    chain(): Array<number> | undefined {
      if (openDuneMove.tab !== this.tab) {
        return undefined;
      }
      return movePath(this.waitingFor, openDuneMove.path);
    },
    target(): PlayerInputModel | undefined {
      return this.chain === undefined || this.waitingFor === undefined ? undefined : inputAt(this.waitingFor, this.chain);
    },
    // The move has its own picture (e.g. the worm's way on the map): shown whole instead of as tiles
    ownInput(): boolean {
      return this.target !== undefined && this.playerView !== undefined && duneInputComponent(this.target, this.playerView) !== undefined;
    },
    // Choices from the move down to the first unchosen one
    levels(): Array<Level> {
      const levels: Array<Level> = [];
      if (this.ownInput) {
        return levels;
      }
      let node = this.target;
      for (let depth = 0; node !== undefined && node.type === 'or'; depth++) {
        levels.push({depth, input: node, options: optionsOf(node)});
        const index = this.chosen[depth];
        node = index === undefined ? undefined : optionsOf(node)[index];
      }
      return levels;
    },
    // Last step: the chosen input that is no further choice
    leaf(): PlayerInputModel | undefined {
      if (this.ownInput) {
        return this.target;
      }
      const node = this.target === undefined ? undefined : inputAt(this.target, this.chosen);
      return node === undefined || node.type === 'or' ? undefined : node;
    },
  },
  watch: {
    // Another move or new state from the server: start again at the top
    chain(next: Array<number> | undefined, previous: Array<number> | undefined) {
      if (next?.join() !== previous?.join()) {
        this.chosen = [];
      }
    },
    'openDuneMove.path'() {
      this.chosen = [];
    },
    // Freshly opened: into view, the tab box may have to scroll
    target(next: PlayerInputModel | undefined, previous: PlayerInputModel | undefined) {
      if (next !== undefined && previous === undefined) {
        this.$nextTick(() => (this.$el as HTMLElement | undefined)?.scrollIntoView?.({block: 'nearest', behavior: 'smooth'}));
      }
    },
  },
  methods: {
    choose(depth: number, index: number): void {
      this.chosen = [...this.chosen.slice(0, depth), index];
    },
    send(response: InputResponse): void {
      if (this.chain !== undefined) {
        sendMove(wrapResponse([...this.chain, ...this.chosen], response));
      }
    },
    sendLeaf(response: InputResponse): void {
      this.send(response);
    },
    confirmOption(): void {
      this.send({type: 'option'});
    },
    close(): void {
      closeMove();
    },
  },
  setup() {
    return {openDuneMove};
  },
});
</script>
