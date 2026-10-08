<template>
  <!-- Menu at the top left of the pages outside the game, as in the game (GameMenu.vue, game_menu.less):
       language, help and settings in one dropdown; shared so the corner looks the same everywhere -->
  <div class="page-toolbar">
    <GameMenu :large="true" :navigation="navigation"/>
  </div>
</template>

<script setup lang="ts">
import GameMenu from '@/client/components/gameMenu/GameMenu.vue';

withDefaults(defineProps<{
  // Navigation box (new game, statistics, ...) in the menu; off on the start page, which shows these links itself
  navigation?: boolean;
}>(), {
  navigation: true,
});
</script>
