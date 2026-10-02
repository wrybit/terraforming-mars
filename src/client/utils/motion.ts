// Shared motion basics of all zoom/fly animations (board zoom, card zoom, dialogs, start page),
// so every animation feels the same and respects the system setting for reduced motion.

// Fast start, soft landing
export const ZOOM_EASING = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// jsdom (tests) does not know Web Animations
export function supportsWebAnimations(element: Element): boolean {
  return typeof element.animate === 'function';
}
