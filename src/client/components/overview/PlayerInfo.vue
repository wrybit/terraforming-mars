<template>
      <!-- Ganze Spielerleiste ist klickbar und öffnet die gespielten Karten -->
      <div :class="getClasses()" @click="togglePlayerDetails">
        <div class="player-status-and-res">
        <div class="player-status">
          <div class="player-info-details">
            <div class="player-info-name">{{ playerSymbol + player.name }}</div>
            <span v-for="(corporationName, index) in getCorporationName()" :key="index" v-i18n>
              <div class="player-info-corp" :title="$t(corporationName)">
                {{ corporationName }}
              </div>
            </span>
          </div>
          <div>
            <div class="icon-first-player" v-if="firstForGen && playerView.players.length > 1" v-i18n>1st</div>
            <PlayerStatus :timer="player.timer" :showTimer="playerView.game.gameOptions.showTimers" :liveTimer="playerView.game.phase !== Phase.END" :firstForGen="firstForGen" v-trim-whitespace :actionLabel="actionLabel"/>
          </div>
        </div>
          <PlayerResources :player="player" v-trim-whitespace />
          <div class="player-played-cards">
            <!-- Kein eigener Klick-Handler: der Klick läuft zur Leiste hoch; Button bleibt für Tastaturbedienung -->
            <button type="button" class="btn btn-tiny btn-rounded played-cards-button">
              <span>{{ $t(buttonLabel()) }}</span>
              <span class="played-cards-count">{{ numberOfPlayedCards() }}</span>
            </button>
          </div>
          <div class="tag-display player-board-blue-action-counter" :class="tooltipCss" :data-tooltip="$t('The number of available actions on active cards')">
            <div class="tag-count tag-action-card">
              <div class="blue-stripe"></div>
              <div class="red-arrow"></div>
            </div>
            <span class="tag-count-display">{{ availableBlueActionCount() }}</span>
          </div>
        </div>
        <PlayerTags :player="player" :playerView="playerView" :hideZeroTags="hideZeroTags" :isTopBar="isTopBar" />
        <PlayerAlliedParty :player="player"/>
      </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {ViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';
import PlayerResources from '@/client/components/overview/PlayerResources.vue';
import PlayerTags from '@/client/components/overview/PlayerTags.vue';
import PlayerAlliedParty from '@/client/components/overview/PlayerAlliedParty.vue';
import PlayerStatus from '@/client/components/overview/PlayerStatus.vue';
import {playerColorClass} from '@/common/utils/utils';
import {vueRoot} from '@/client/components/vueRoot';
import {range} from '@/common/utils/utils';
import {CardType} from '@/common/cards/CardType';
import {getCard} from '@/client/cards/ClientCardManifest';
import {Phase} from '@/common/Phase';
import {ActionLabel} from './ActionLabel';
import {playerSymbol} from '@/client/utils/playerSymbol';

export default defineComponent({
  name: 'PlayerInfo',
  props: {
    player: {
      type: Object as () => PublicPlayerModel,
      required: true,
    },
    playerView: {
      type: Object as () => ViewModel,
      required: true,
    },
    firstForGen: {
      type: Boolean,
      default: false,
    },
    actionLabel: {
      type: String as () => ActionLabel,
      required: true,
    },
    playerIndex: {
      type: Number,
      required: true,
    },
    hideZeroTags: {
      type: Boolean,
      default: false,
    },
    isTopBar: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    PlayerResources,
    PlayerTags,
    PlayerAlliedParty,
    PlayerStatus,
  },
  computed: {
    tooltipCss(): string {
      return 'tooltip tooltip-' + (this.isTopBar ? 'bottom' : 'top');
    },
    playerSymbol(): string {
      return playerSymbol(this.player.color, ' ');
    },
    Phase(): typeof Phase {
      return Phase;
    },
  },
  methods: {
    isPinned(playerIndex: number): boolean {
      return vueRoot(this).getVisibilityState('pinned_player_' + playerIndex);
    },
    pin(playerIndex: number) {
      return vueRoot(this).setVisibilityState('pinned_player_' + playerIndex, true);
    },
    unpin(playerIndex: number) {
      return vueRoot(this).setVisibilityState('pinned_player_' + playerIndex, false);
    },
    // Umschalten: dieses Modal öffnen bzw. schließen, alle anderen Spieler immer schließen.
    // Alle Indizes – seit auch der eigene Spieler (in der Reihenfolge zuletzt) ein Modal hat.
    pinPlayer() {
      const wasPinned = this.isPinned(this.playerIndex);
      for (const index of range(this.playerView.players.length)) {
        this.unpin(index);
      }
      if (!wasPinned) {
        this.pin(this.playerIndex);
      }
    },
    buttonLabel(): string {
      return this.isPinned(this.playerIndex) ? 'hide' : 'show';
    },
    // Gespielte Karten des Spielers anzeigen (eigene wie fremde) und alle anderen ausblenden
    togglePlayerDetails() {
      this.pinPlayer();
    },
    getClasses(): string {
      return `player-info ${playerColorClass(this.player.color, 'bg_transparent')}`;
    },
    numberOfPlayedCards(): number {
      return this.player.tableau.length;
    },
    availableBlueActionCount(): number {
      return this.player.availableBlueCardActionCount;
    },
    getCorporationName(): string[] {
      const cards = this.player.tableau;
      const corporationCards = cards
        .filter((card) => getCard(card.name)?.type === CardType.CORPORATION)
        .map((card) => card.name);
      return corporationCards.length === 0 ? [''] : corporationCards;
    },
  },
});
</script>
