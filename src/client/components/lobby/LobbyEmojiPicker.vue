<template>
  <!-- Own seat of "Create game" in the lobby: the profile picture in front of the name; a click opens the choice below it.
       The panel hangs at the body: the player card clips everything that sticks out of it -->
  <span class="lobby-emoji-picker">
    <button ref="button" type="button" class="lobby-emoji-picker-button" :title="$t('Change picture')" :aria-expanded="open" @click="toggle">
      <LobbyAvatar kind="human" :color="color" :emoji="emoji" :image="image" size="small" />
    </button>
    <Teleport to="body">
      <div v-if="open" ref="panel" class="lobby-emoji-picker-popover" :style="position" @keydown.esc.stop="close">
        <LobbyEmojiGrid :color="color" :selected="image === undefined ? emoji : undefined" @pick="pick" />
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {Color} from '@/common/Color';
import LobbyAvatar from './LobbyAvatar.vue';
import LobbyEmojiGrid from './LobbyEmojiGrid.vue';

defineProps<{
  color: Color;
  emoji: string;
  /** Own picture of the profile; picking an emoji replaces it */
  image?: string;
}>();

const emit = defineEmits<{
  (event: 'pick', emoji: string): void;
}>();

// Same width as in lobby.less; keeps the panel inside the window on phones
const PANEL_WIDTH = 320;
const EDGE = 12;

const open = ref(false);
const button = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const position = ref<Record<string, string>>({});

function toggle(): void {
  if (open.value) {
    close();
    return;
  }
  const rect = button.value?.getBoundingClientRect();
  if (rect === undefined) {
    return;
  }
  const width = Math.min(PANEL_WIDTH, window.innerWidth - 2 * EDGE);
  const left = Math.max(EDGE, Math.min(rect.left, window.innerWidth - width - EDGE));
  position.value = {top: `${rect.bottom + 8}px`, left: `${left}px`, width: `${width}px`};
  open.value = true;
  // Click elsewhere or scrolling (the panel would stay behind) closes it
  document.addEventListener('pointerdown', onPointerDown, true);
  window.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);
}

function close(): void {
  open.value = false;
  document.removeEventListener('pointerdown', onPointerDown, true);
  window.removeEventListener('scroll', close, true);
  window.removeEventListener('resize', close);
}

function onPointerDown(event: PointerEvent): void {
  const target = event.target as Node;
  if (!panel.value?.contains(target) && !button.value?.contains(target)) {
    close();
  }
}

function pick(emoji: string): void {
  emit('pick', emoji);
  close();
}

onBeforeUnmount(close);
</script>
