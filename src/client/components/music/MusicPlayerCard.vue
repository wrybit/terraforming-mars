<template>
  <!-- Background music of the game (gameMusic.ts) as its own card under the setup menu (GameMenu.vue):
       current track with credit, group choice, play/pause, next track, waveform to jump, volume and mute;
       the arrow at the top slides in the playlist (MusicPlaylist.vue) -->
  <section class="game-menu-panel music-card" :aria-label="$t('Music')">
    <!-- Two panes side by side: player and playlist; the playlist slides in, the card takes the height of the shown pane -->
    <div class="music-card__viewport" :style="{height: height === undefined ? undefined : height + 'px'}">
    <div :class="['music-card__panes', {'music-card__panes--list': showList}]">
    <div ref="player" class="music-card__pane" :inert="showList">
    <div class="music-card__head">
      <span class="music-card__note"><MusicIcon name="note"/></span>
      <div class="music-card__meta">
        <strong class="music-card__title">{{ track?.title ?? $t('Music') }}</strong>
        <span v-if="track !== undefined" class="music-card__credit">
          {{ track.author }} · <a :href="licenseUrl" target="_blank" rel="noopener">{{ track.license }}</a>
        </span>
      </div>
      <button type="button" class="music-card__open" :aria-label="$t('Show playlist')" @click="openList">
        <MusicIcon name="chevron-right"/>
      </button>
    </div>

    <!-- Group choice and the two buttons in one row; volume with mute over the full width at the bottom -->
    <div class="music-card__row">
      <!-- Which tracks to hear: all, or one group (remembered per browser) -->
      <div class="music-card__groups" role="radiogroup" :aria-label="$t('Tracks')">
        <button v-for="choice in choices" :key="choice" type="button" role="radio" :aria-checked="music.choice === choice"
          :class="['music-card__group', {'music-card__group--on': music.choice === choice}]" @click="choose(choice)">{{ $t(choiceLabel(choice)) }}</button>
      </div>
      <div class="music-card__buttons">
        <button type="button" class="music-card__button" :aria-label="$t(music.playing ? 'Stop music' : 'Play music')" @click="toggle">
          <MusicIcon :name="music.playing ? 'pause' : 'play'"/>
        </button>
        <button type="button" class="music-card__button" :aria-label="$t('Next track')" :disabled="playlist.length < 2" @click="next">
          <MusicIcon name="next"/>
        </button>
      </div>
    </div>

    <MusicWaveform v-if="waveform !== undefined" class="music-card__wave" :peaks="waveform.peaks" :duration="waveform.duration"
      :progress="progress" :label="track?.title ?? ''" @seek="seek"/>

    <div class="music-card__volume">
      <button type="button" class="music-card__mute" :aria-pressed="music.muted" :aria-label="$t(music.muted ? 'Unmute' : 'Mute')" @click="toggleMute">
        <MusicIcon :name="music.muted ? 'muted' : 'volume'"/>
      </button>
      <input type="range" min="0" max="1" step="0.05" :value="music.volume" :aria-label="$t('Volume')" :disabled="music.muted"
        :style="{'--music-volume': Math.round(music.volume * 100) + '%'}" @input="setVolume">
    </div>
    </div>

    <div ref="list" class="music-card__pane" :inert="!showList">
      <MusicPlaylist @back="closeList" @chosen="closeList"/>
    </div>
    </div>
    </div>
  </section>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {MUSIC_LICENSE_URLS, MusicTrack} from '@/common/music/musicTracks';
import {MUSIC_WAVEFORMS, MusicWaveform as Waveform} from '@/common/music/musicWaveforms';
import {MUSIC_CHOICES, MusicChoice, chooseMusicGroup, gameMusic, musicPlaylist, next, playMusic, seekMusic, setMusicMuted, setMusicVolume, stopMusic} from '@/client/music/gameMusic';

const CHOICE_LABELS: Readonly<Record<MusicChoice, string>> = {'all': 'All tracks', '8-bit': '8-bit', 'modern': 'Modern'};
import MusicWaveform from '@/client/components/music/MusicWaveform.vue';
import MusicIcon from '@/client/components/music/MusicIcon.vue';
import MusicPlaylist from '@/client/components/music/MusicPlaylist.vue';

export default defineComponent({
  name: 'MusicPlayerCard',
  components: {MusicWaveform, MusicIcon, MusicPlaylist},
  data() {
    return {
      music: gameMusic,
      choices: MUSIC_CHOICES,
      showList: false,
      // Height of the shown pane: animated by CSS when the panes swap or a pane changes its height
      height: undefined as number | undefined,
      resizeObserver: undefined as ResizeObserver | undefined,
    };
  },
  mounted() {
    this.resizeObserver = new ResizeObserver(() => this.measure());
    this.resizeObserver.observe(this.$refs.player as HTMLElement);
    this.resizeObserver.observe(this.$refs.list as HTMLElement);
    this.measure();
  },
  beforeUnmount() {
    this.resizeObserver?.disconnect();
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
    measure(): void {
      const pane = (this.showList ? this.$refs.list : this.$refs.player) as HTMLElement | undefined;
      this.height = pane?.offsetHeight;
    },
    openList(): void {
      this.showList = true;
      this.$nextTick(() => {
        this.measure();
        // The current track in the middle of the list, without moving the page
        const list = (this.$refs.list as HTMLElement).querySelector<HTMLElement>('.music-list__tracks');
        const current = list?.querySelector<HTMLElement>('.music-list__item--current');
        if (list !== null && list !== undefined && current !== null && current !== undefined) {
          list.scrollTop = current.offsetTop - (list.clientHeight - current.offsetHeight) / 2;
        }
      });
    },
    closeList(): void {
      this.showList = false;
      this.$nextTick(() => this.measure());
    },
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
    toggleMute(): void {
      setMusicMuted(!this.music.muted);
    },
    setVolume(event: Event): void {
      setMusicVolume(Number((event.target as HTMLInputElement).value));
    },
  },
});
</script>
