<template>
  <!-- Short info of a Dune module tab (boardTabs.ts boardTabInfo): picture, owner, text and player counts or agenda levels in one line -->
  <span class="board-tab-info" :title="$t(info.title)">
    <img class="board-tab-info__icon" :src="info.icon" alt="">
    <span v-if="info.owner !== undefined" :class="['board-tab-info__owner', 'player_bg_color_' + info.owner]"></span>
    <span v-if="info.text !== undefined" class="board-tab-info__text">{{ info.text }}</span>
    <span v-if="info.label !== undefined" class="board-tab-info__label">{{ $t(info.label) }}</span>
    <!-- Own agendas: the points of the level reached, in its colour; a dash while none is reached -->
    <span v-for="(level, index) in info.levels ?? []" :key="'level-' + index" :class="['board-tab-info__level', 'board-tab-info__level--' + level]">
      {{ level === 0 ? '–' : POINTS[level - 1] }}
    </span>
    <span v-for="count in info.counts ?? []" :key="count.color" :class="['board-tab-info__count', 'player_bg_color_' + count.color]">{{ count.value }}</span>
  </span>
</template>

<script setup lang="ts">
import {BoardTabInfo} from './boardTabs';
import {SCHEME_LEVEL_POINTS} from '@/common/dune/schemeAgendas';

const POINTS = SCHEME_LEVEL_POINTS;

defineProps<{
  info: BoardTabInfo;
}>();
</script>
