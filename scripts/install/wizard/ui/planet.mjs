// The planet of the header, computed instead of drawn by hand: a lit sphere with a dark canyon band.
// Quarter blocks (▗ ▟ …) smooth the rim; every cell gets the shade of the light falling on it.
import {PLANET_SHADES, colorEnabled, paint} from './theme.mjs';

const QUARTER_BLOCKS = [' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛', '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█'];
const LIGHT = normalize([-0.6, -0.5, 0.62]);
const SAMPLES = 4;
// Without colors the light is shown by block density instead
const DENSITY = ['░', '░', '▒', '▒', '▓', '█'];

function normalize(vector) {
  const length = Math.hypot(...vector);
  return vector.map((value) => value / length);
}

/** Which of the four quarters of a cell lie inside the circle (bit mask for QUARTER_BLOCKS). */
function quarterMask(row, column, rows, columns) {
  let mask = 0;
  for (const [bit, quarterY, quarterX] of [[1, 0, 0], [2, 0, 1], [4, 1, 0], [8, 1, 1]]) {
    let inside = 0;
    for (let sampleY = 0; sampleY < SAMPLES; sampleY++) {
      for (let sampleX = 0; sampleX < SAMPLES; sampleX++) {
        const y = ((row + (quarterY + (sampleY + 0.5) / SAMPLES) / 2) / rows) * 2 - 1;
        const x = ((column + (quarterX + (sampleX + 0.5) / SAMPLES) / 2) / columns) * 2 - 1;
        inside += x * x + y * y <= 1 ? 1 : 0;
      }
    }
    if (inside / (SAMPLES * SAMPLES) > 0.5) {
      mask |= bit;
    }
  }
  return mask;
}

function brightness(row, column, rows, columns) {
  const y = ((row + 0.5) / rows) * 2 - 1;
  const x = ((column + 0.5) / columns) * 2 - 1;
  const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
  let light = Math.max(0, x * LIGHT[0] + y * LIGHT[1] + z * LIGHT[2]);
  // Canyon band across the middle, like Valles Marineris
  if (Math.abs(y - 0.05 - 0.25 * x) < 0.12 && x > -0.5 && x < 0.6) {
    light *= 0.6;
  }
  return light;
}

/** Planet as lines of colored text, `rows` high and `columns` wide (about twice as wide as high looks round). */
export function planetLines(rows = 8, columns = 18) {
  const lines = [];
  for (let row = 0; row < rows; row++) {
    let line = '';
    for (let column = 0; column < columns; column++) {
      const mask = quarterMask(row, column, rows, columns);
      if (mask === 0) {
        line += ' ';
        continue;
      }
      const level = Math.min(PLANET_SHADES.length - 1, Math.floor(brightness(row, column, rows, columns) * PLANET_SHADES.length));
      const character = !colorEnabled && mask === 15 ? DENSITY[level] : QUARTER_BLOCKS[mask];
      line += paint(PLANET_SHADES[level], character);
    }
    lines.push(line);
  }
  return lines;
}
