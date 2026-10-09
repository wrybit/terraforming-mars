<template>
  <!-- Head as switch: arrow and title open/close the area; closed, a note says that something in it differs from the default -->
  <!-- Not collapsible (e.g. the "Official" group next to a collapsible "Fan-made"): same head and spacing, just no switch -->
  <div :class="['create-game-collapsible', 'create-game-collapsible--' + variant, {'create-game-collapsible--open': isOpen}]">
    <div :class="['create-game-collapsible-head', variant === 'card' ? 'create-game-card-head' : 'create-game-subhead']">
      <component :is="collapsible ? 'button' : 'div'" :type="collapsible ? 'button' : undefined" class="create-game-collapsible-toggle"
        :aria-expanded="collapsible ? isOpen : undefined" @click="collapsible && toggle()">
        <svg v-if="collapsible" class="create-game-collapsible-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        <h2 v-if="variant === 'card'" v-i18n>{{ title }}</h2>
        <span v-else v-i18n>{{ title }}</span>
      </component>
      <span v-if="!isOpen && changed !== undefined" class="create-game-changed">{{ changed }}</span>
      <slot name="actions"></slot>
    </div>
    <!-- v-show instead of v-if: the content keeps its state while closed -->
    <Transition :css="false" @enter="collapseEnter" @leave="collapseLeave">
      <div v-show="isOpen" class="create-game-collapsible-body"><slot></slot></div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue';
import {collapseEnter, collapseLeave} from '@/client/utils/collapseAnimation';

const props = withDefaults(defineProps<{
  title: string,
  // Remembers open/closed per area across visits
  storageKey: string,
  // Closed with changed settings: short note behind the title (already translated)
  changed?: string,
  // 'card': head of a whole card; 'subhead': a group inside a card
  variant?: 'card' | 'subhead',
  collapsible?: boolean,
}>(), {changed: undefined, variant: 'card', collapsible: true});

const STORAGE_PREFIX = 'create-game-open-';

// Only a convenience for this browser: without storage (private mode) every area simply starts closed
function loadOpen(): boolean {
  try {
    return localStorage.getItem(STORAGE_PREFIX + props.storageKey) === '1';
  } catch {
    return false;
  }
}

const open = ref(loadOpen());
const isOpen = computed(() => !props.collapsible || open.value);

function toggle() {
  open.value = !open.value;
  try {
    localStorage.setItem(STORAGE_PREFIX + props.storageKey, open.value ? '1' : '0');
  } catch {
    // Not saved: stays as it is for this visit
  }
}
</script>
