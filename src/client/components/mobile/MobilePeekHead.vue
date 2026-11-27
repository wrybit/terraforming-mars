<template>
  <div class="mb-peek-head">
    <!-- Head of the quick-peek sheet: switch between the peeked screens, close back to the task -->
    <div class="mb-peek-segments" role="tablist">
      <button v-for="item in items" :key="item.screen" type="button" role="tab"
        :aria-selected="active === item.screen"
        :class="['mb-peek-segment', 'mb-peek-segment--' + item.screen, {'mb-peek-segment--active': active === item.screen}]"
        @click="emit('select', item.screen)">
        <MobileGlyph :name="item.icon" :filled="active === item.screen" />
        <span>{{ $t(item.label) }}</span>
      </button>
    </div>
    <button type="button" class="mb-peek-close" :aria-label="$t('Close')" @click="emit('close')">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {MobileNavItem, MobileScreen} from '@/client/components/mobile/mobileScreens';

defineProps<{
  items: ReadonlyArray<MobileNavItem>;
  active: MobileScreen;
}>();

const emit = defineEmits<{
  (e: 'select', screen: MobileScreen): void;
  (e: 'close'): void;
}>();
</script>
