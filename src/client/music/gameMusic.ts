import {computed, reactive} from 'vue';
import {paths} from '@/common/app/paths';
import {Theme} from '@/common/theme/Theme';
import {MUSIC_TRACKS, MusicTrack, musicFile} from '@/common/music/musicTracks';
import {MusicState} from '@/common/music/musicState';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

// Background music of the game (one player for the whole app): starts when a game of a theme with tracks is
// entered (App.vue), is steered from the card under the setup menu (MusicPlayerCard.vue). Browsers only play
// sound after the first interaction: until then the start waits for the first click or key.
// Remembered per browser: the volume, and whether the player stopped the music (then it stays off).

const VOLUME_KEY = 'tm-music-volume';
const STOPPED_KEY = 'tm-music-stopped';
const DEFAULT_VOLUME = 0.35;

export const gameMusic = reactive({
  /** Tracks of the current game's theme that the admin left on; empty outside a game */
  playlist: [] as Array<MusicTrack>,
  current: undefined as MusicTrack | undefined,
  playing: false,
  /** Seconds played and length of the current track (for the waveform) */
  position: 0,
  duration: 0,
  volume: readVolume(),
});

export const musicAvailable = computed(() => gameMusic.playlist.length > 0);

let audio: HTMLAudioElement | undefined;
let enabledIds: Promise<Array<string>> | undefined;
let waitingForGesture = false;

function readVolume(): number {
  const stored = Number(safeLocalStorage.getItem(VOLUME_KEY));
  return safeLocalStorage.getItem(VOLUME_KEY) !== null && Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : DEFAULT_VOLUME;
}

function element(): HTMLAudioElement {
  if (audio === undefined) {
    audio = new Audio();
    audio.preload = 'auto';
    audio.volume = gameMusic.volume;
    audio.addEventListener('timeupdate', () => {
      gameMusic.position = audio?.currentTime ?? 0;
    });
    audio.addEventListener('loadedmetadata', () => {
      gameMusic.duration = Number.isFinite(audio?.duration) ? (audio?.duration ?? 0) : 0;
    });
    audio.addEventListener('ended', () => next(true));
    audio.addEventListener('play', () => gameMusic.playing = true);
    audio.addEventListener('pause', () => gameMusic.playing = false);
  }
  return audio;
}

function loadEnabled(): Promise<Array<string>> {
  enabledIds ??= fetch(paths.API_MUSIC)
    .then((response) => response.ok ? response.json() as Promise<MusicState> : {enabled: []})
    .then((state) => state.enabled)
    .catch(() => []);
  return enabledIds;
}

function randomTrack(exclude?: MusicTrack): MusicTrack | undefined {
  const choices = gameMusic.playlist.filter((track) => track !== exclude);
  const pool = choices.length > 0 ? choices : gameMusic.playlist;
  return pool[Math.floor(Math.random() * pool.length)];
}

function startPlaying(): void {
  element().play().catch(() => {
    // Autoplay blocked: start with the first interaction anywhere on the page
    if (waitingForGesture) {
      return;
    }
    waitingForGesture = true;
    const resume = () => {
      waitingForGesture = false;
      window.removeEventListener('pointerdown', resume, true);
      window.removeEventListener('keydown', resume, true);
      if (gameMusic.current !== undefined && safeLocalStorage.getItem(STOPPED_KEY) !== '1') {
        element().play().catch(() => {});
      }
    };
    window.addEventListener('pointerdown', resume, true);
    window.addEventListener('keydown', resume, true);
  });
}

function load(track: MusicTrack): void {
  const player = element();
  gameMusic.current = track;
  gameMusic.position = 0;
  gameMusic.duration = 0;
  player.src = musicFile(track.id);
}

/** A game was entered (or left: undefined): plays a random track of its theme, unless the player stopped the music. */
export async function enterGameMusic(theme: Theme | undefined): Promise<void> {
  if (theme === undefined) {
    leaveGameMusic();
    return;
  }
  const enabled = await loadEnabled();
  gameMusic.playlist = MUSIC_TRACKS.filter((track) => track.theme === theme && enabled.includes(track.id));
  if (gameMusic.current !== undefined && gameMusic.playlist.includes(gameMusic.current)) {
    return;
  }
  const track = randomTrack();
  if (track === undefined) {
    leaveGameMusic();
    return;
  }
  load(track);
  if (autoplayAllowed()) {
    startPlaying();
  }
}

// No automatic start when the player stopped the music in this browser, and never in remote-controlled browsers
// (tests, screenshots: navigator.webdriver): several test windows would otherwise play at the same time
function autoplayAllowed(): boolean {
  return safeLocalStorage.getItem(STOPPED_KEY) !== '1' && navigator.webdriver !== true;
}

export function leaveGameMusic(): void {
  audio?.pause();
  gameMusic.playlist = [];
  gameMusic.current = undefined;
}

export function playMusic(): void {
  safeLocalStorage.setItem(STOPPED_KEY, '0');
  if (gameMusic.current === undefined) {
    const track = randomTrack();
    if (track === undefined) {
      return;
    }
    load(track);
  }
  startPlaying();
}

export function stopMusic(): void {
  safeLocalStorage.setItem(STOPPED_KEY, '1');
  element().pause();
}

/** Next track (another one than the current); plays on when music was playing (or the last track just ended) */
export function next(keepPlaying: boolean = gameMusic.playing): void {
  const track = randomTrack(gameMusic.current);
  if (track === undefined) {
    return;
  }
  load(track);
  if (keepPlaying) {
    startPlaying();
  }
}

export function setMusicVolume(volume: number): void {
  gameMusic.volume = Math.min(1, Math.max(0, volume));
  element().volume = gameMusic.volume;
  safeLocalStorage.setItem(VOLUME_KEY, String(gameMusic.volume));
}

/** Jumps to a share (0..1) of the current track */
export function seekMusic(share: number): void {
  const player = element();
  if (gameMusic.duration > 0) {
    player.currentTime = share * gameMusic.duration;
    gameMusic.position = player.currentTime;
  }
}
