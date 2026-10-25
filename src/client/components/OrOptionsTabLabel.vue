<template>
  <!-- Every form of a tab label at once; the steps of the bar (TabSteps.ts) choose which one shows, without new
       rendering while measuring. Without a shorter form a tab keeps its label. -->
  <span class="or-tab-title or-tab-label or-tab-label--full">{{ label }}</span>
  <span v-if="medium !== undefined" class="or-tab-title or-tab-label or-tab-label--medium">{{ $t(medium) }}</span>
  <span v-if="compact !== undefined" class="or-tab-title or-tab-label or-tab-label--compact">{{ $t(compact) }}</span>
  <MobileGlyph v-if="glyph !== undefined" :name="glyph" class="or-tab-glyph"/>
</template>

<script setup lang="ts">
import MobileGlyph from '@/client/components/mobile/MobileGlyph.vue';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';

defineProps<{
  // Short label, already translated
  label: string;
  // Translation keys of the shorter forms
  medium?: string;
  compact?: string;
  glyph?: GlyphName;
}>();
</script>
