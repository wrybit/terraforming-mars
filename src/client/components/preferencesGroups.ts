import {Preference} from '@/client/utils/PreferencesManager';

// Settings as data, grouped by topic (PreferencesDialog.vue renders them with v-for).
// hint = former tooltip (ⓘ), now shown as text below the switch.

// Sounds that can be heard in the settings before switching them (SoundManager.ts)
export type SoundPreview = 'turn' | 'lobby';

export type PreferenceSwitch = {
  preference: Preference;
  label: string;
  hint?: string;
  // Play button next to the switch
  preview?: SoundPreview;
};

export type PreferenceGroup = {
  title: string;
  // Icon in the group header (SVG paths, 24px grid, outline only)
  iconPaths: ReadonlyArray<string>;
  // Rarely needed: collapsed and visually toned down
  optional?: boolean;
  switches: ReadonlyArray<PreferenceSwitch>;
};

export const PREFERENCE_GROUPS: ReadonlyArray<PreferenceGroup> = [
  {
    title: 'Cards',
    iconPaths: ['M8 3h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', 'M4 7v12a2 2 0 0 0 2 2h10'],
    switches: [
      {preference: 'hide_discount_on_cards', label: 'Hide discount on cards'},
      {preference: 'hide_zero_tags', label: 'Hide tags with zero count'},
    ],
  },
  {
    title: 'Notifications',
    iconPaths: ['M6 16V11a6 6 0 1 1 12 0v5l2 2H4z', 'M10 21h4'],
    switches: [
      // show_alerts: the confirmations before overpaying (PaymentForm) and before buying no cards (SelectInitialCards)
      {preference: 'show_alerts', label: 'Ask before risky moves', hint: 'For example before paying more than needed or buying no cards at the start.'},
      {preference: 'animated_title', label: 'Animated browser title', hint: 'Show spinning circle in window title on your turn.'},
    ],
  },
  {
    // Push messages of the lobby (lobbyPush.ts): one switch per kind, also with the page in the background or closed
    title: 'Messages from the lobby',
    iconPaths: ['M6 16V11a6 6 0 1 1 12 0v5l2 2H4z', 'M10 21h4', 'M19 3l2 2-2 2'],
    switches: [
      {preference: 'push_joined', label: 'Somebody joins your game', hint: 'Also with the lobby in the background or closed.'},
      {preference: 'push_request', label: 'Somebody asks to join'},
      {preference: 'push_started', label: 'Your game starts'},
    ],
  },
  {
    // Both sounds of the site in one place, each with its own switch
    title: 'Sounds',
    iconPaths: ['M4 9v6h4l5 4V5L8 9z', 'M16 9a4 4 0 0 1 0 6', 'M18.5 6.5a8 8 0 0 1 0 11'],
    switches: [
      // enable_sounds: only the sound on one's own turn (WaitingFor.vue); the lobby messages have toast_sound
      {preference: 'enable_sounds', label: 'Sound on your turn', preview: 'turn'},
      {preference: 'toast_sound', label: 'Sound for lobby messages', hint: 'With the page in front they appear inside it, with a short chime.', preview: 'lobby'},
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
      {preference: 'learner_mode', label: 'Learner Mode', hint: 'Show information that can be helpful\n to players who are still learning the games'},
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
