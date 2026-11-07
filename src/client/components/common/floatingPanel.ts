import {onBeforeUnmount, Ref, ref} from 'vue';

// Distance to the window edge: on phones the panel stays fully visible
const EDGE = 12;
const GAP = 8;

export type FloatingPanelOptions = {
  /** Fixed width of the panel; without it the panel takes its content's width */
  width?: number;
  /** Which edge of the anchor the panel lines up with */
  align: 'left' | 'right';
};

/**
 * A panel below a button that hangs at the body (Teleport): dialogs and cards clip whatever sticks out of them.
 * Click elsewhere, scrolling or resizing closes it (the panel would stay behind otherwise).
 * anchor: template ref of the button; panel: template ref of the teleported panel, which gets :style="position".
 */
export function useFloatingPanel(anchor: Ref<HTMLElement | undefined>, panel: Ref<HTMLElement | undefined>, options: FloatingPanelOptions) {
  const open = ref(false);
  const position = ref<Record<string, string>>({});

  function show(): void {
    const rect = anchor.value?.getBoundingClientRect();
    if (rect === undefined) {
      return;
    }
    const style: Record<string, string> = {position: 'fixed', top: `${rect.bottom + GAP}px`};
    if (options.width !== undefined) {
      const width = Math.min(options.width, window.innerWidth - 2 * EDGE);
      const start = options.align === 'left' ? rect.left : rect.right - width;
      style.left = `${Math.max(EDGE, Math.min(start, window.innerWidth - width - EDGE))}px`;
      style.width = `${width}px`;
    } else if (options.align === 'left') {
      style.left = `${Math.max(EDGE, rect.left)}px`;
    } else {
      style.right = `${Math.max(EDGE, window.innerWidth - rect.right)}px`;
    }
    position.value = style;
    open.value = true;
    document.addEventListener('pointerdown', onPointerDown, true);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
  }

  function close(): void {
    open.value = false;
    document.removeEventListener('pointerdown', onPointerDown, true);
    window.removeEventListener('scroll', close, true);
    window.removeEventListener('resize', close);
  }

  function toggle(): void {
    if (open.value) {
      close();
    } else {
      show();
    }
  }

  function onPointerDown(event: PointerEvent): void {
    const target = event.target as Node;
    if (!panel.value?.contains(target) && !anchor.value?.contains(target)) {
      close();
    }
  }

  onBeforeUnmount(close);

  return {open, position, toggle, close};
}
