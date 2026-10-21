// Points along an SVG path for the particles of the Arrakis scales and spice fields (ArrakisParticles.vue).
// The particles run as Web Animations of transform and opacity on HTML elements: the browser moves those on the
// compositor. The SMIL animations used before cost two thirds of the main thread and made scrolling stutter
// (Jens, 21 Oct 2026).

export type TrackPoint = {x: number, y: number};

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
// Sample points per path: the paths are gentle arcs, so straight steps between them are not visible
const SAMPLES = 24;

let measuringGroup: SVGGElement | undefined;
let measuringPath: SVGPathElement | undefined;

// One hidden SVG for all measurements: path lengths are only available on paths inside the document
function measuringElements(): {group: SVGGElement, path: SVGPathElement} {
  if (measuringGroup === undefined || measuringPath === undefined || !measuringGroup.isConnected) {
    const svg = document.createElementNS(SVG_NAMESPACE, 'svg');
    svg.setAttribute('width', '0');
    svg.setAttribute('height', '0');
    svg.setAttribute('aria-hidden', 'true');
    svg.style.position = 'absolute';
    svg.style.visibility = 'hidden';
    measuringGroup = document.createElementNS(SVG_NAMESPACE, 'g');
    measuringPath = document.createElementNS(SVG_NAMESPACE, 'path');
    measuringGroup.appendChild(measuringPath);
    svg.appendChild(measuringGroup);
    document.body.appendChild(svg);
  }
  return {group: measuringGroup, path: measuringPath};
}

/**
 * Evenly spaced points along a path (equal length steps, so the pace stays constant like SMIL's paced motion);
 * an SVG transform of the path's group is applied to every point. Empty where the browser cannot measure (tests).
 */
export function trackPoints(path: string, transform?: string): Array<TrackPoint> {
  if (typeof document === 'undefined' || typeof SVGPathElement === 'undefined' || typeof SVGPathElement.prototype.getPointAtLength !== 'function') {
    return [];
  }
  const {group, path: element} = measuringElements();
  element.setAttribute('d', path);
  if (transform === undefined) {
    group.removeAttribute('transform');
  } else {
    group.setAttribute('transform', transform);
  }
  const matrix = group.transform.baseVal.consolidate()?.matrix;
  const length = element.getTotalLength();
  const points: Array<TrackPoint> = [];
  for (let index = 0; index <= SAMPLES; index++) {
    const point = element.getPointAtLength(length * index / SAMPLES);
    const placed = matrix === undefined ? point : point.matrixTransform(matrix);
    points.push({x: placed.x, y: placed.y});
  }
  return points;
}
