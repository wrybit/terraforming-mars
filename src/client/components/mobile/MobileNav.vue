<template>
  <nav class="mb-nav">
    <!-- Footer bar of the mobile view; player and spectator differ only in the entries (mobileScreens.ts) -->
    <button v-for="item in items" :key="item.screen" type="button"
      :class="['mb-nav-item', 'mb-nav-item--' + item.screen, {'mb-nav-item--active': active === item.screen}]"
      v-flash-tab="{id: 'mobile-nav-' + item.screen, areas: item.flashAreas, active: active === item.screen}"
      @click="emit('navigate', item.screen)">
      <!-- The turn entry shows the caller's round turn button instead of the icon -->
      <slot v-if="item.screen === 'turn'" name="turn"></slot>
      <MobileGlyph v-else :name="item.icon" :filled="active === item.screen"/>
      <span v-if="item.screen === 'hand' && handCount > 0" class="mb-nav-badge">{{ handCount }}</span>
      <span class="mb-nav-label">{{ $t(item.label) }}</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {vFlashTab} from '@/client/directives/ChangeFlashTab';
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
