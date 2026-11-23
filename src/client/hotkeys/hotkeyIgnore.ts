// Elements whose own attributes change in every frame (scroll edge fades, overlay scrollbars, resize handles) carry
// this attribute: those changes never show or hide a hotkey item, and refreshing the key caps for each of them
// dropped frames while scrolling and moving the mouse (hotkeyDispatcher.ts watches the whole page)
export const HOTKEY_IGNORE_ATTRIBUTES = 'data-hotkey-ignore-attributes';

export function markHotkeyIgnored(element: Element): void {
  element.setAttribute(HOTKEY_IGNORE_ATTRIBUTES, '');
}

export function isIgnoredAttributeChange(record: MutationRecord): boolean {
  return record.type === 'attributes' && record.target instanceof Element && record.target.hasAttribute(HOTKEY_IGNORE_ATTRIBUTES);
}
