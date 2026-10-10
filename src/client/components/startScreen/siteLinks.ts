import {GlyphName} from '@/client/components/mobile/mobileGlyphs';
import {PlanetStripeName} from '@/client/components/startScreen/planetStripes';
import * as constants from '@/common/constants';
import {UPSTREAM_REPOSITORY_URL} from '@/client/utils/RepositoryLinks';
import {FEATURE_LOG_URL} from '@/client/utils/ShowcaseLinks';

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
  {label: 'New game', icon: 'newGame', planet: 'venus', href: 'new-game', external: false, inMenu: true},
  {label: 'Statistics', icon: 'statistics', planet: 'earth', href: 'stats', external: true, inMenu: true},
  {label: 'Cards list', icon: 'cardsList', planet: 'mars', href: 'cards', external: true, inMenu: true},
  {label: 'Game rules', icon: 'rules', planet: 'jupiter', href: 'https://github.com/terraforming-mars/terraforming-mars/wiki/Rulebooks', external: true, inMenu: true},
  {label: 'Board game', icon: 'boardGame', planet: 'saturn', href: 'https://boardgamegeek.com/boardgame/167791/terraforming-mars', external: true, inMenu: true},
  {label: 'Updates', icon: 'updates', planet: 'darkBlue', href: FEATURE_LOG_URL, external: true, inMenu: false},
  {label: 'Discord', icon: 'discord', planet: 'neptune', href: constants.DISCORD_INVITE, external: true, inMenu: false},
  {label: 'Team', icon: 'about', planet: 'moon', href: UPSTREAM_REPOSITORY_URL + '#-contributors-', external: true, inMenu: false},
];
