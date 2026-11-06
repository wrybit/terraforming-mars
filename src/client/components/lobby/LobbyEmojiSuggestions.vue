<template>
  <!-- Suggestions while typing :name: (useEmojiCompletion.ts), above the field; arrow keys choose, Enter or Tab inserts.
       mousedown.prevent: a click must not take the focus away from the text field -->
  <ul v-if="suggestions.length > 0" class="lobby-emoji-suggestions" role="listbox">
    <li v-for="(entry, index) in suggestions" :key="entry.emoji" class="lobby-emoji-suggestion"
      :class="{'lobby-emoji-suggestion--active': index === active}" role="option" :aria-selected="index === active"
      @mousedown.prevent="emit('choose', entry)">
      <span class="lobby-emoji-suggestion__emoji">{{ entry.emoji }}</span>
      <span class="lobby-emoji-suggestion__name">:{{ entry.name }}:</span>
    </li>
  </ul>
</template>

<script setup lang="ts">
import {ChatEmoji} from './lobbyChatEmoji';

defineProps<{
  suggestions: ReadonlyArray<ChatEmoji>;
  active: number;
}>();

const emit = defineEmits<{(event: 'choose', entry: ChatEmoji): void}>();
</script>
