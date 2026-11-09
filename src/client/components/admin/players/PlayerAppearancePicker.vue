<template>
  <!-- Avatar of a name in the player list; a click opens colour cubes and emojis (same choice as the lobby profile).
       The panel hangs at the body: the list card would clip it. Clicks stay here, the row would select the name. -->
  <span class="admin-players-look" @click.stop @mousedown.stop>
    <button ref="anchor" type="button" class="admin-players-look-button" :title="$t('Change picture')" :aria-expanded="open" draggable="false" @click="toggle">
      <LobbyAvatar :kind="player.emoji !== undefined ? 'human' : 'guest'" :color="player.color" :emoji="player.emoji" :title="player.name" size="medium" />
    </button>
    <Teleport to="body">
      <div v-if="open" ref="panel" class="lobby-emoji-picker-popover admin-players-look-panel" :style="position" @keydown.esc.stop="close">
        <span class="create-game-subhead" v-i18n>Color</span>
        <div class="create-game-swatches">
          <button v-for="color in PLAYER_COLORS" :key="color" type="button"
            :class="['create-game-swatch', {'create-game-swatch--selected': player.color === color}]" :title="$t(color)"
            :aria-pressed="player.color === color" @click="emit('change', {color, emoji: player.emoji})">
            <PlayerCube :color="color" :view="player.color === color ? 'slight' : 'top'" :size="player.color === color ? 17 : 16" />
          </button>
        </div>
        <span class="create-game-subhead" v-i18n>Picture</span>
        <LobbyEmojiGrid :color="player.color" :selected="player.emoji" @pick="emit('change', {color: player.color, emoji: $event})" />
        <div class="admin-players-look-actions">
          <button type="button" class="btn btn-sm btn-tone-quiet" @click="reset" v-i18n>Reset</button>
        </div>
      </div>
    </Teleport>
  </span>
</template>

<script setup lang="ts">
import {ref} from 'vue';
import {Color, PLAYER_COLORS} from '@/common/Color';
import {PlayerNameStats} from './playerNameStats';
import LobbyAvatar from '@/client/components/lobby/LobbyAvatar.vue';
import LobbyEmojiGrid from '@/client/components/lobby/LobbyEmojiGrid.vue';
import PlayerCube from '@/client/components/common/PlayerCube.vue';
import {useFloatingPanel} from '@/client/components/common/floatingPanel';

defineProps<{
  player: PlayerNameStats,
}>();

const emit = defineEmits<{
  /** Both missing: back to the default look. */
  (event: 'change', look: {color?: Color, emoji?: string}): void;
}>();

// Same width as the emoji panel of the lobby (lobby.less)
const anchor = ref<HTMLElement>();
const panel = ref<HTMLElement>();
const {open, position, toggle, close} = useFloatingPanel(anchor, panel, {width: 320, align: 'left'});

function reset(): void {
  emit('change', {});
  close();
}
</script>
