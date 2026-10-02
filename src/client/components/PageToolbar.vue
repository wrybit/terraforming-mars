<template>
  <!-- Language and settings top right as frosted-glass buttons, as in the game (sidebar_toolbar.less);
       shared by all pages outside the game so the corner looks the same everywhere -->
  <div class="page-toolbar">
    <LanguageIcon/>
    <PreferencesIcon/>
  </div>
</template>

<script setup lang="ts">
import LanguageIcon from '@/client/components/LanguageIcon.vue';
import PreferencesIcon from '@/client/components/PreferencesIcon.vue';
</script>
