<template>
  <!-- Cards tab (view only, gray): hand cards in the action menu (OrOptions) and in the hand cards block (PlayerHome),
       in the setup phase with a different label for the own initial selection (PlayerSetupView) -->
  <button type="button" role="tab"
    v-glass-tooltip="tabTooltip($t(label), 'tab-hand')"
    :aria-selected="active"
    data-hotkey="tab-hand"
    :class="['or-tab', 'or-tab--view', 'or-tab--hand', {'or-tab--active': active, 'or-tab--empty': count === 0}]"
    @click="$emit('select')">
    <OrOptionsTabLabel :label="$t(label)" :compact="compact" :glyph="glyph"/>
    <HotkeyKeys action="tab-hand"/>
    <span class="or-tab-count">{{ count }}</span>
  </button>
</template>

<script setup lang="ts">
import HotkeyKeys from '@/client/components/hotkeys/HotkeyKeys.vue';
import OrOptionsTabLabel from '@/client/components/OrOptionsTabLabel.vue';
import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import {tabTooltip} from '@/client/components/tabTooltip';
import {glassTooltip as vGlassTooltip} from '@/client/directives/GlassTooltip';
withDefaults(defineProps<{
  count: number;
  active: boolean;
  label?: string;
  // Shorter forms for a narrow action tab bar (TabSteps.ts); only the action menu passes them
  compact?: string;
  glyph?: GlyphName;
}>(), {
  label: 'All cards',
});

defineEmits<{
  (event: 'select'): void;
}>();
</script>
