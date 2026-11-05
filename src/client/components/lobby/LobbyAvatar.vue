<template>
  <!-- Profile picture of a lobby player: own image or emoji on the player color; AI seats show the robot, free seats a dashed ring -->
  <span class="lobby-avatar" :class="['lobby-avatar--' + size, 'lobby-avatar--' + kind, color ? 'lobby-avatar--' + color : '']" :title="title">
    <img v-if="kind === 'human' && image" :src="image" alt="">
    <span v-else-if="kind === 'human'" class="lobby-avatar-emoji" aria-hidden="true">{{ emoji }}</span>
    <!-- Entered by the host: no picture, the initial on the player color -->
    <span v-else-if="kind === 'guest'" class="lobby-avatar-initial" aria-hidden="true">{{ (title ?? '?').charAt(0).toUpperCase() }}</span>
    <SeatIcon v-else-if="kind === 'ai'" kind="ai" :size="iconSize" />
  </span>
</template>

<script setup lang="ts">
import {computed} from 'vue';
import {Color} from '@/common/Color';
import SeatIcon from '@/client/components/create/SeatIcon.vue';

const props = withDefaults(defineProps<{
  kind: 'human' | 'guest' | 'ai' | 'free';
  color?: Color;
  emoji?: string;
  image?: string;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'huge';
}>(), {
  color: undefined,
  emoji: undefined,
  image: undefined,
  title: undefined,
  size: 'medium',
});

const iconSize = computed(() => ({small: 12, medium: 16, large: 28, huge: 44})[props.size]);
</script>
