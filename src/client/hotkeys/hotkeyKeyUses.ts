// Which shortcuts lie on a key of the drawn keyboard (shortcut dialog): colors the key by group and links key and
// row on hover. Reads the current bindings, so the keyboard follows every change at once.
import {FIXED_HOTKEYS, HOTKEY_ACTIONS, HotkeyGroup, PICK_CODES, isActionShown} from '@/client/hotkeys/hotkeyActions';
import {codeLabel} from '@/client/hotkeys/hotkeyKeyLabels';
import {KeyboardKey} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {keysOf} from '@/client/hotkeys/hotkeyStore';
import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';

export type KeyUse = {
  id: string;
  group: HotkeyGroup;
  /** Color on the keyboard: the group, pass on and end generation their own (green, red) */
  color: string;
  /** Short label on the key (English, translated by the keyboard) */
  short: string;
  usesMod: boolean;
};

/**
 * Every shortcut with its keys (without 'Mod'), including the fixed ones and those of extensions; expansions limit
 * the tabs to those of the game
 */
export function allKeyUses(expansions?: ReadonlyArray<string>): Array<KeyUse & {keys: ReadonlyArray<string>}> {
  const uses: Array<KeyUse & {keys: ReadonlyArray<string>}> = HOTKEY_ACTIONS.filter((action) => isActionShown(action, expansions)).map((action) => {
    const keys: ReadonlyArray<string> = action.id === 'pick' ? PICK_CODES : keysOf(action.id);
    return {
      id: action.id,
      group: action.group,
      color: action.tone ?? action.group,
      short: action.short ?? action.label,
      usesMod: keys.includes('Mod'),
      keys: keys.filter((key) => key !== 'Mod'),
    };
  });
  for (const extension of CLIENT_EXTENSIONS) {
    for (const shortcut of extension.shortcuts ?? []) {
      uses.push({id: 'extension-' + extension.name + '-' + shortcut.key, group: 'general', color: 'general', short: shortcut.short ?? shortcut.label, usesMod: false, keys: [shortcut.key]});
    }
  }
  uses.push({id: 'help', group: 'general', color: 'general', short: 'Help', usesMod: false, keys: FIXED_HOTKEYS.help});
  return uses;
}

/** Character a drawn key shows on this device (real layout where the browser tells it) */
export function drawnCharacter(key: KeyboardKey): string | undefined {
  return (key.code !== undefined ? codeLabel(key.code) : undefined) ?? key.value;
}

// Single keys match the position, combinations the character, the help its "?" (Shift character of the key)
export function keyUses(key: KeyboardKey, expansions?: ReadonlyArray<string>): Array<KeyUse> {
  if (key.code === undefined) {
    return [];
  }
  const character = drawnCharacter(key);
  return allKeyUses(expansions).filter((use) => use.keys.some((value) =>
    use.usesMod ? value === character : value === key.code || (value === '?' && key.shiftValue === '?')));
}
