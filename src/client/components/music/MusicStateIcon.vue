<template>
  <!-- Icon of the setup button (GameMenu.vue): the burger, or the state of the background music in its place,
       so it is clear that the music is steered from the setup menu (gameMusic.ts, musicIndicator) -->
  <span v-if="state === 'stopped'" class="game-menu-burger" aria-hidden="true"><i></i><i></i><i></i></span>
  <span v-else-if="state === 'playing'" class="music-state music-state--playing" aria-hidden="true"><i></i><i></i><i></i></span>
  <MusicIcon v-else class="music-state" :name="state === 'muted' ? 'muted' : 'pause'"/>
</template>

<script lang="ts">
import {defineComponent, PropType} from 'vue';
import {MusicIndicator} from '@/client/music/gameMusic';
import MusicIcon from '@/client/components/music/MusicIcon.vue';

export default defineComponent({
  name: 'MusicStateIcon',
  components: {MusicIcon},
  props: {
    state: {type: String as PropType<MusicIndicator>, required: true},
  },
});
</script>
