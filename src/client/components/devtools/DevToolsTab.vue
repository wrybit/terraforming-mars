<template>
  <!-- DevTools tab in the action tabs (Jens, 20 Oct 2026): only after tmDev.on() with the admin login -->
  <button v-if="devToolsState.enabled" type="button" role="tab"
    :aria-selected="devToolsState.open"
    :class="['or-tab', 'or-tab--devtools', {'or-tab--active': devToolsState.open}]"
    @click="openDevTools">
    <span class="or-tab-title">{{ $t('DevTools') }}</span>
  </button>
</template>

<script setup lang="ts">
import {devToolsState, openDevTools} from '@/client/devtools/devToolsState';
</script>
