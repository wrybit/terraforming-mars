// Flug-Animation des Mars-Bretts zwischen Spalte und Vergrößerungs-Modal (BoardZoomModal.vue).
// Prinzip "FLIP": Das Modal steht schon an seiner Endposition; die Bühne wird per transform so
// verschoben und skaliert, dass ihr Brett exakt über dem Brett in der Spalte liegt, und läuft dann
// in die Endposition. Schließen ist dieselbe Bewegung rückwärts.

const DURATION_MS = 320;
const EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

// DOM-Typen über animate() herleiten: eslint kennt die globalen Keyframe-Typen nicht
type Keyframes = Parameters<HTMLElement['animate']>[0];
type AnimationTiming = Parameters<HTMLElement['animate']>[1];

export type BoardZoomAnimationOptions = {
  direction: 'open' | 'close';
  backdrop: HTMLElement;
  // Bühne im Modal, trägt die Transformation; enthält das vergrößerte Brett (.board-cont)
  stage: HTMLElement;
  // Brett in der Spalte; fehlt es, wird nur ein- bzw. ausgeblendet
  origin: HTMLElement | undefined;
};

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// transform, der das Brett der Bühne auf das Brett in der Spalte legt (transform-origin: 0 0)
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
  // jsdom (Tests) kennt keine Web Animations
  if (typeof stage.animate !== 'function' || prefersReducedMotion()) {
    return;
  }
  const collapsed = origin !== undefined ? transformOntoOrigin(stage, origin) : undefined;
  const stageFrames: Keyframes = collapsed !== undefined ?
    [{transform: collapsed}, {transform: 'none'}] :
    [{opacity: 0, transform: 'scale(0.9)'}, {opacity: 1, transform: 'none'}];
  // Nur Startwert angeben: der Endwert kommt aus dem Stylesheet (board_zoom_modal.less)
  const backdropFrames: Keyframes = [
    {backgroundColor: 'rgba(0, 0, 0, 0)', backdropFilter: 'blur(0px)', offset: 0},
  ];
  const timing: AnimationTiming = {
    duration: DURATION_MS,
    easing: EASING,
    direction: direction === 'open' ? 'normal' : 'reverse',
    // Beim Schließen im Endzustand stehen bleiben, bis das Modal entfernt ist (sonst kurzes Aufblitzen)
    fill: direction === 'open' ? 'none' : 'forwards',
  };
  // Schließen-Knopf nur einblenden, er fliegt nicht mit
  const closeButton = backdrop.querySelector('.board-zoom-close');
  const animations = [
    stage.animate(stageFrames, timing),
    backdrop.animate(backdropFrames, timing),
  ];
  if (closeButton instanceof HTMLElement) {
    animations.push(closeButton.animate([{opacity: 0}, {opacity: 1}], timing));
  }
  await Promise.all(animations.map((animation) => animation.finished.catch(() => undefined)));
}
