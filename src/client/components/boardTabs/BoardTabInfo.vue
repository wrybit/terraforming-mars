<template>
  <!-- Short info of a Dune module tab (boardTabs.ts boardTabInfo): picture, text and player counts in one line -->
  <span class="board-tab-info" :title="$t(info.title)">
    <img class="board-tab-info__icon" :src="info.icon" alt="">
    <span v-if="info.text !== undefined" class="board-tab-info__text">{{ info.text }}</span>
    <span v-for="count in info.counts ?? []" :key="count.color" :class="['board-tab-info__count', 'player_bg_color_' + count.color]">{{ count.value }}</span>
  </span>
</template>

<script setup lang="ts">
import {BoardTabInfo} from './boardTabs';

defineProps<{
  info: BoardTabInfo;
}>();
</script>
