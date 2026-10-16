// Keyboard shortcuts must not fire while someone types into a field
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }
  // Radio buttons, check boxes and sliders take no text: a card chosen with a click must not swallow the next key
  if (target instanceof HTMLInputElement && ['radio', 'checkbox', 'range', 'button', 'submit'].includes(target.type)) {
    return false;
  }
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}
