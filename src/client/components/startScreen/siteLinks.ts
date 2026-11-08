import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import {PlanetStripeName} from '@/client/components/startScreen/planetStripes';
import * as constants from '@/common/constants';
import {FEATURE_LOG_URL} from '@/client/utils/ShowcaseLinks';
import {LOBBY_CREATE_PATH} from '@/common/lobby/lobbyUrl';

// One list for the start page buttons and the navigation box of the game menu (GameMenu.vue),
// so labels, icons and targets stay identical in both places.
export type SiteLink = {
  label: string,
  icon: GlyphName,
  // Stripe in planet-stripes.jpg (start page only)
  planet: PlanetStripeName,
  href: string,
  // Start page: opens a new tab so the start page stays open
  external: boolean,
  // Also listed in the navigation box of the game menu
  inMenu: boolean,
};

// Order = order of the planet backgrounds on the start page (globe row)
export const SITE_LINKS: ReadonlyArray<SiteLink> = [
  // Straight into the create form, as an overlay above the lobby (address lobby/create, lobbyUrl.ts).
  // Not in the game menu: there "Start page" already sits on top and two "Start" entries would be confused
  {label: 'Start a game', icon: 'newGame', planet: 'venus', href: LOBBY_CREATE_PATH, external: false, inMenu: false},
  // The lobby replaces "New game": games are opened there (the create form is its modal); new-game leads to lobby/create
  // "Game lobby", not "Lobby": that key is Turmoil's lobby (political) and translates differently, e.g. in Chinese
  {label: 'Game lobby', icon: 'lobby', planet: 'earth', href: 'lobby', external: false, inMenu: true},
  {label: 'Statistics', icon: 'statistics', planet: 'mars', href: 'stats', external: true, inMenu: true},
  {label: 'Cards list', icon: 'cardsList', planet: 'jupiter', href: 'cards', external: true, inMenu: true},
  {label: 'Game rules', icon: 'rules', planet: 'saturn', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true, inMenu: true},
  {label: 'Board game', icon: 'boardGame', planet: 'darkBlue', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true, inMenu: true},
  {label: 'Updates', icon: 'updates', planet: 'neptune', href: FEATURE_LOG_URL, external: true, inMenu: false},
  // Own key (English override "Chat"): fits the moon row in every language; the lobby chat keeps its "Chat" texts
  {label: 'Community chat', icon: 'discord', planet: 'moon', href: constants.DISCORD_INVITE, external: true, inMenu: false},
];

// Only in the game menu, above "New game": the way back to the start page from every other page.
// Not a globe on the start page itself, where it would lead to the page you are on.
export const START_PAGE_LINK: Pick<SiteLink, 'label' | 'icon' | 'href'> = {label: 'Start page', icon: 'mars', href: './'};

// Only in the game menu and only after the admin login (adminSession.ts): the way into the admin area.
// Its pages do not offer it again (they have their own navigation).
export const ADMIN_LINK: Pick<SiteLink, 'label' | 'icon' | 'href'> = {label: 'Administration', icon: 'admin', href: 'admin'};
export const ADMIN_PAGES: ReadonlyArray<string> = ['games-overview', 'admin', 'admin-dashboard', 'admin-settings', 'admin-raw', 'admin-push', 'load'];
