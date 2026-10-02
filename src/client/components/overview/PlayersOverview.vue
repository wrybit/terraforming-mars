<template>
        <div class="players-overview" v-if="hasPlayers()">
            <!-- Played cards of all players, including your own (via "show" in the player bar) -->
            <div class="other_player">
                <div v-for="(otherPlayer, index) in getPlayersInOrder()" :key="otherPlayer.color">
                    <OtherPlayer :player="otherPlayer" :playerIndex="index"/>
                </div>
                <div v-if="thisPlayer !== undefined">
                    <OtherPlayer :player="thisPlayer" :playerIndex="ownPlayerIndex(playerView)"/>
                </div>
            </div>
            <PlayerInfo v-for="(p, index) in getPlayersInOrder()"
              :player="p"
              :key="p.color"
              :playerView="playerView"
              :firstForGen="getIsFirstForGen(p)"
              :actionLabel="getActionLabel(p)"
              :playerIndex="index"/>
            <PlayerInfo
              v-if="thisPlayer !== undefined"
              :player="thisPlayer"
              :key="thisPlayer.color"
              :playerView="playerView"
              :firstForGen="getIsFirstForGen(thisPlayer)"
              :actionLabel="getActionLabel(thisPlayer)"
              :playerIndex="ownPlayerIndex(playerView)"/>
            <!-- The same players as a table; visible only in the two-column layout (players_table.less) -->
            <PlayersTable :playerView="playerView" :rows="tableRows"/>
        </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import PlayerInfo from '@/client/components/overview/PlayerInfo.vue';
import PlayersTable from '@/client/components/overview/PlayersTable.vue';
import {PlayersTableRowModel} from '@/client/components/overview/playersTableLayout';
import OtherPlayer from '@/client/components/OtherPlayer.vue';
import {ownPlayerIndex} from '@/client/components/overview/ownPlayerIndex';
import {playersInTurnOrder} from '@/client/utils/playersInTurnOrder';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {playerActionLabel} from '@/client/components/overview/playerActionLabel';
import {Color} from '@/common/Color';

export const playerIndex = (
  color: Color,
  players: Array<PublicPlayerModel>,
): number => {
  for (let idx = 0; idx < players.length; idx++) {
    if (players[idx].color === color) {
      return idx;
    }
  }
  return -1;
};

export default defineComponent({
  name: 'PlayersOverview',
  props: {
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
  },
  computed: {
    players(): Array<PublicPlayerModel> {
      return this.playerView.players;
    },
    thisPlayer(): PublicPlayerModel | undefined {
      return this.playerView.thisPlayer;
    },
    // Same order and indices as the classic bar: other players in turn order, yourself last
    tableRows(): Array<PlayersTableRowModel> {
      const rows = this.getPlayersInOrder().map((player, index) => this.tableRow(player, index));
      if (this.thisPlayer !== undefined) {
        rows.push(this.tableRow(this.thisPlayer, ownPlayerIndex(this.playerView)));
      }
      return rows;
    },
  },
  components: {
    PlayerInfo,
    PlayersTable,
    OtherPlayer,
  },
  data() {
    return {};
  },
  methods: {
    ownPlayerIndex,
    tableRow(player: PublicPlayerModel, index: number): PlayersTableRowModel {
      return {player, firstForGen: this.getIsFirstForGen(player), actionLabel: this.getActionLabel(player), playerIndex: index};
    },
    hasPlayers(): boolean {
      return this.players.length > 0;
    },
    getIsFirstForGen(player: PublicPlayerModel): boolean {
      return playerIndex(player.color, this.players) === 0;
    },
    // Other players in turn order after yourself, without your own player (that one is appended separately)
    getPlayersInOrder(): Array<PublicPlayerModel> {
      if (this.thisPlayer === undefined) {
        return this.players;
      }
      return playersInTurnOrder(this.players, this.thisPlayer.color).slice(0, -1);
    },
    getActionLabel(player: PublicPlayerModel): ActionLabel {
      return playerActionLabel(player, this.playerView);
    },
  },
});
</script>
