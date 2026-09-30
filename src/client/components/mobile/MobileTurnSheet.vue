<template>
  <div class="mb-sheet" role="dialog" aria-modal="true">
    <!-- Zug-Menü als Bottom-Sheet über dem aktuellen Bildschirm: erst die jetzt lohnenden Aktionen (farbig),
         dann alle übrigen im Raster, ganz unten dezent Zug-Ende (links zweite Aktion auslassen, rechts passen) -->
    <button type="button" class="mb-sheet-backdrop" :aria-label="$t('Close')" @click="$emit('close')"></button>
    <!-- Schublade: der Zug-Button sitzt auf der Oberkante und fährt beim Öffnen/Schließen mit (Übergang mb-sheet in mobile.less) -->
    <div class="mb-sheet-drawer">
      <button type="button" class="mb-sheet-turn" :aria-label="$t('Close')" @click="$emit('close')">
        <MobileTurnButton :acting="menu !== undefined" :action-number="actionNumber" :actions-per-turn="actionsPerTurn"/>
      </button>
      <div class="mb-sheet-panel">
        <!-- Aktion ohne Auswahl (Temperatur, Grünfläche, Zug-Ende): Rückfrage gleich in der Schublade statt einer fast leeren Vollbild-Aufgabe;
             Erklärung wie im Desktop-Tab (Bild, voller Titel, Spielstand vorher/nachher) -->
        <template v-if="confirming !== undefined && confirming.confirmation !== undefined">
          <TabIntroBlock v-if="confirming.confirmation.intro !== undefined && playerView !== undefined" class="mb-sheet-intro"
            :intro="confirming.confirmation.intro" :title="confirming.confirmation.title" :playerView="playerView"/>
          <div v-else class="mb-sheet-head">
            <span class="mb-sheet-title">{{ $t(confirming.label) }}</span>
          </div>
          <p v-if="confirming.confirmation.hint !== undefined" class="mb-sheet-hint">{{ $t(confirming.confirmation.hint) }}</p>
          <div class="mb-sheet-confirm">
            <button type="button" class="mb-taskbar-back" :aria-label="$t('Back')" @click="confirming = undefined">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <button type="button" :class="['btn', 'btn-rounded', 'mb-sheet-confirm-button', confirming.tone !== undefined ? 'btn-tone-' + confirming.tone : '']"
              @click="$emit('confirm', confirming.index)">{{ $t(confirming.confirmation.button) }}</button>
          </div>
        </template>
        <div v-else class="mb-sheet-head">
          <span class="mb-sheet-title">{{ title }}</span>
        </div>
        <!-- Nicht am Zug: nur wer gerade dran ist, statt eines leeren Aktionsmenüs -->
        <div v-if="menu === undefined" class="mb-sheet-group">
          <span class="mb-section-label">{{ $t('Waiting for other players') }}</span>
          <div class="mb-waiting-list">
            <span v-for="player in waitingPlayers" :key="player.color" :class="['mb-waiting-player', 'player_bg_color_' + player.color]">{{ player.name }}</span>
          </div>
        </div>
        <template v-else-if="confirming === undefined">
          <!-- Jetzt lohnende Aktionen ohne eigene Überschrift: die Farbe hebt sie hervor -->
          <div v-if="menu.available.length > 0" class="mb-sheet-list">
            <MobileTurnTile v-for="tile in menu.available" :key="tile.index" :tile="tile" @select="choose(tile)"/>
          </div>
          <div v-if="menu.actions.length > 0" class="mb-sheet-group">
            <span class="mb-section-label">{{ $t('Actions') }}</span>
            <div class="mb-sheet-grid">
              <MobileTurnTile v-for="tile in menu.actions" :key="tile.index" :tile="tile" @select="choose(tile)"/>
            </div>
          </div>
          <div v-if="menu.pass !== undefined || menu.skip !== undefined" class="mb-sheet-end">
            <!-- Weitergeben gibt es erst nach der ersten Aktion; bis dahin sichtbar, aber gesperrt (Beschriftungen wie am Desktop) -->
            <MobileTurnTile v-if="menu.skip !== undefined" :tile="menu.skip" :compact="true" class="mb-tile--skip" @select="choose(menu.skip)"/>
            <button v-else type="button" class="mb-tile mb-tile--skip" disabled><span class="mb-tile-label">{{ $t('Pass on') }}</span></button>
            <MobileTurnTile v-if="menu.pass !== undefined" :tile="menu.pass" :compact="true" class="mb-tile--pass" @select="choose(menu.pass)"/>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {TurnMenu, TurnMenuTile} from '@/client/components/mobile/turnMenu';
import MobileTurnTile from '@/client/components/mobile/MobileTurnTile.vue';
import MobileTurnButton from '@/client/components/mobile/MobileTurnButton.vue';
import TabIntroBlock from '@/client/components/TabIntroBlock.vue';
import {PlayerViewModel, PublicPlayerModel} from '@/common/models/PlayerModel';

withDefaults(defineProps<{
  // Aktionsmenü; fehlt es, ist man nicht am Zug und das Sheet zeigt nur, auf wen gewartet wird
  menu?: TurnMenu;
  waitingPlayers?: ReadonlyArray<PublicPlayerModel>;
  title: string;
  actionNumber: number | undefined;
  actionsPerTurn: number;
  // Spielstand für die Vorher/Nachher-Zeilen der Rückfrage (z. B. Temperatur steigt von … auf …)
  playerView?: PlayerViewModel;
}>(), {
  menu: undefined,
  playerView: undefined,
  waitingPlayers: () => [],
});

const emit = defineEmits<{
  (event: 'close'): void;
  (event: 'select', index: number): void;
  // Aktion nach der Rückfrage auslösen
  (event: 'confirm', index: number): void;
}>();

// Aktion, zu der gerade die Rückfrage offen ist
const confirming = ref<TurnMenuTile | undefined>(undefined);

// Aktionen ohne Auswahl fragen im Sheet nach, alle anderen öffnen ihre Aufgabe
function choose(tile: TurnMenuTile) {
  if (tile.confirmation !== undefined) {
    confirming.value = tile;
  } else {
    emit('select', tile.index);
  }
}
</script>
