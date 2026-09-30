<template>
  <button type="button" :class="['mb-tile', tile.tone !== undefined ? 'mb-tile--' + tile.tone : '', {'mb-tile--empty': tile.empty}]"
    :disabled="disabled" @click="$emit('select', tile.index)">
    <!-- Kachel im Zug-Menü wie im Mockup: Symbol, Kurzlabel, darunter was die Aktion bietet -->
    <span v-if="!compact" :class="['mb-tile-icon', 'mb-tile-icon--' + tile.glyphTone]"><MobileGlyph :name="tile.glyph"/></span>
    <span class="mb-tile-text">
      <span class="mb-tile-label">{{ label ?? $t(tile.label) }}</span>
      <span v-if="tile.sub !== undefined && !compact" class="mb-tile-sub">{{ subText }}</span>
    </span>
  </button>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {TurnMenuTile} from '@/client/components/mobile/turnMenu';
import {translateTextWithParams} from '@/client/directives/i18n';
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';

const props = withDefaults(defineProps<{
  tile: TurnMenuTile;
  // Eigene Beschriftung (Zug-Ende: "Skip 2nd action" / "Pass" statt der Desktop-Kurzlabels)
  label?: string;
  // Nur Beschriftung, ohne Unterzeile (Zug-Ende)
  compact?: boolean;
  disabled?: boolean;
}>(), {
  label: undefined,
  compact: false,
  disabled: false,
});

defineEmits<{
  (event: 'select', index: number): void;
}>();

const subText = computed(() => props.tile.sub === undefined ? '' : translateTextWithParams(props.tile.sub.text, props.tile.sub.params));
</script>
