import {onBeforeUnmount, onMounted, ref, Ref} from 'vue';

// Size and position of the floating replay panel. Folded it is a narrow bar that can be dragged anywhere;
// a click on it unfolds it in three steps, so it never grows somewhere off its place:
// back home (still narrow) → wide → tall. Folding runs the other way: low first, then narrow.
// The durations match the transitions in replay.less.
export const REPLAY_PANEL_MOVE_MS = 300;
export const REPLAY_PANEL_WIDTH_MS = 300;
export const REPLAY_PANEL_FOLD_MS = 380;
// Moving the pointer further than this turns a click into a drag
const DRAG_THRESHOLD = 4;
// Distance the dragged bar keeps to the window edge
const EDGE = 8;
// Controls of the bar keep their own pointer handling (play, size toggle, slider)
const OWN_POINTER = 'button, .replay-timeline__scrub';

export type ReplayPanelOffset = {x: number, y: number};

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export function useReplayPanelMotion(panel: Ref<HTMLElement | undefined>) {
  // thin: only the slider row is shown; narrow: half width. Folded = both, unfolded = neither.
  const thin = ref(true);
  const narrow = ref(true);
  const offset = ref<ReplayPanelOffset>({x: 0, y: 0});
  const dragging = ref(false);
  // A newer expand/collapse cancels the steps of an older one
  let sequence = 0;

  async function expand(): Promise<void> {
    const run = ++sequence;
    if (offset.value.x !== 0 || offset.value.y !== 0) {
      offset.value = {x: 0, y: 0};
      await wait(REPLAY_PANEL_MOVE_MS);
    }
    if (run !== sequence) {
      return;
    }
    if (narrow.value) {
      narrow.value = false;
      await wait(REPLAY_PANEL_WIDTH_MS);
    }
    if (run === sequence) {
      thin.value = false;
    }
  }

  async function collapse(): Promise<void> {
    const run = ++sequence;
    if (!thin.value) {
      thin.value = true;
      await wait(REPLAY_PANEL_FOLD_MS);
    }
    if (run === sequence) {
      narrow.value = true;
    }
  }

  const folded = () => thin.value && narrow.value;
  const toggle = () => folded() ? expand() : collapse();

  // Keeps the whole bar inside the window
  function clamped(next: ReplayPanelOffset): ReplayPanelOffset {
    if (panel.value === undefined) {
      return next;
    }
    const rect = panel.value.getBoundingClientRect();
    const homeLeft = rect.left - offset.value.x;
    const homeTop = rect.top - offset.value.y;
    return {
      x: Math.min(Math.max(next.x, EDGE - homeLeft), window.innerWidth - EDGE - rect.width - homeLeft),
      y: Math.min(Math.max(next.y, EDGE - homeTop), window.innerHeight - EDGE - rect.height - homeTop),
    };
  }

  let start: {pointerX: number, pointerY: number, offset: ReplayPanelOffset} | undefined;
  function onPointerDown(event: PointerEvent): void {
    if (!folded() || event.button !== 0 || (event.target as Element).closest(OWN_POINTER) !== null) {
      return;
    }
    start = {pointerX: event.clientX, pointerY: event.clientY, offset: offset.value};
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }
  function onPointerMove(event: PointerEvent): void {
    if (start === undefined) {
      return;
    }
    const dx = event.clientX - start.pointerX;
    const dy = event.clientY - start.pointerY;
    if (!dragging.value && Math.hypot(dx, dy) < DRAG_THRESHOLD) {
      return;
    }
    dragging.value = true;
    offset.value = clamped({x: start.offset.x + dx, y: start.offset.y + dy});
  }
  function onPointerUp(): void {
    if (start === undefined) {
      return;
    }
    start = undefined;
    if (dragging.value) {
      dragging.value = false;
    } else {
      // A click (no drag) on the bar unfolds it
      expand();
    }
  }
  function onPointerCancel(): void {
    start = undefined;
    dragging.value = false;
  }

  // A smaller window must not leave the dragged bar outside
  const onResize = () => offset.value = clamped(offset.value);
  onMounted(() => window.addEventListener('resize', onResize));
  onBeforeUnmount(() => {
    sequence++;
    window.removeEventListener('resize', onResize);
  });

  return {thin, narrow, offset, dragging, expand, collapse, toggle, onPointerDown, onPointerMove, onPointerUp, onPointerCancel};
}
