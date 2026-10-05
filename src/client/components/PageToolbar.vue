<template>
  <!-- Menu at the top left of the pages outside the game, as in the game (GameMenu.vue, game_menu.less):
       language, help and settings in one dropdown; shared so the corner looks the same everywhere -->
  <div class="page-toolbar">
    <GameMenu :label="label" :large="true"/>
  </div>
</template>

<script setup lang="ts">
import GameMenu from '@/client/components/gameMenu/GameMenu.vue';

withDefaults(defineProps<{
  // "Menu" by default; the start page calls it "Settings"
  label?: string;
}>(), {
  label: 'Menu',
});
</script>
