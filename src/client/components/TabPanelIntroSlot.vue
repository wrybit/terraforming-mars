<template>
  <!-- Place for the tab box's intro below the header row (tabPanelIntro.ts); not in the mobile view, which has
       no header row – the intro stays at the top there -->
  <div v-if="active" :id="intro!.targetId" class="or-tab-panel-intro-slot"></div>
</template>

<script setup lang="ts">
import {computed, inject, onBeforeUnmount, watch} from 'vue';
import {TAB_PANEL_INTRO} from '@/client/components/tabPanelIntro';
import {mobileLayout} from '@/client/utils/mobileLayout';

const intro = inject(TAB_PANEL_INTRO, undefined);
const active = computed(() => intro !== undefined && !mobileLayout.value);

// Register while present, so the box moves its intro here exactly then
let registered = false;
function register(present: boolean): void {
  if (intro === undefined || present === registered) {
    return;
  }
  intro.consumers.value += present ? 1 : -1;
  registered = present;
}

watch(active, register, {immediate: true});
onBeforeUnmount(() => register(false));
</script>
