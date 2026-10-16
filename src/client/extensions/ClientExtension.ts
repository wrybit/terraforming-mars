// Client part of an optional extension (see src/common/extensions/CommonExtension.ts).
import {Component} from 'vue';
import {ViewModel} from '@/common/models/PlayerModel';

export type ExtensionMenuItem = {
  /** English text; translated like every menu entry */
  label: string,
  /** Icon in the menu (about 20 px) */
  icon: Component,
  select: () => void,
};

export type ExtensionShortcut = {
  key: string,
  /** English text for the help page */
  label: string,
  /** Shorter English text on the drawn keyboard of the shortcut dialog */
  short?: string,
};

export type ClientExtension = {
  name: string,
  /** Mounted once at the root of the app (App.vue), with the current game view if there is one */
  component?: Component<{view: ViewModel | undefined}>,
  /** Entries of the menu at the top left of every page (GameMenu.vue) */
  menuItems?: ReadonlyArray<ExtensionMenuItem>,
  /** Keys listed in the help (HelpKeyboardShortcuts.vue) */
  shortcuts?: ReadonlyArray<ExtensionShortcut>,
};
