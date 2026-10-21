import {computed, reactive} from 'vue';
import {paths} from '@/common/app/paths';
import {Theme} from '@/common/theme/Theme';
import {MUSIC_GROUPS, MUSIC_TRACKS, MusicGroup, MusicTrack, musicFile} from '@/common/music/musicTracks';
import {DEFAULT_START_TRACK, MusicState} from '@/common/music/musicState';
import {safeLocalStorage} from '@/client/utils/SafeLocalStorage';

// Background music of the game (one player for the whole app): starts when a game of a theme with tracks is
// entered (App.vue), is steered from the card under the setup menu (MusicPlayerCard.vue). Browsers only play
// sound after the first interaction: until then the start waits for the first click or key.
// Remembered per browser: the volume, mute, the chosen group, and whether the player stopped the music (then it stays off).

/** Group the player listens to (MusicPlayerCard.vue): one of the groups or all tracks */
export type MusicChoice = 'all' | MusicGroup;
export const MUSIC_CHOICES: ReadonlyArray<MusicChoice> = ['all', ...MUSIC_GROUPS];

const VOLUME_KEY = 'tm-music-volume';
const CHOICE_KEY = 'tm-music-group';
const MUTED_KEY = 'tm-music-muted';
const STOPPED_KEY = 'tm-music-stopped';
const DEFAULT_VOLUME = 0.5;
// Group shown until the server tells the start track; then the start track's group, unless the listener chose one
const DEFAULT_CHOICE: MusicChoice = 'modern';

export const gameMusic = reactive({
  /** Tracks of the current game's theme that the admin left on; empty outside a game */
  available: [] as Array<MusicTrack>,
  choice: readChoice(),
  current: undefined as MusicTrack | undefined,
  playing: false,
  /** Seconds played and length of the current track (for the waveform) */
  position: 0,
  duration: 0,
  volume: readVolume(),
  muted: safeLocalStorage.getItem(MUTED_KEY) === '1',
});

export const musicAvailable = computed(() => gameMusic.available.length > 0);

/** Tracks of the chosen group; all available ones when the group has none (e.g. all switched off) */
export const musicPlaylist = computed<Array<MusicTrack>>(() => {
  const chosen = gameMusic.available.filter((track) => gameMusic.choice === 'all' || track.group === gameMusic.choice);
  return chosen.length > 0 ? chosen : gameMusic.available;
});

// Two players take turns: the current one plays, the other already loads the next track, so the next one starts
// without a gap when the current one ends (endless music, one track after the other)
let audio: HTMLAudioElement | undefined;
let upcoming: {track: MusicTrack, element: HTMLAudioElement} | undefined;
let spare: HTMLAudioElement | undefined;
let serverState: Promise<MusicState> | undefined;
/** Track a game starts with (admin page) */
let startTrack = DEFAULT_START_TRACK;
let waitingForGesture = false;

function storedChoice(): MusicChoice | undefined {
  const stored = safeLocalStorage.getItem(CHOICE_KEY);
  return MUSIC_CHOICES.find((choice) => choice === stored);
}

function readChoice(): MusicChoice {
  return storedChoice() ?? DEFAULT_CHOICE;
}

function readVolume(): number {
  const stored = Number(safeLocalStorage.getItem(VOLUME_KEY));
  return safeLocalStorage.getItem(VOLUME_KEY) !== null && Number.isFinite(stored) ? Math.min(1, Math.max(0, stored)) : DEFAULT_VOLUME;
}

function readDuration(player: HTMLAudioElement): number {
  return Number.isFinite(player.duration) ? player.duration : 0;
}

// A player reports only while it is the current one: the loading one must not touch the state
function createPlayer(): HTMLAudioElement {
  const player = new Audio();
  player.preload = 'auto';
  player.volume = gameMusic.volume;
  player.muted = gameMusic.muted;
  player.addEventListener('timeupdate', () => {
    if (player === audio) {
      gameMusic.position = player.currentTime;
    }
  });
  player.addEventListener('loadedmetadata', () => {
    if (player === audio) {
      gameMusic.duration = readDuration(player);
    }
  });
  player.addEventListener('ended', () => {
    if (player === audio) {
      next(true);
    }
  });
  player.addEventListener('play', () => {
    if (player === audio) {
      gameMusic.playing = true;
    }
  });
  player.addEventListener('pause', () => {
    if (player === audio) {
      gameMusic.playing = false;
    }
  });
  return player;
}

function element(): HTMLAudioElement {
  audio ??= createPlayer();
  return audio;
}

function allPlayers(): Array<HTMLAudioElement> {
  return [audio, upcoming?.element, spare].filter((player): player is HTMLAudioElement => player !== undefined);
}

/** Starts loading the track after the current one in the other player */
function prepareUpcoming(): void {
  const track = randomTrack(gameMusic.current);
  if (track === undefined || track === gameMusic.current) {
    upcoming = undefined;
    return;
  }
  const player = upcoming?.element ?? spare ?? createPlayer();
  spare = undefined;
  if (upcoming?.track !== track) {
    player.src = musicFile(track.id);
  }
  upcoming = {track, element: player};
}

function loadState(): Promise<MusicState> {
  serverState ??= fetch(paths.API_MUSIC)
    .then((response) => response.ok ? response.json() as Promise<MusicState> : {enabled: [], start: DEFAULT_START_TRACK})
    .catch(() => ({enabled: [], start: DEFAULT_START_TRACK}));
  return serverState;
}

