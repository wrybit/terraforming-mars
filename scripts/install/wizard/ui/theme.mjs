// Colors of the installer in one place: purple = active, white = text, orange = info and design, gray = hints.
// Uses true color where the terminal supports it, otherwise the nearest of the 256 standard colors.

const COLORS = {
  orange: '#ff8a3d',
  purple: '#b57bff',
  white: '#f2f2f2',
  gray: '#8a8a8a',
  red: '#ff5f5f',
};

/** Planet shades from the lit side (orange) to the night side (dark purple). */
export const PLANET_SHADES = ['#3a1d5c', '#5b2a86', '#8a3a9c', '#c2477a', '#e8622c', '#ff9a4a'];

export const colorEnabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;
const trueColor = /truecolor|24bit/i.test(process.env.COLORTERM ?? '') ||
  ['iTerm.app', 'vscode', 'WezTerm', 'ghostty'].includes(process.env.TERM_PROGRAM ?? '') ||
  Boolean(process.env.WT_SESSION);

function channels(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Nearest color of the 6×6×6 cube of the 256-color palette. */
function paletteIndex([red, green, blue]) {
  const step = (channel) => Math.round((channel / 255) * 5);
  return 16 + 36 * step(red) + 6 * step(green) + step(blue);
}

function foreground(hex) {
  const rgb = channels(hex);
  return trueColor ? `\x1b[38;2;${rgb.join(';')}m` : `\x1b[38;5;${paletteIndex(rgb)}m`;
}

/** Text in a color given as #rrggbb; no escape codes without color support. */
export function paint(hex, text) {
  return colorEnabled ? `${foreground(hex)}${text}\x1b[39m` : String(text);
}

function named(hex) {
  return (text) => paint(hex, text);
}

export const style = {
  orange: named(COLORS.orange),
  purple: named(COLORS.purple),
  white: named(COLORS.white),
  gray: named(COLORS.gray),
  red: named(COLORS.red),
  bold: (text) => (colorEnabled ? `\x1b[1m${text}\x1b[22m` : String(text)),
};
