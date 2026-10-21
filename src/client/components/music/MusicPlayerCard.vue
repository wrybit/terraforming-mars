<template>
  <!-- Background music of the game (gameMusic.ts) as its own card under the setup menu (GameMenu.vue):
       current track with credit, waveform to jump, play/stop, next track, volume -->
  <section class="game-menu-panel music-card" :aria-label="$t('Music')">
    <div class="music-card__head">
      <span class="music-card__note"><MusicIcon name="note"/></span>
      <div class="music-card__meta">
        <strong class="music-card__title">{{ track?.title ?? $t('Music') }}</strong>
        <span v-if="track !== undefined" class="music-card__credit">
          {{ track.author }} · <a :href="licenseUrl" target="_blank" rel="noopener">{{ track.license }}</a>
        </span>
      </div>
    </div>

    <!-- Which tracks to hear: all, or one group (remembered per browser) -->
    <div class="music-card__groups" role="radiogroup" :aria-label="$t('Tracks')">
      <button v-for="choice in choices" :key="choice" type="button" role="radio" :aria-checked="music.choice === choice"
        :class="['music-card__group', {'music-card__group--on': music.choice === choice}]" @click="choose(choice)">{{ $t(choiceLabel(choice)) }}</button>
    </div>

    <MusicWaveform v-if="waveform !== undefined" class="music-card__wave" :peaks="waveform.peaks" :duration="waveform.duration"
      :progress="progress" :label="track?.title ?? ''" @seek="seek"/>

    <div class="music-card__controls">
      <button type="button" class="music-card__button" :aria-label="$t(music.playing ? 'Stop music' : 'Play music')" @click="toggle">
        <MusicIcon :name="music.playing ? 'stop' : 'play'"/>
      </button>
      <button type="button" class="music-card__button" :aria-label="$t('Next track')" :disabled="playlist.length < 2" @click="next">
        <MusicIcon name="next"/>
      </button>
      <label class="music-card__volume">
        <MusicIcon name="volume"/>
        <input type="range" min="0" max="1" step="0.05" :value="music.volume" :aria-label="$t('Volume')"
          :style="{'--music-volume': Math.round(music.volume * 100) + '%'}" @input="setVolume">
      </label>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {MUSIC_LICENSE_URLS, MusicTrack} from '@/common/music/musicTracks';
import {MUSIC_WAVEFORMS, MusicWaveform as Waveform} from '@/common/music/musicWaveforms';
import {MUSIC_CHOICES, MusicChoice, chooseMusicGroup, gameMusic, musicPlaylist, next, playMusic, seekMusic, setMusicVolume, stopMusic} from '@/client/music/gameMusic';

const CHOICE_LABELS: Readonly<Record<MusicChoice, string>> = {'all': 'All tracks', '8-bit': '8-bit', 'modern': 'Modern'};
import MusicWaveform from '@/client/components/music/MusicWaveform.vue';
import MusicIcon from '@/client/components/music/MusicIcon.vue';

export default defineComponent({
  name: 'MusicPlayerCard',
  components: {MusicWaveform, MusicIcon},
  data() {
    return {music: gameMusic, choices: MUSIC_CHOICES};
  },
  computed: {
    playlist(): Array<MusicTrack> {
      return musicPlaylist.value;
    },
    track(): MusicTrack | undefined {
      return this.music.current;
    },
    waveform(): Waveform | undefined {
      return this.track === undefined ? undefined : MUSIC_WAVEFORMS[this.track.id];
    },
    licenseUrl(): string {
      return this.track === undefined ? '' : MUSIC_LICENSE_URLS[this.track.license];
    },
    progress(): number {
      const duration = this.music.duration || this.waveform?.duration || 0;
      return duration > 0 ? Math.min(1, this.music.position / duration) : 0;
    },
  },
  methods: {
    choiceLabel(choice: MusicChoice): string {
      return CHOICE_LABELS[choice];
    },
    choose(choice: MusicChoice): void {
      chooseMusicGroup(choice);
    },
    toggle(): void {
      if (this.music.playing) {
        stopMusic();
      } else {
        playMusic();
      }
    },
    next(): void {
      next();
    },
    seek(share: number): void {
      seekMusic(share);
    },
    setVolume(event: Event): void {
      setMusicVolume(Number((event.target as HTMLInputElement).value));
    },
  },
});
</script>
