// Which shortcuts lie on a key of the drawn keyboard (shortcut dialog): colors the key by group and links key and
// row on hover. Reads the current bindings, so the keyboard follows every change at once.
import {FIXED_HOTKEYS, HOTKEY_ACTIONS, HotkeyGroup} from '@/client/hotkeys/hotkeyActions';
import {KeyboardKey} from '@/client/hotkeys/hotkeyKeyboardLayouts';
import {keysOf} from '@/client/hotkeys/hotkeyStore';
import {CLIENT_EXTENSIONS} from '@/genfiles/extensionsClient';

export type KeyUse = {
  id: string;
  group: HotkeyGroup;
  usesMod: boolean;
};

const PICK_DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

/** Every shortcut with its keys (without 'Mod'), including the fixed ones and those of extensions */
export function allKeyUses(): Array<KeyUse & {keys: ReadonlyArray<string>}> {
  const uses: Array<KeyUse & {keys: ReadonlyArray<string>}> = HOTKEY_ACTIONS.map((action) => {
    const keys: ReadonlyArray<string> = action.id === 'pick' ? PICK_DIGITS : keysOf(action.id);
    return {id: action.id, group: action.group, usesMod: keys.includes('Mod'), keys: keys.filter((key) => key !== 'Mod')};
  });
  for (const extension of CLIENT_EXTENSIONS) {
    for (const shortcut of extension.shortcuts ?? []) {
      uses.push({id: 'extension-' + extension.name + '-' + shortcut.key, group: 'general', usesMod: false, keys: [shortcut.key]});
    }
  }
  uses.push({id: 'help', group: 'general', usesMod: false, keys: FIXED_HOTKEYS.help});
  return uses;
}

export function keyUses(key: KeyboardKey): Array<KeyUse> {
  if (key.value === undefined && key.shiftValue === undefined) {
    return [];
  }
  return allKeyUses().filter((use) => use.keys.some((value) => value === key.value || value === key.shiftValue));
}
