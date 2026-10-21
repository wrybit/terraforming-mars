<template>
  <!-- Playlist pane of the music card (MusicPlayerCard.vue): the tracks of the chosen group; a click plays the track
       and slides back to the player -->
  <div class="music-list">
    <div class="music-list__head">
      <button type="button" class="music-list__back" :aria-label="$t('Back to the player')" @click="$emit('back')">
        <MusicIcon name="chevron-left"/>
      </button>
      <strong class="music-list__title" v-i18n>Playlist</strong>
      <span class="music-list__count">{{ tracks.length }}</span>
    </div>
    <ul class="music-list__tracks">
      <!-- The current track sticks to the top or bottom edge while scrolled out of view -->
      <li v-for="track in tracks" :key="track.id" :class="{'music-list__item--current': track === current}">
        <button type="button" :class="['music-list__track', {'music-list__track--current': track === current}]"
          :aria-current="track === current ? 'true' : undefined" @click="choose(track)">
          <span class="music-list__mark"><MusicIcon v-if="track === current" :name="playing ? 'volume' : 'pause'"/></span>
          <span class="music-list__meta">
            <span class="music-list__name">{{ track.title }}</span>
            <span class="music-list__author">{{ track.author }}</span>
          </span>
          <span class="music-list__time">{{ length(track) }}</span>
        </button>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {MusicTrack} from '@/common/music/musicTracks';
import {MUSIC_WAVEFORMS} from '@/common/music/musicWaveforms';
import {gameMusic, musicPlaylist, playTrack} from '@/client/music/gameMusic';
import {formatTrackTime} from '@/client/music/trackTime';
import MusicIcon from '@/client/components/music/MusicIcon.vue';

export default defineComponent({
  name: 'MusicPlaylist',
  components: {MusicIcon},
  emits: ['back', 'chosen'],
  computed: {
    tracks(): Array<MusicTrack> {
      return musicPlaylist.value;
    },
    current(): MusicTrack | undefined {
      return gameMusic.current;
    },
    playing(): boolean {
      return gameMusic.playing;
    },
  },
  methods: {
    length(track: MusicTrack): string {
      return formatTrackTime(MUSIC_WAVEFORMS[track.id]?.duration ?? 0);
    },
    choose(track: MusicTrack): void {
      playTrack(track);
      this.$emit('chosen');
    },
  },
});
</script>
