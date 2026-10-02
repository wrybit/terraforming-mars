// Flight animation of the Mars board between the column and the zoom modal (BoardZoomModal.vue).
// "FLIP" principle: the modal is already at its final position; the stage is moved and scaled via
// transform so its board lies exactly over the board in the column, and then runs
// to the final position. Closing is the same movement in reverse.

import {prefersReducedMotion, supportsWebAnimations, ZOOM_EASING} from '@/client/utils/motion';

const DURATION_MS = 320;

// Derive DOM types via animate(): eslint does not know the global keyframe types
type Keyframes = Parameters<HTMLElement['animate']>[0];
type AnimationTiming = Parameters<HTMLElement['animate']>[1];

export type BoardZoomAnimationOptions = {
  direction: 'open' | 'close';
  backdrop: HTMLElement;
  // Stage in the modal, carries the transform; contains the enlarged board (.board-cont)
  stage: HTMLElement;
  // Board in the column; if missing, only fade in/out
  origin: HTMLElement | undefined;
};

// transform that puts the stage's board onto the board in the column (transform-origin: 0 0)
function transformOntoOrigin(stage: HTMLElement, origin: HTMLElement): string | undefined {
  const target = stage.querySelector('.board-cont');
  if (target === null) {
    return undefined;
  }
  const originRect = origin.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const stageRect = stage.getBoundingClientRect();
  if (targetRect.width === 0 || originRect.width === 0) {
    return undefined;
  }
  const scale = originRect.width / targetRect.width;
  const translateX = originRect.left - stageRect.left - scale * (targetRect.left - stageRect.left);
  const translateY = originRect.top - stageRect.top - scale * (targetRect.top - stageRect.top);
  return `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

export async function animateBoardZoom(options: BoardZoomAnimationOptions): Promise<void> {
  const {direction, backdrop, stage, origin} = options;
  if (!supportsWebAnimations(stage) || prefersReducedMotion()) {
    return;
  }
  const collapsed = origin !== undefined ? transformOntoOrigin(stage, origin) : undefined;
  const expandFrames: Keyframes = collapsed !== undefined ?
    [{transform: collapsed}, {transform: 'none'}] :
    [{opacity: 0, transform: 'scale(0.9)'}, {opacity: 1, transform: 'none'}];
  // Closing plays the keyframes backwards, but with the same curve forwards: fast start, soft landing in the
  // column. direction 'reverse' would also flip the curve – sluggish start, hard landing
  const opening = direction === 'open';
  const stageFrames: Keyframes = opening ? expandFrames : [...expandFrames].reverse();
  // Only specify the value at the transparent end: the dark one comes from the stylesheet (board_zoom_modal.less)
  const transparentBackdrop = {backgroundColor: 'rgba(0, 0, 0, 0)', backdropFilter: 'blur(0px)'};
  const backdropFrames: Keyframes = [{...transparentBackdrop, offset: opening ? 0 : 1}];
  const timing: AnimationTiming = {
    duration: DURATION_MS,
    easing: ZOOM_EASING,
    // When closing, stay in the end state until the modal is removed (otherwise a brief flash)
    fill: opening ? 'none' : 'forwards',
  };
  // Only fade the close button in/out, it does not fly along
  const closeButton = backdrop.querySelector('.board-zoom-close');
  const animations = [
    stage.animate(stageFrames, timing),
    backdrop.animate(backdropFrames, timing),
  ];
  if (closeButton instanceof HTMLElement) {
    animations.push(closeButton.animate(opening ? [{opacity: 0}, {opacity: 1}] : [{opacity: 1}, {opacity: 0}], timing));
  }
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
}
