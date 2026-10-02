<template>
  <section class="mb-screen mb-screen--mars">
    <!-- Mars screen of the mobile view (players and spectators): board without the scale ring, below it the parameters as bars,
         then milestones etc. from GameBoardView. Comment inside so the caller's v-show hits the root -->
    <!-- Language, game details, help, settings: the same buttons as on desktop, here as a bar at the top -->
    <Sidebar class="mb-toolbar"
      :actingPlayer="acting"
      :playerColor="viewerColor ?? 'neutral'"
      :coloniesCount="game.colonies.length"
      :temperature="game.temperature"
      :oxygen="game.oxygenLevel"
      :oceans="game.oceans"
      :venus="game.venusScaleLevel"
      :turmoil="game.turmoil"
      :moonData="game.moon"
      :gameOptions="game.gameOptions"
      :playerNumber="players.length"
      :lastSoloGeneration="game.lastSoloGeneration"
      :deckSize="game.deckSize"
      :discardPileSize="game.discardPileSize"
      :otherDeckSizes="game.otherDeckSizes"
      :spectatorId="game.spectatorId"
      :expectedPurgeTimeMs="game.expectedPurgeTimeMs"/>
    <!-- Turn status: who is up or which task is pending; optionally your own game time on the right (slot) -->
    <div :class="['mb-banner', {'mb-banner--waiting': !acting}]">
      <span class="mb-banner-dot"></span>
      <span class="mb-banner-title">{{ bannerTitle }}</span>
      <slot name="timer"></slot>
    </div>
    <GameBoardView
      ref="gameBoardView"
      :game="game"
      :tileView="tileView"
      :players="players"
      :viewerColor="viewerColor"
      @toggleTileView="emit('toggleTileView')"
    />
    <!-- Tapping Mars also opens the large view (GameBoardView) -->
    <button type="button" class="mb-mars-zoom" @click="requestPlacementZoom">
      <!-- Icon only: no own texts next to the existing translations -->
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5L21 21M10.5 7.5v6M7.5 10.5h6"/></svg>
    </button>
    <MobileParameterBars
      :temperature="game.temperature"
      :oxygen="game.oxygenLevel"
      :oceans="game.oceans"
      :venus="game.gameOptions.expansions.venus ? game.venusScaleLevel : undefined"/>
    <div v-if="players.length > 1" class="mb-quick">
      <button type="button" @click="emit('showMilestones')">{{ $t('Milestones') }} <b>{{ claimedMilestones }}/{{ MAX_MILESTONES }}</b></button>
      <button type="button" @click="emit('showMilestones')">{{ $t('Awards') }} <b>{{ fundedAwards }}/{{ MAX_AWARDS }}</b></button>
    </div>
    <GameOverNotice v-if="game.phase === 'end'" :participantId="participantId"/>
    <div v-if="game.colonies.length > 0" class="mb-colonies">
      <h3 class="mb-section-label">{{ $t('Colonies') }}</h3>
      <div class="player_home_colony_cont">
        <div class="player_home_colony" v-for="colony in game.colonies" :key="colony.name">
          <Colony :colony="colony" :active="colony.isActive"/>
        </div>
      </div>
    </div>
    <!-- Further sections from the caller (e.g. own underground tokens) -->
    <slot></slot>
  </section>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {MAX_AWARDS, MAX_MILESTONES} from '@/common/constants';
import {Color} from '@/common/Color';
import {GameModel} from '@/common/models/GameModel';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ParticipantId, SpaceId} from '@/common/Types';
import {TileView} from '@/client/components/board/TileView';
import {requestPlacementZoom} from '@/client/components/board/placementZoom';
import GameBoardView from '@/client/components/GameBoardView.vue';
import GameOverNotice from '@/client/components/gameend/GameOverNotice.vue';
import Colony from '@/client/components/colonies/Colony.vue';
import Sidebar from '@/client/components/Sidebar.vue';
import MobileParameterBars from '@/client/components/mobile/MobileParameterBars.vue';

const props = defineProps<{
  game: GameModel;
  players: ReadonlyArray<PublicPlayerModel>;
  participantId: ParticipantId;
  tileView: TileView;
  acting: boolean;
  bannerTitle: string;
  // Own player's color; spectators have none
  viewerColor?: Color;
}>();

const emit = defineEmits<{
  (e: 'toggleTileView'): void;
  (e: 'showMilestones'): void;
}>();

const claimedMilestones = computed(() => props.game.milestones.filter((milestone) => milestone.playerName !== undefined).length);
const fundedAwards = computed(() => props.game.awards.filter((award) => award.playerName !== undefined).length);

// Highlight a space (log entry tapped): HomeMixin calls this via the caller's ref="gameBoardView"
const gameBoardView = ref<{highlightSpace: (spaceId: SpaceId) => void} | null>(null);
function highlightSpace(spaceId: SpaceId): void {
  gameBoardView.value?.highlightSpace(spaceId);
}
defineExpose({highlightSpace});
</script>
