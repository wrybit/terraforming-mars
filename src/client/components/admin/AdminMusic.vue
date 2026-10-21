<template>
  <div id="admin-music" class="games-overview-container admin-home">
    <AdminGate active="music">
      <!-- Background music of the game (musicTracks.ts): listen, switch on and off; takes effect at once -->
      <section class="games-overview-card admin-music">
        <header class="raw-data-head">
          <h2 v-i18n>Background music</h2>
          <span class="admin-music__count">{{ enabledCount }} / {{ tracks.length }} <span v-i18n>active</span></span>
        </header>
        <p class="games-overview-note" v-i18n>Games start with the start track; its group is the default for the listeners. Click the waveform to jump.</p>
        <p v-if="error !== ''" class="games-overview-note games-overview-note--error">{{ error }}</p>

        <section v-for="group in groups" :key="group.name" class="admin-music__group">
          <header class="admin-music__group-head">
            <h3 v-i18n>{{ groupLabel(group.name) }}</h3>
            <span class="admin-music__count">{{ group.tracks.filter((track) => isEnabled(track.id)).length }} / {{ group.tracks.length }}</span>
          </header>
          <ul class="admin-music__list">
            <li v-for="track in group.tracks" :key="track.id" :class="['admin-music__track', {'admin-music__track--off': !isEnabled(track.id)}]">
              <button type="button" class="admin-music__play" :aria-label="playLabel(track)" @click="toggle(track)">
                <MusicIcon :name="isPlaying(track) ? 'pause' : 'play'"/>
              </button>
              <div class="admin-music__meta">
                <strong class="admin-music__title">{{ track.title }}</strong>
                <span class="admin-music__credit">
                  {{ track.author }} ·
                  <a :href="licenseUrl(track)" target="_blank" rel="noopener">{{ track.license }}</a> ·
                  <a :href="track.source" target="_blank" rel="noopener">{{ sourceName(track) }}</a> ·
                  <span class="admin-music__theme">{{ track.theme }}</span>
                </span>
              </div>
              <MusicWaveform class="admin-music__wave" :peaks="waveform(track).peaks" :duration="waveform(track).duration"
                :progress="progressOf(track)" :label="track.title" @seek="seek(track, $event)"/>
              <span class="admin-music__time">{{ timeOf(track) }}</span>
              <div class="admin-music__switch">
                <!-- Start track of new games; its group is the listeners' default group -->
                <button type="button" :class="['admin-music__start', {'admin-music__start--on': start === track.id}]"
                  :aria-pressed="start === track.id" @click="setStart(track.id)" v-i18n>Start track</button>
                <ToggleSwitch :modelValue="isEnabled(track.id)" :label="$t('Active')" @update:modelValue="setEnabled(track.id, $event)"/>
              </div>
            </li>
          </ul>
        </section>
      </section>
    </AdminGate>
  </div>
</template>

<script lang="ts">
import {defineComponent} from 'vue';
import {paths} from '@/common/app/paths';
import {MUSIC_GROUPS, MUSIC_LICENSE_URLS, MUSIC_TRACKS, MusicGroup, MusicTrack, musicFile} from '@/common/music/musicTracks';
import {MUSIC_WAVEFORMS, MusicWaveform as Waveform} from '@/common/music/musicWaveforms';
import {MusicState, MusicSwitch} from '@/common/music/musicState';
import AdminGate from '@/client/components/admin/AdminGate.vue';
import ToggleSwitch from '@/client/components/common/ToggleSwitch.vue';
import MusicWaveform from '@/client/components/music/MusicWaveform.vue';
import MusicIcon from '@/client/components/music/MusicIcon.vue';
import {formatTrackTime} from '@/client/music/trackTime';

const NO_WAVEFORM: Waveform = {duration: 0, peaks: []};

