<template>
  <nav class="mb-nav">
    <!-- Fußleiste der Mobil-Ansicht; Spieler und Zuschauer unterscheiden sich nur in den Einträgen (mobileScreens.ts) -->
    <button v-for="item in items" :key="item.screen" type="button"
      :class="['mb-nav-item', 'mb-nav-item--' + item.screen, {'mb-nav-item--active': active === item.screen}]"
      @click="emit('navigate', item.screen)">
      <!-- Der Zug-Eintrag zeigt statt des Symbols den runden Zug-Button des Aufrufers -->
      <slot v-if="item.screen === 'turn'" name="turn"></slot>
      <MobileGlyph v-else :name="item.icon" :filled="active === item.screen"/>
      <span v-if="item.screen === 'hand' && handCount > 0" class="mb-nav-badge">{{ handCount }}</span>
      <span class="mb-nav-label">{{ $t(item.label) }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {MobileNavItem, MobileScreen} from '@/client/components/mobile/mobileScreens';

withDefaults(defineProps<{
  items: ReadonlyArray<MobileNavItem>;
  active: MobileScreen;
  handCount?: number;
}>(), {
  handCount: 0,
});

const emit = defineEmits<{
  (e: 'navigate', screen: MobileScreen): void;
}>();
</script>
