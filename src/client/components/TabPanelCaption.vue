<template>
  <!-- Question of the tab box as a small caption below the header row (tabPanelCaption.ts);
       not in the mobile view, which has no header row – the question stays at the top there -->
  <div v-if="active" class="or-tab-panel-caption">{{ $t(caption!.title.value!) }}</div>
</template>

<script setup lang="ts">
import {computed, inject, onBeforeUnmount, watch} from 'vue';
import {TAB_PANEL_CAPTION} from '@/client/components/tabPanelCaption';
import {mobileLayout} from '@/client/utils/mobileLayout';

const caption = inject(TAB_PANEL_CAPTION, undefined);
const active = computed(() => caption !== undefined && caption.title.value !== undefined && !mobileLayout.value);

// Register while shown, so the box drops its own question exactly then
let registered = false;
function register(shown: boolean): void {
  if (caption === undefined || shown === registered) {
    return;
  }
  caption.consumers.value += shown ? 1 : -1;
  registered = shown;
}

watch(active, register, {immediate: true});
onBeforeUnmount(() => register(false));
</script>
