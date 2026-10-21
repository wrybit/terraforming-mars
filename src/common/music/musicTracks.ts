import {Theme} from '../theme/Theme';

// Background music of the game: free tracks only (CC0 or CC BY), at least 3 minutes each, credited in the admin page and in the player.
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
const INCOMPETECH = 'https://incompetech.com/music/royalty-free/';

export const MUSIC_TRACKS: ReadonlyArray<MusicTrack> = [
  {
    id: 'airship-serenity', title: 'Airship Serenity', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1600046', download: INCOMPETECH + 'mp3-royaltyfree/Airship%20Serenity.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'dungeon-level', title: '8bit Dungeon Level', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1200066', download: INCOMPETECH + 'mp3-royaltyfree/8bit%20Dungeon%20Level.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'video-dungeon-crawl', title: 'Video Dungeon Crawl', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1200064', download: INCOMPETECH + 'mp3-royaltyfree/Video%20Dungeon%20Crawl.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'subsidised', title: 'SubSidised', author: 'Yubatake', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/subsidised', download: FILES + 'SubSidised.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'quasi-medieval-suite', title: 'Quasi Medieval Suite (C64)', author: 'skrjablin', license: 'CC0',
    source: 'https://opengameart.org/content/6-genuinely-c64-soundtracks-released-as-public-domain-may-2017', download: FILES + 'quasi_medieval_suite.ogg', theme: 'dune', group: '8-bit',
  },
  {
    id: 'ice-cave', title: '8 Bit Lofi – Ice Cave', author: 'TAD', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/8-bit-lofi-ice-cave', download: FILES + '8_bit_ice_cave_lofi.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'crystal-caves', title: 'Crystal Caves', author: 'FoxSynergy', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/crystal-caves', download: FILES + 'Crystal%20Caves%20v1_2.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'aura-horizon', title: 'Aura Horizon', author: 'Zane Little Music', license: 'CC0',
    source: 'https://opengameart.org/content/10-more-chiptune-tracks-another-bag-of-chips', download: FILES + 'aura_horizon.mp3', theme: 'dune', group: '8-bit',
  },
  {
    id: 'night-in-the-desert', title: 'Night in the Desert (Remix)', author: 'glitchart, Tausdei, Hitctrl', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/night-in-the-desert-remixed-tausdei-vs-hitctrl', download: FILES + 'nightinthedesertmix.ogg', theme: 'dune', group: 'modern',
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
    id: 'space-ambient', title: 'Space Ambient', author: 'Osmic', license: 'CC BY 3.0',
    source: 'https://opengameart.org/content/space-ambient', download: FILES + 'ville_seppanen-1_g.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'cosmic-dust', title: 'Cosmic Dust (Remix)', author: 'glitchart, outer123, DavidKBD', license: 'CC BY 4.0',
    source: 'https://opengameart.org/node/184290', download: FILES + 'cosmicdustmix.ogg', theme: 'dune', group: 'modern',
  },
  {
    id: 'ibn-al-noor', title: 'Ibn Al-Noor', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1100706', download: INCOMPETECH + 'mp3-royaltyfree/Ibn%20Al-Noor.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'mirage', title: 'Mirage', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1100877', download: INCOMPETECH + 'mp3-royaltyfree/Mirage.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'finding-the-balance', title: 'Finding the Balance', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1100708', download: INCOMPETECH + 'mp3-royaltyfree/Finding%20the%20Balance.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'spacial-harvest', title: 'Spacial Harvest', author: 'Kevin MacLeod', license: 'CC BY 4.0',
    source: INCOMPETECH + 'index.html?isrc=USUAN1100653', download: INCOMPETECH + 'mp3-royaltyfree/Spacial%20Harvest.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'ancient-ruins', title: 'Ancient Ruins', author: 'tcarisland', license: 'CC BY 4.0',
    source: 'https://opengameart.org/content/ancient-ruins-1', download: FILES + 'ancient_ruins.mp3', theme: 'dune', group: 'modern',
  },
  {
    id: 'sirens-in-darkness', title: 'Sirens in Darkness', author: 'cynicmusic', license: 'CC0',
    source: 'https://opengameart.org/content/sirens-in-darkness', download: FILES + '012_Sirens_in_Darkness.mp3', theme: 'dune', group: 'modern',
  },
];

/** Address of a track's audio file */
export function musicFile(id: string): string {
  return `assets/music/${id}.mp3`;
}

export function musicTrack(id: string): MusicTrack | undefined {
  return MUSIC_TRACKS.find((track) => track.id === id);
}
