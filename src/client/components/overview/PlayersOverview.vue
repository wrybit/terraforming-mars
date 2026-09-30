<template>
        <div class="players-overview" v-if="hasPlayers()">
            <!-- Gespielte Karten aller Spieler, auch der eigenen (über "anzeigen" in der Spielerleiste) -->
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
            <!-- Dieselben Spieler als Tabelle; sichtbar nur im Zwei-Spalten-Layout (players_table.less) -->
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
    // Gleiche Reihenfolge und Indizes wie die klassische Leiste: Mitspieler in Zugfolge, man selbst zuletzt
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
    // Mitspieler in Zugreihenfolge nach einem selbst, ohne den eigenen Spieler (der wird extra angehängt)
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
