// Geometry of the committee as a hemicycle (TurmoilBoard.vue): one wedge per party around the chair,
// rows of seats for the delegates, the leader seat near the chair, party icon and markers at the rim.
export const HEMICYCLE_WIDTH = 1000;
export const HEMICYCLE_HEIGHT = 495;
const CENTER_X = 500;
const CENTER_Y = 0;
const INNER = 140;
const OUTER = 490;
const SEAT_ROWS = [{radius: 245, seats: 3}, {radius: 315, seats: 4}, {radius: 385, seats: 5}];
export const CHAIR_RADIUS = 118;
export const FIGURE_RATIO = 1.3; // astronaut pictures are 548 × 710

export type Point = {x: number, y: number};

function point(radius: number, degrees: number): Point {
  return {x: CENTER_X + radius * Math.cos(degrees * Math.PI / 180), y: CENTER_Y + radius * Math.sin(degrees * Math.PI / 180)};
}

export type Wedge = {
  path: string;
  middle: number;
  seats: Array<Point>;
  leader: Point;
  icon: Point;
  dominance: Point;
};

export function wedge(index: number, count: number): Wedge {
  const step = 180 / count;
  const from = 180 - index * step;
  const to = from - step;
  const middle = from - step / 2;
  const a = point(OUTER, from);
  const b = point(OUTER, to);
  const c = point(INNER, to);
  const d = point(INNER, from);
  const path = `M${a.x} ${a.y} A${OUTER} ${OUTER} 0 0 0 ${b.x} ${b.y} L${c.x} ${c.y} A${INNER} ${INNER} 0 0 1 ${d.x} ${d.y} Z`;
  const seats = SEAT_ROWS.flatMap((row) => Array.from({length: row.seats}, (_, seat) => point(row.radius, from - step * (seat + 1) / (row.seats + 1))));
  return {path, middle, seats, leader: point(190, middle), icon: point(448, middle), dominance: point(448, middle + step * 0.32)};
}

export function chairPath(): string {
  return `M${CENTER_X - CHAIR_RADIUS} ${CENTER_Y} A${CHAIR_RADIUS} ${CHAIR_RADIUS} 0 0 0 ${CENTER_X + CHAIR_RADIUS} ${CENTER_Y} Z`;
}

export const CHAIR_CENTER: Point = {x: CENTER_X, y: CENTER_Y};
export const GRADIENT_RADIUS = OUTER;
