<template>
  <DialogFrame :title="$t('Game info')" :width="760" class="info_panel" @close="emit('close')">
    <template #icon>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M12 11v6" stroke-linecap="round"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/></svg>
    </template>

    <section class="info-panel-section">
      <h3 class="info-panel-section-title" v-i18n>Game setup</h3>
      <GameSetupDetail :gameOptions="gameOptions" :playerNumber="playerNumber" :lastSoloGeneration="lastSoloGeneration"/>
    </section>

    <section class="info-panel-section">
      <h3 class="info-panel-section-title" v-i18n>Cards</h3>
      <!-- Nachziehstapel als Hauptwert groß, Ablagestapel klein dahinter -->
      <div class="setup-tiles setup-tiles--decks">
        <div v-for="deck in decks" :key="deck.label" class="setup-tile">
          <div class="setup-tile-label">{{ $t(deck.label) }}</div>
          <div class="info-panel-deck">
            <span class="info-panel-deck-draw" :title="$t('Draw pile')">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="7" y="3" width="12" height="16" rx="2"/><path d="M5 6.5v12a2 2 0 0 0 2 2h9"/></svg>
              {{ deck.sizes.drawPile }}
            </span>
            <span class="info-panel-deck-discard" :title="$t('Discard pile')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></svg>
              {{ deck.sizes.discardPile }}
            </span>
          </div>
        </div>
      </div>
    </section>

    <section v-if="spectatorUrl !== undefined" class="info-panel-section">
      <h3 class="info-panel-section-title" v-i18n>Spectator link</h3>
      <div class="info-panel-link">
        <div class="info-panel-link-field">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>
          <span>{{ spectatorUrl }}</span>
        </div>
        <button type="button" class="btn btn-tone-quiet info-panel-icon-button" :title="$t(copied ? 'Copied!' : 'Copy')" @click="copySpectatorLink">
          <svg v-if="!copied" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/></svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>
        </button>
        <a class="btn btn-tone-quiet info-panel-icon-button" :href="spectatorUrl" target="_blank" rel="noopener noreferrer" :title="$t('Open in new tab')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>
        </a>
      </div>
      <PurgeWarning v-if="expectedPurgeTimeMs !== undefined" :expectedPurgeTimeMs="expectedPurgeTimeMs"/>
    </section>

    <template #footer>
      <span class="info-panel-notice" v-i18n>Not affiliated with FryxGames, Asmodee Digital or Steam in any way.</span>
      <button type="button" class="btn btn-tone-quiet info-panel-options" @click="gameOptionsPopupOpen = true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"><path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/></svg>
        <span v-i18n>All options</span>
      </button>
      <button type="button" class="btn btn-primary" @click="emit('close')" v-i18n>Ok</button>
    </template>
    <GameOptionsPopup v-if="gameOptionsPopupOpen" :gameOptions="gameOptions" @close="gameOptionsPopupOpen = false" />
  </DialogFrame>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue';
import DialogFrame from '@/client/components/DialogFrame.vue';
import GameSetupDetail from '@/client/components/GameSetupDetail.vue';
import GameOptionsPopup from '@/client/components/GameOptionsPopup.vue';
import PurgeWarning from '@/client/components/common/PurgeWarning.vue';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {DeckSizeModel, OtherDeckSizesModel} from '@/common/models/GameModel';

const props = defineProps<{
  gameOptions: GameOptionsModel;
  playerNumber: number;
  lastSoloGeneration: number;
  deckSize: number;
  discardPileSize: number;
  otherDeckSizes: OtherDeckSizesModel;
  // Optional: nur in Spielansichten vorhanden
  spectatorId?: string;
  expectedPurgeTimeMs?: number;
}>();

const emit = defineEmits<{
  'close': [];
}>();

const gameOptionsPopupOpen = ref(false);
const copied = ref(false);

const decks = computed(() => {
  const sizes = props.otherDeckSizes;
  const all: Array<{label: string, sizes: DeckSizeModel | undefined}> = [
    {label: 'Projects', sizes: {drawPile: props.deckSize, discardPile: props.discardPileSize}},
    {label: 'Corporations', sizes: sizes.corporations},
    {label: 'Preludes', sizes: sizes.preludes},
    {label: 'CEOs', sizes: sizes.ceos},
    {label: 'Global Events', sizes: sizes.globalEvents},
  ];
  return all.filter((deck): deck is {label: string, sizes: DeckSizeModel} => deck.sizes !== undefined);
});

// Volle Adresse, damit man sie direkt weitergeben kann
const spectatorUrl = computed(() => {
  if (props.spectatorId === undefined) {
    return undefined;
  }
  return `${window.location.origin}/spectator?id=${props.spectatorId}`;
});

async function copySpectatorLink() {
  if (spectatorUrl.value === undefined) {
    return;
  }
  await navigator.clipboard?.writeText(spectatorUrl.value);
  copied.value = true;
  window.setTimeout(() => copied.value = false, 1500);
}

// When the game options popup is open it captures key presses, so Escape closes only the popup.
function keylistener(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}
onMounted(() => window.addEventListener('keydown', keylistener));
onUnmounted(() => window.removeEventListener('keydown', keylistener));
</script>
