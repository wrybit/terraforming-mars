<template>
  <button type="button" :class="['mb-tile', tile.tone !== undefined ? 'mb-tile--' + tile.tone : '', {'mb-tile--empty': tile.empty}]"
    :disabled="disabled" @click="$emit('select', tile.index)">
    <!-- Kachel im Zug-Menü wie im Mockup: Symbol, Kurzlabel, darunter was die Aktion bietet -->
    <span v-if="!compact" :class="['mb-tile-icon', 'mb-tile-icon--' + tile.glyphTone]"><MobileGlyph :name="tile.glyph"/></span>
    <span class="mb-tile-text">
      <span class="mb-tile-label">{{ $t(tile.label) }}</span>
      <span v-if="tile.detail !== undefined && !compact" class="mb-tile-sub">{{ $t(tile.detail) }}</span>
    </span>
    <!-- Zähler wie am Desktop-Tab (wählbare Karten, Projekte …) -->
    <span v-if="tile.count !== undefined && !compact" class="mb-tile-count">{{ tile.count }}</span>
  </button>
</template>

<script setup lang="ts">
import {TurnMenuTile} from '@/client/components/mobile/turnMenu';
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';

withDefaults(defineProps<{
  tile: TurnMenuTile;
  // Nur Beschriftung, ohne Unterzeile und Zähler (Zug-Ende)
  compact?: boolean;
  disabled?: boolean;
}>(), {
  compact: false,
  disabled: false,
});

defineEmits<{
  (event: 'select', index: number): void;
}>();
</script>
