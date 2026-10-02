import {Preference} from '@/client/utils/PreferencesManager';

// Einstellungen als Daten, gruppiert nach Thema (PreferencesDialog.vue rendert sie per v-for).
// hint = früherer Tooltip (ⓘ), jetzt als Untertext unter dem Schalter.

export type PreferenceSwitch = {
  preference: Preference;
  label: string;
  hint?: string;
};

export type PreferenceGroup = {
  title: string;
  // Symbol im Gruppenkopf (SVG-Pfade, 24er-Raster, nur Kontur)
  iconPaths: ReadonlyArray<string>;
  // Selten gebraucht: zusammengeklappt und zurückgenommen dargestellt
  optional?: boolean;
  switches: ReadonlyArray<PreferenceSwitch>;
};

export const PREFERENCE_GROUPS: ReadonlyArray<PreferenceGroup> = [
  {
    title: 'Cards',
    iconPaths: ['M8 3h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M4 7v12a2 2 0 0 0 2 2h10'],
    switches: [
      {preference: 'small_cards', label: 'Smaller cards'},
      {preference: 'magnify_cards', label: 'Magnify cards on hover'},
      {preference: 'hide_discount_on_cards', label: 'Hide discount on cards'},
      {preference: 'hide_zero_tags', label: 'Hide tags with zero count'},
    ],
  },
  {
    title: 'Notifications',
    iconPaths: ['M6 16V11a6 6 0 1 1 12 0v5l2 2H4z', 'M10 21h4'],
    switches: [
      {preference: 'show_alerts', label: 'Show in-game alerts'},
      {preference: 'enable_sounds', label: 'Enable sounds'},
      {preference: 'animated_title', label: 'Animated Title', hint: 'Show spinning circle in window title on your turn.'},
      {preference: 'hide_animated_sidebar', label: 'Hide sidebar notification'},
    ],
  },
  {
    title: 'Display',
    iconPaths: ['M3 5h18v12H3z', 'M8 21h8M12 17v4'],
    switches: [
      {preference: 'hide_awards_and_milestones', label: 'Hide awards and milestones'},
      {preference: 'remove_background', label: 'Remove background image'},
      {preference: 'symbol_overlay', label: 'Symbol Overlay', hint: 'Add symbols on top of player colors.'},
    ],
  },
  {
    title: 'Game aids',
    iconPaths: ['M9 18h6M10 21h4', 'M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z'],
    switches: [
      {preference: 'learner_mode', label: 'Learner Mode (req. refresh)', hint: 'Show information that can be helpful\n to players who are still learning the games'},
      {preference: 'hide_tile_confirmation', label: 'Hide tile confirmation'},
    ],
  },
  {
    title: 'Advanced',
    iconPaths: ['M8 9l-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12'],
    optional: true,
    switches: [
      {preference: 'experimental_ui', label: 'Experimental UI', hint: 'Test out any possible new experimental UI features for feedback.'},
      {preference: 'debug_view', label: 'Debug View', hint: 'Add information useful for development and debugging.'},
    ],
  },
];
