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
import {isPlayerCardsPinned, togglePlayerCards} from '@/client/components/overview/playerCardsToggle';
import {corporationNames} from '@/client/components/overview/playerCorporations';
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
    buttonLabel(): string {
      return isPlayerCardsPinned(vueRoot(this), this.playerIndex) ? 'hide' : 'show';
    },
    // Gespielte Karten des Spielers anzeigen (eigene wie fremde) und alle anderen ausblenden
    togglePlayerDetails() {
      togglePlayerCards(vueRoot(this), this.playerIndex, this.playerView.players.length);
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
      const corporations = corporationNames(this.player);
      return corporations.length === 0 ? [''] : corporations;
    },
  },
});
</script>
