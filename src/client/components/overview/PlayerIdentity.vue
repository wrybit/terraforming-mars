<template>
  <div :class="['players-table-identity', {'players-table-identity--me': highlighted, 'players-table-identity--acting': actionLabel === 'active'}]">
    <!-- Spieler-Kopf: Zeile 1 Name + Status/Zeit, Zeile 2 Konzern.
         Gemeinsam für Spieler-Tabelle und Meilenstein-Tabelle, damit beide Ansichten denselben Kopf zeigen -->
    <div class="players-table-identity-line">
      <span class="players-table-name">{{ symbol + player.name }}</span>
      <PlayerStatus :timer="player.timer" :showTimer="playerView.game.gameOptions.showTimers" :liveTimer="playerView.game.phase !== Phase.END" :actionLabel="actionLabel" v-trim-whitespace/>
    </div>
    <div class="players-table-corporation" :title="corporations">{{ corporations }}</div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {Phase} from '@/common/Phase';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import PlayerStatus from '@/client/components/overview/PlayerStatus.vue';
import {corporationNames} from '@/client/components/overview/playerCorporations';
import {playerSymbol} from '@/client/utils/playerSymbol';

export default defineComponent({
  name: 'PlayerIdentity',
  components: {
    PlayerStatus,
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
    // Eigener Spieler: Name etwas größer
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
    corporations(): string {
      return corporationNames(this.player).map((name) => this.$t(name)).join(' · ');
    },
  },
});
</script>
