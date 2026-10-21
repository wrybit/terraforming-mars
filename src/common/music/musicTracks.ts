import {Theme} from '../theme/Theme';

// Background music of the game: free tracks only (CC0 or CC BY), credited in the admin page and in the player.
// The audio files are made by scripts/make-music.ts from `download` (assets/music/<id>.mp3); it also measures
// the waveform (musicWaveforms.ts). New track: add it here, run `npx tsx scripts/make-music.ts`.

export type MusicLicense = 'CC0' | 'CC BY 3.0' | 'CC BY 4.0';

/** Sound of a track: retro game music, or modern atmospheric (pads, orchestra, oriental) */
export type MusicGroup = '8-bit' | 'modern';

export const MUSIC_GROUPS: ReadonlyArray<MusicGroup> = ['8-bit', 'modern'];

export type MusicTrack = {
  /** File name and key in the settings (db/music.json) */
  id: string,
  title: string,
  author: string,
  license: MusicLicense,
  /** Page of the track (credit and licence text) */
  source: string,
  /** Original file the script converts */
  download: string,
  /** Played in games of this theme */
  theme: Theme,
  group: MusicGroup,
};

export const MUSIC_LICENSE_URLS: Readonly<Record<MusicLicense, string>> = {
  'CC0': 'https://creativecommons.org/publicdomain/zero/1.0/',
  'CC BY 3.0': 'https://creativecommons.org/licenses/by/3.0/',
  'CC BY 4.0': 'https://creativecommons.org/licenses/by/4.0/',
};

const FILES = 'https://opengameart.org/sites/default/files/';

export const MUSIC_TRACKS: ReadonlyArray<MusicTrack> = [
  {
    id: 'dune-style', title: 'Egyptian Style / Dune Style', author: 'Spring Spring', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/egyptian-styledune-style', download: FILES + 'Egyptian%20Style%2CDune%20Style_0.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'dissonant-desert', title: 'Desert Theme (Dissonant Desert)', author: 'Jarewills', license: 'CC0',
    source: 'https://opengameart.org/content/desert-theme-2', download: FILES + 'dissonant_dessert.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'caravan', title: 'Desert Theme (Caravan)', author: 'yd', license: 'CC0',
    source: 'https://opengameart.org/content/desert-theme', download: FILES + 'caravan.ogg.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'desert-waltz', title: 'Desert Waltz (5/4 Synth)', author: 'Arold Valda', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/desert-waltz-54-synth', download: FILES + 'desert_waltz.flac', theme: 'dune', group: '8-bit',
  },
  {
    id: 'watch-the-sand', title: 'Watch The Sand', author: 'SpringySpringo', license: 'CC0',
    source: 'https://opengameart.org/node/141391', download: FILES + 'watch_the_sand_0.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'lost-in-the-desert', title: 'Lost In the Desert', author: 'Eldritch Grim', license: 'CC0',
    source: 'https://opengameart.org/content/lost-in-the-desert', download: FILES + 'lost_in_the_desert.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'stasis-chamber', title: 'Dreams in a Stasis Chamber', author: 'Tomasz Kucza (Magnesus)', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/dreams-in-a-stasis-chamber', download: FILES + 'Dreams-In-A-Stasis-Chamber-by-Tomasz-Kucza.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'sector', title: 'Sector (Dark Sci-Fi Audio Pack)', author: 'SRG774', license: 'CC0',
    source: 'https://opengameart.org/node/188336', download: FILES + 'sector_0.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'desert-of-dreams', title: 'Caryil – The Desert of Dreams (Remix)', author: 'glitchart, Tausdei, Insydnis', license: 'CC BY 3.0',
    source: 'https://opengameart.org/node/167037', download: FILES + 'caryil_the_desert_of_dreams_chill_jungle_ambient_mix_0.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'telos-roam', title: 'Telosroam1 (Desert BGM)', author: 'Tozan', license: 'CC0',
    source: 'https://opengameart.org/node/71054', download: FILES + 'telosroam1.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'night-in-the-desert', title: 'Night in the Desert (Remix)', author: 'glitchart, Tausdei, Hitctrl', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/night-in-the-desert-remixed-tausdei-vs-hitctrl', download: FILES + 'nightinthedesertmix.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'eternal-sands', title: 'Holy Sword & The Eternal Sands (Remix)', author: 'glitchart, Tausdei, Hitctrl', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/holy-sword-chill-jungle-ambient-the-eternal-sands-caryil-the-desert-of-dreams-tausdei-vs', download: FILES + 'holy_sword_remixed2.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'futuristic-ambient-1', title: 'Futuristic Ambient 1', author: 'Alexandr Zhelanov', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/futuristic-ambient', download: FILES + 'Futuristic_ambient_1.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'futuristic-ambient-2', title: 'Futuristic Ambient 2', author: 'Alexandr Zhelanov', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/futuristic-ambient', download: FILES + 'Futuristic_ambient_2.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'futuristic-ambient-3', title: 'Futuristic Ambient 3', author: 'Alexandr Zhelanov', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/futuristic-ambient', download: FILES + 'Futuristic_ambient_3.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'intrigue', title: 'Intrigue', author: 'Alexandr Zhelanov', license: 'CC BY 4.0',
    source: 'https://opengameart.org/node/150307', download: FILES + 'intrigue.wav', theme: 'dune', group: 'modern',
  },
  {
    id: 'darkness-march', title: 'Darkness March', author: 'Alexandr Zhelanov', license: 'CC BY 4.0',
    source: 'https://opengameart.org/node/83150', download: FILES + 'Darkness%20March.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'space-ambient', title: 'Space Ambient', author: 'Osmic', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/space-ambient', download: FILES + 'ville_seppanen-1_g.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'cosmic-dust', title: 'Cosmic Dust (Remix)', author: 'glitchart, outer123, DavidKBD', license: 'CC BY 4.0',
    source: 'https://opengameart.org/node/184290', download: FILES + 'cosmicdustmix.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'galactic-temple', title: 'Galactic Temple', author: 'yd', license: 'CC0',
    source: 'https://opengameart.org/content/galactic-temple', download: FILES + 'GalacticTemple.ogg', theme: 'dune', group: 'modern',
  },
];

/** Address of a track's audio file */
export function musicFile(id: string): string {
  return `assets/music/${id}.mp3`;
}

export function musicTrack(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((track) => track.id === id);
}
