<template>
  <div :class="['players-table-identity', {'players-table-identity--me': highlighted, 'players-table-identity--acting': actionLabel === 'active'}]">
    <!-- Player header: row 1 name + status/time, row 2 corporation.
         Shared by the player table and milestone table so both views show the same header -->
    <div class="players-table-identity-line">
      <span class="players-table-name">{{ symbol + player.name }}</span>
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

export default defineComponent({
  name: 'PlayerIdentity',
  components: {
    PlayerStatus,
    EscapeVelocityClock,
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
  computed: {
    Phase(): typeof Phase {
      return Phase;
    },
    symbol(): string {
      return playerSymbol(this.player.color, ' ');
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
