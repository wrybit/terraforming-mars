// Text field that grows with its text (lobby chat: writing and editing): one line at first, then up to a few lines,
// beyond that it scrolls. Wrapped lines count as well as typed line breaks, since the height comes from the content.

export const AUTO_GROW_MAX_LINES = 5;

export function autoGrow(field: HTMLTextAreaElement, maxLines: number = AUTO_GROW_MAX_LINES): void {
  const style = getComputedStyle(field);
  const lineHeight = parseFloat(style.lineHeight) || parseFloat(style.fontSize) * 1.35;
  const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);
  const maxHeight = maxLines * lineHeight + padding + border;
  // Measured from scratch: otherwise the field would only grow, never shrink back
  field.style.height = 'auto';
  const contentHeight = field.scrollHeight + border;
  field.style.height = `${Math.min(contentHeight, maxHeight)}px`;
  field.style.overflowY = contentHeight > maxHeight ? 'auto' : 'hidden';
}
