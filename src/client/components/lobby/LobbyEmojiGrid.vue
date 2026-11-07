<template>
  <!-- The lobby's profile pictures to choose from (profile dialog, own seat of "Create game"); the slot comes first (upload) -->
  <div class="lobby-emoji-grid">
    <slot></slot>
    <button v-for="emoji in LOBBY_EMOJIS" :key="emoji" type="button" class="lobby-emoji"
      :class="['lobby-emoji--' + color, {'lobby-emoji--selected': selected === emoji}]"
      :aria-pressed="selected === emoji" @click="emit('pick', emoji)">{{ emoji }}</button>
  </div>
</template>

<script setup lang="ts">
import {Color} from '@/common/Color';
import {LOBBY_EMOJIS} from '@/common/lobby/LobbyModel';

defineProps<{
  color: Color;
  /** Emoji shown as chosen; undefined when an own picture is chosen */
  selected: string | undefined;
}>();

const emit = defineEmits<{
  (event: 'pick', emoji: string): void;
}>();
</script>
