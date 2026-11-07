<template>
  <!-- Own seat of "Create game" in the lobby: the profile picture in front of the name; a click opens the choice below it.
       The panel hangs at the body: the player card clips everything that sticks out of it -->
  <span class="lobby-emoji-picker">
    <button ref="anchor" type="button" class="lobby-emoji-picker-button" :title="$t('Change picture')" :aria-expanded="open" @click="toggle">
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
import {ref} from 'vue';
import {Color} from '@/common/Color';
import LobbyAvatar from './LobbyAvatar.vue';
import LobbyEmojiGrid from './LobbyEmojiGrid.vue';
import {useFloatingPanel} from '@/client/components/common/floatingPanel';

defineProps<{
  color: Color;
  emoji: string;
  /** Own picture of the profile; picking an emoji replaces it */
  image?: string;
}>();

const emit = defineEmits<{
  (event: 'pick', emoji: string): void;
}>();

// Same width as in lobby.less
const anchor = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const {open, position, toggle, close} = useFloatingPanel(anchor, panel, {width: 320, align: 'left'});

function pick(emoji: string): void {
  emit('pick', emoji);
  close();
}
</script>
