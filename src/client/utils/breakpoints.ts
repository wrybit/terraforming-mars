/*
 * Layout breakpoints for script code. Contract with src/styles/breakpoints.less (same names, same values);
 * tests/client/utils/breakpoints.spec.ts checks both sides against each other.
 */

export const BREAKPOINTS = {
  // Very narrow phones (320 px)
  compactPhone: 360,
  // Phone → tablet
  tablet: 600,
  // Narrow → wide page layouts
  wide: 1024,
  // Two-column desktop layout
  desktop: 1280,
  // Landscape below this height is a phone
  shortHeight: 600,
} as const;

/* Media query for "narrower than the breakpoint" (same as the @below-… variables in breakpoints.less). */
export function belowWidth(breakpoint: number): string {
  return `(max-width: ${breakpoint - 1}px)`;
}

/* Media query for "at least the breakpoint wide" (same as the @from-… variables in breakpoints.less). */
export function fromWidth(breakpoint: number): string {
  return `(min-width: ${breakpoint}px)`;
}
