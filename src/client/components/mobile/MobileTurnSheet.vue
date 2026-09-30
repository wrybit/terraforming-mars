<template>
  <div class="mb-sheet" role="dialog" aria-modal="true">
    <!-- Zug-Menü als Bottom-Sheet über dem aktuellen Bildschirm: erst die jetzt lohnenden Aktionen (farbig),
         dann alle übrigen im Raster, ganz unten dezent Zug-Ende (links zweite Aktion auslassen, rechts passen) -->
    <button type="button" class="mb-sheet-backdrop" :aria-label="$t('Close')" @click="$emit('close')"></button>
    <!-- Schublade: der Zug-Button sitzt auf der Oberkante und fährt beim Öffnen/Schließen mit (Übergang mb-sheet in mobile.less) -->
    <div class="mb-sheet-drawer">
      <button type="button" class="mb-sheet-turn" :aria-label="$t('Close')" @click="$emit('close')">
        <MobileTurnButton :acting="true" :action-number="actionNumber" :actions-per-turn="actionsPerTurn"/>
      </button>
      <div class="mb-sheet-panel">
        <div class="mb-sheet-head">
          <span class="mb-sheet-title">{{ title }}</span>
          <span class="mb-sheet-sub">{{ sub }}</span>
        </div>
        <div v-if="menu.available.length > 0" class="mb-sheet-group">
          <span class="mb-section-label">{{ $t('Available now') }}</span>
          <div class="mb-sheet-list">
            <MobileTurnTile v-for="tile in menu.available" :key="tile.index" :tile="tile" @select="$emit('select', $event)"/>
          </div>
        </div>
        <div v-if="menu.actions.length > 0" class="mb-sheet-group">
          <span class="mb-section-label">{{ $t('Actions') }}</span>
          <div class="mb-sheet-grid">
            <MobileTurnTile v-for="tile in menu.actions" :key="tile.index" :tile="tile" @select="$emit('select', $event)"/>
          </div>
        </div>
        <div v-if="menu.pass !== undefined || menu.skip !== undefined" class="mb-sheet-end">
          <!-- Auslassen gibt es erst nach der ersten Aktion; bis dahin sichtbar, aber gesperrt -->
          <MobileTurnTile :tile="menu.skip ?? menu.pass!" :label="$t('Skip 2nd action')" :compact="true" :disabled="menu.skip === undefined"
            class="mb-tile--skip" @select="$emit('select', $event)"/>
          <MobileTurnTile v-if="menu.pass !== undefined" :tile="menu.pass" :label="$t('Pass')" :compact="true"
            class="mb-tile--pass" @select="$emit('select', $event)"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {TurnMenu} from '@/client/components/mobile/turnMenu';
import MobileTurnTile from '@/client/components/mobile/MobileTurnTile.vue';
import MobileTurnButton from '@/client/components/mobile/MobileTurnButton.vue';

defineProps<{
  menu: TurnMenu;
  title: string;
  sub: string;
  actionNumber: number | undefined;
  actionsPerTurn: number;
}>();

defineEmits<{
  (event: 'close'): void;
  (event: 'select', index: number): void;
}>();
</script>