export default defineComponent({
  name: 'AdminMusic',
  components: {AdminGate, ToggleSwitch, MusicWaveform, MusicIcon},
  data() {
    return {
      tracks: MUSIC_TRACKS,
      enabled: [] as Array<string>,
      start: '',
      error: '',
      // Preview of this page only: one track at a time, separate from the music in a game
      audio: undefined as HTMLAudioElement | undefined,
      currentId: undefined as string | undefined,
      playing: false,
      position: 0,
    };
  },
  computed: {
    enabledCount(): number {
      return this.enabled.length;
    },
    groups(): Array<{name: MusicGroup, tracks: Array<MusicTrack>}> {
      return MUSIC_GROUPS.map((name) => ({name, tracks: MUSIC_TRACKS.filter((track) => track.group === name)}));
    },
  },
  async mounted() {
    try {
      const response = await fetch(paths.API_MUSIC, {cache: 'no-store'});
      this.apply((await response.json()) as MusicState);
    } catch {
      this.error = this.$t('Cannot load the music settings.');
    }
  },
  beforeUnmount() {
    this.audio?.pause();
  },
  methods: {
    groupLabel(group: MusicGroup): string {
      return group === '8-bit' ? '8-bit' : 'Modern';
    },
    waveform(track: MusicTrack): Waveform {
      return MUSIC_WAVEFORMS[track.id] ?? NO_WAVEFORM;
    },
    // Host of the source page as its name, e.g. "opengameart.org", "incompetech.com"
    sourceName(track: MusicTrack): string {
      return new URL(track.source).hostname.replace(/^www\./, '');
    },
    licenseUrl(track: MusicTrack): string {
      return MUSIC_LICENSE_URLS[track.license];
    },
    isEnabled(id: string): boolean {
      return this.enabled.includes(id);
    },
    isPlaying(track: MusicTrack): boolean {
      return this.currentId === track.id && this.playing;
    },
    playLabel(track: MusicTrack): string {
      return `${this.$t(this.isPlaying(track) ? 'Pause' : 'Play')}: ${track.title}`;
    },
    progressOf(track: MusicTrack): number {
      const duration = this.waveform(track).duration;
      return this.currentId === track.id && duration > 0 ? Math.min(1, this.position / duration) : 0;
    },
    timeOf(track: MusicTrack): string {
      const duration = this.waveform(track).duration;
      return this.currentId === track.id ? `${formatTrackTime(this.position)} / ${formatTrackTime(duration)}` : formatTrackTime(duration);
    },
    player(): HTMLAudioElement {
      if (this.audio === undefined) {
        const audio = new Audio();
        audio.addEventListener('timeupdate', () => this.position = audio.currentTime);
        audio.addEventListener('play', () => this.playing = true);
        audio.addEventListener('pause', () => this.playing = false);
        audio.addEventListener('ended', () => this.position = 0);
        this.audio = audio;
      }
      return this.audio;
    },
    select(track: MusicTrack): HTMLAudioElement {
      const audio = this.player();
      if (this.currentId !== track.id) {
        this.currentId = track.id;
        this.position = 0;
        audio.src = musicFile(track.id);
      }
      return audio;
    },
    toggle(track: MusicTrack): void {
      if (this.isPlaying(track)) {
        this.player().pause();
        return;
      }
      this.select(track).play().catch(() => {});
    },
    // A click on another track's waveform starts that track right there
    seek(track: MusicTrack, share: number): void {
      const audio = this.select(track);
      audio.currentTime = share * this.waveform(track).duration;
      this.position = audio.currentTime;
      audio.play().catch(() => {});
    },
    apply(state: MusicState): void {
      this.enabled = state.enabled;
      this.start = state.start;
    },
    setEnabled(id: string, enabled: boolean): Promise<void> {
      return this.save({id, enabled});
    },
    setStart(id: string): Promise<void> {
      return this.save({start: id});
    },
    async save(update: MusicSwitch): Promise<void> {
      this.error = '';
      try {
        const response = await fetch(paths.API_ADMIN_MUSIC, {method: 'POST', body: JSON.stringify(update)});
        if (!response.ok) {
          throw new Error(await response.text());
        }
        this.apply((await response.json()) as MusicState);
      } catch (error) {
        this.error = this.$t('Cannot save the music settings.') + (error instanceof Error && error.message !== '' ? ' ' + error.message : '');
      }
    },
  },
});
</script>
