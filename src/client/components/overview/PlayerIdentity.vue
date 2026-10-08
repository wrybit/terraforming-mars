<template>
  <div :class="['players-table-identity', {'players-table-identity--me': highlighted, 'players-table-identity--acting': actionLabel === 'active', 'players-table-identity--compact': compact}]">
    <!-- Player header: row 1 name + status/time, row 2 corporation.
         Shared by the player table and milestone table so both views show the same header -->
    <div class="players-table-identity-line" ref="line">
      <!-- Narrow name cell: the name itself is shortened with an ellipsis, the AI marker and the status plaque stay whole -->
      <span class="players-table-name" :title="player.name">
        <span class="players-table-name-text">{{ symbol + nameParts.name }}</span>
        <span v-if="nameParts.marker !== undefined" class="players-table-name-marker">{{ nameParts.marker }}</span>
      </span>
      <PlayerStatus :timer="player.timer" :showTimer="playerView.game.gameOptions.showTimers && escapeVelocity === undefined" :liveTimer="playerView.game.phase !== Phase.END" :actionLabel="actionLabel" v-trim-whitespace/>
    </div>
    <!-- Several corporations (Merger): joined by a gold plus -->
    <div class="players-table-corporation" :title="corporations">
      <template v-for="(name, index) in corporationList" :key="name"><span v-if="index > 0" class="players-table-corporation__plus">+</span>{{ name }}</template>
    </div>
    <!-- Escape Velocity: used against allowed thinking time, penalty once over -->
    <EscapeVelocityClock v-if="escapeVelocity !== undefined" :timer="player.timer" :actionsTaken="player.actionsTakenThisGame"
      :options="escapeVelocity" :live="playerView.game.phase !== Phase.END"/>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import PlayerStatus from '@/client/components/overview/PlayerStatus.vue';
import EscapeVelocityClock from '@/client/components/overview/EscapeVelocityClock.vue';
import {EscapeVelocityOptions} from '@/common/game/NewGameConfig';
import {corporationNames} from '@/client/components/overview/playerCorporations';
import {playerSymbol} from '@/client/utils/playerSymbol';
import {splitAiMarker} from '@/common/ai/AiLevel';

export default defineComponent({
  name: 'PlayerIdentity',
  setup() {
    return {resizeObserver: undefined as ResizeObserver | undefined};
  },
  components: {
    PlayerStatus,
    EscapeVelocityClock,
  },
  data() {
    return {
      // Name + status plaque too wide for the cell: the plaque drops the time first (players_table.less),
      // only then the name gets shortened
      compact: false,
    };
  },
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    actionLabel: {
      type: String as () => ActionLabel,
      required: true,
    },
    // Own player: name slightly larger
    highlighted: {
      type: Boolean,
      default: false,
    },
  },
  mounted() {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.updateCompact());
      this.resizeObserver.observe(this.$refs.line as HTMLElement);
    }
    this.updateCompact();
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
  },
  watch: {
    // Label ("passed") or name change the width of the line
    actionLabel() {
      this.$nextTick(() => this.updateCompact());
    },
    'player.name'() {
      this.$nextTick(() => this.updateCompact());
    },
  },
  methods: {
    // Measured without the compact class, otherwise the line could never get wide again
    updateCompact() {
      const line = this.$refs.line as HTMLElement | undefined;
      if (line === undefined) {
        return;
      }
      const root = this.$el as HTMLElement;
      root.classList.remove('players-table-identity--compact');
      // The name shrinks instead of overflowing the line, so "too narrow" shows as a shortened name
      const name = line.querySelector<HTMLElement>('.players-table-name-text');
      // Only when name and plaque share a row (the transposed mobile table stacks them, mobile.less)
      const sharesRow = getComputedStyle(line).flexDirection === 'row';
      const overflows = sharesRow && (line.scrollWidth > line.clientWidth + 1 || (name !== null && name.scrollWidth > name.clientWidth + 1));
      root.classList.toggle('players-table-identity--compact', this.compact);
      this.compact = overflows;
    },
  },
  computed: {
    Phase(): typeof Phase {
      return Phase;
    },
    symbol(): string {
      return playerSymbol(this.player.color, ' ');
    },
    nameParts(): {name: string, marker: string | undefined} {
      return splitAiMarker(this.player.name);
    },
    corporationList(): Array<string> {
      return corporationNames(this.player).map((name) => this.$t(name));
    },
    corporations(): string {
      return this.corporationList.join(' + ');
    },
    escapeVelocity(): EscapeVelocityOptions | undefined {
      return this.playerView.game.gameOptions.escapeVelocity;
    },
  },
});
</script>