// Shuffle without repeats: every track of the playlist plays once in random order, then all count as unplayed
// again; the one that just played never comes twice in a row
const played = new Set<string>();

function randomTrack(exclude?: MusicTrack): MusicTrack | undefined {
  const others = musicPlaylist.value.filter((track) => track !== exclude);
  if (others.length === 0) {
    return musicPlaylist.value[0];
  }
  let unplayed = others.filter((track) => !played.has(track.id));
  if (unplayed.length === 0) {
    played.clear();
    if (exclude !== undefined) {
      played.add(exclude.id);
    }
    unplayed = others;
  }
  return unplayed[Math.floor(Math.random() * unplayed.length)];
}

function firstTrack(): MusicTrack | undefined {
  return musicPlaylist.value.find((track) => track.id === startTrack) ?? randomTrack();
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
  if (upcoming?.track === track) {
    // Already loaded in the other player: swap, the old one becomes the spare for the track after
    const previous = audio;
    previous?.pause();
    audio = upcoming.element;
    upcoming = undefined;
    spare = previous;
  } else {
    element().src = musicFile(track.id);
  }
  const player = element();
  player.currentTime = 0;
  gameMusic.current = track;
  played.add(track.id);
  gameMusic.position = 0;
  gameMusic.duration = readDuration(player);
  gameMusic.playing = !player.paused;
  prepareUpcoming();
}

/** A game was entered (or left: undefined): plays a random track of its theme, unless the player stopped the music. */
export async function enterGameMusic(theme: Theme | undefined): Promise<void> {
  if (theme === undefined) {
    leaveGameMusic();
    return;
  }
  const state = await loadState();
  startTrack = state.start;
  gameMusic.available = MUSIC_TRACKS.filter((track) => track.theme === theme && state.enabled.includes(track.id));
  // Without an own choice the listener hears the group of the start track
  const start = gameMusic.available.find((track) => track.id === startTrack);
  if (storedChoice() === undefined && start !== undefined) {
    gameMusic.choice = start.group;
  }
  if (gameMusic.current !== undefined && musicPlaylist.value.includes(gameMusic.current)) {
    return;
  }
  const track = firstTrack();
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
  allPlayers().forEach((player) => player.pause());
  upcoming = undefined;
  gameMusic.available = [];
  gameMusic.current = undefined;
}

export function playMusic(): void {
  safeLocalStorage.setItem(STOPPED_KEY, '0');
  if (gameMusic.current === undefined) {
    const track = firstTrack();
    if (track === undefined) {
      return;
    }
    load(track);
  }
  startPlaying();
}

/** Plays the chosen track from its start (playlist in MusicPlaylist.vue) */
export function playTrack(track: MusicTrack): void {
  safeLocalStorage.setItem(STOPPED_KEY, '0');
  load(track);
  startPlaying();
}

export function stopMusic(): void {
  safeLocalStorage.setItem(STOPPED_KEY, '1');
  element().pause();
}

/** Next track (another one than the current); plays on when music was playing (or the last track just ended) */
export function next(keepPlaying: boolean = gameMusic.playing): void {
  const track = upcoming?.track ?? randomTrack(gameMusic.current);
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
  allPlayers().forEach((player) => player.volume = gameMusic.volume);
  safeLocalStorage.setItem(VOLUME_KEY, String(gameMusic.volume));
}

/** Silences the music without stopping it (remembered per browser) */
export function setMusicMuted(muted: boolean): void {
  gameMusic.muted = muted;
  allPlayers().forEach((player) => player.muted = muted);
  safeLocalStorage.setItem(MUTED_KEY, muted ? '1' : '0');
}

/** Jumps to a share (0..1) of the current track */
export function seekMusic(share: number): void {
  const player = element();
  if (gameMusic.duration > 0) {
    player.currentTime = share * gameMusic.duration;
    gameMusic.position = player.currentTime;
  }
}

/** Listens to another group; a track outside it gives way to one of the group (playing on if it played) */
export function chooseMusicGroup(choice: MusicChoice): void {
  gameMusic.choice = choice;
  safeLocalStorage.setItem(CHOICE_KEY, choice);
  if (gameMusic.current !== undefined && !musicPlaylist.value.includes(gameMusic.current)) {
    upcoming = undefined;
    next();
  } else if (gameMusic.current !== undefined) {
    // The prepared track may lie outside the new group
    prepareUpcoming();
  }
}

/**
 * What the setup button shows (MusicStateIcon.vue): playing → equalizer, muted → mute icon, paused (a track was
 * played and is held) → pause icon, stopped (nothing played yet, or no music in this game) → the usual burger.
 */
export type MusicIndicator = 'playing' | 'muted' | 'paused' | 'stopped';

export const musicIndicator = computed<MusicIndicator>(() => {
  if (!musicAvailable.value || gameMusic.current === undefined) {
    return 'stopped';
  }
  if (gameMusic.playing) {
    return gameMusic.muted ? 'muted' : 'playing';
  }
  return gameMusic.position > 0 ? 'paused' : 'stopped';
});

/** Share played of the current track (0..1) for the progress frame of the setup button; undefined without a track */
export const musicProgress = computed<number | undefined>(() => {
  if (musicIndicator.value === 'stopped' || gameMusic.duration <= 0) {
    return undefined;
  }
  return Math.min(1, gameMusic.position / gameMusic.duration);
});
