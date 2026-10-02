// Open/close animation of the sidebar dialogs (SidebarModal.vue: settings, info, help, language):
// the dialog grows out of the button that opened it and fades in at the same time;
// closing shrinks it back into that button and fades it out.
// "FLIP" like boardZoomAnimation.ts: the box already sits at its final place, a transform puts it onto the button.
import {prefersReducedMotion, supportsWebAnimations, ZOOM_EASING} from '@/client/utils/motion';

const OPEN_DURATION_MS = 300;
const CLOSE_DURATION_MS = 240;
// Without a visible button (e.g. hidden toolbar): only grow slightly from the center
const FALLBACK_TRANSFORM = 'scale(0.9)';

// Derive DOM types via animate(): eslint does not know the global keyframe types
type Keyframes = Parameters<HTMLElement['animate']>[0];

export type DialogZoomAnimationOptions = {
  direction: 'open' | 'close';
  // Dimmed page behind the dialog
  backdrop: HTMLElement;
  // The dialog box, carries the transform
  box: HTMLElement;
  // Button the dialog belongs to; measured anew on every call, it may have moved meanwhile
  origin: HTMLElement | undefined;
};

// transform that lays the box (transform-origin: center) exactly over the button
function transformOntoOrigin(box: HTMLElement, origin: HTMLElement | undefined): string {
  const originRect = origin?.getBoundingClientRect();
  const boxRect = box.getBoundingClientRect();
  if (originRect === undefined || originRect.width === 0 || originRect.height === 0 || boxRect.width === 0 || boxRect.height === 0) {
    return FALLBACK_TRANSFORM;
  }
  const translateX = originRect.left + originRect.width / 2 - (boxRect.left + boxRect.width / 2);
  const translateY = originRect.top + originRect.height / 2 - (boxRect.top + boxRect.height / 2);
  const scaleX = originRect.width / boxRect.width;
  const scaleY = originRect.height / boxRect.height;
  return `translate(${translateX}px, ${translateY}px) scale(${scaleX}, ${scaleY})`;
}

export async function animateDialogZoom(options: DialogZoomAnimationOptions): Promise<void> {
  const {direction, backdrop, box, origin} = options;
  if (!supportsWebAnimations(box)) {
    return;
  }
  // A dialog reopened mid-close (or closed mid-open) starts from its real place, not from a leftover frame
  [box, backdrop].forEach((element) => element.getAnimations().forEach((animation) => animation.cancel()));
  const opening = direction === 'open';
  // Reduced motion: only fade, no flying
  const collapsed = prefersReducedMotion() ? 'none' : transformOntoOrigin(box, origin);
  // The box is fully visible after the first half of the growth, so the button visibly turns into the dialog
  const openFrames: Keyframes = [
    {transform: collapsed, opacity: 0, offset: 0},
    {opacity: 1, offset: 0.5},
    {transform: 'none', opacity: 1, offset: 1},
  ];
  // Closing plays the keyframes backwards, but with the same curve forwards (boardZoomAnimation.ts):
  // direction 'reverse' would also flip the curve – sluggish start, hard landing
  const boxFrames: Keyframes = opening ? openFrames : openFrames.map((frame) => ({...frame, offset: 1 - (frame.offset as number)})).reverse();
  // Only specify the transparent end: the dark one comes from the stylesheet (modal_surface.less)
  const transparentBackdrop = {backgroundColor: 'rgba(0, 0, 0, 0)', backdropFilter: 'blur(0px)'};
  const backdropFrames: Keyframes = [{...transparentBackdrop, offset: opening ? 0 : 1}];
  const timing = {
    duration: opening ? OPEN_DURATION_MS : CLOSE_DURATION_MS,
    easing: ZOOM_EASING,
    // When closing, stay in the end state until the dialog is removed (otherwise a brief flash)
    fill: opening ? 'none' as const : 'forwards' as const,
  };
  const animations = [box.animate(boxFrames, timing), backdrop.animate(backdropFrames, timing)];
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
}
