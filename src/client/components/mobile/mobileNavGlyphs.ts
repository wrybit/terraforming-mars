/* Symbole der Fußleiste als SVG-Bausteine (24er-Raster), damit Outline und gefüllte Form denselben Umriss teilen. */

export type SvgShape = {
  tag: 'circle' | 'path' | 'rect';
  attributes: Record<string, string>;
};

export type NavGlyph = {
  // Ebenen von hinten nach vorn; vordere Ebenen verdecken, was dahinter liegt
  layers: ReadonlyArray<ReadonlyArray<SvgShape>>;
  // Details: als Linie gezeichnet bzw. in der gefüllten Form ausgespart
  details: ReadonlyArray<SvgShape>;
};

export type NavGlyphName = 'mars' | 'hand' | 'players' | 'log' | 'rocket';

const circle = (cx: number, cy: number, r: number): SvgShape => ({tag: 'circle', attributes: {cx: String(cx), cy: String(cy), r: String(r)}});
const path = (d: string): SvgShape => ({tag: 'path', attributes: {d}});
const card = (x: number, rotation: string): SvgShape =>
  ({tag: 'rect', attributes: {x: String(x), y: '4.75', width: '10', height: '14.5', rx: '1.8', transform: rotation}});

export const NAV_GLYPHS: Record<NavGlyphName, NavGlyph> = {
  mars: {layers: [[circle(12, 12, 8.5)]], details: [circle(9, 9.5, 1.7), circle(14.8, 14.2, 2.3), circle(14.6, 7.6, 0.9)]},
  hand: {layers: [[card(3.5, 'rotate(-12 8.5 12)')], [card(10, 'rotate(9 15 12)')]], details: []},
  players: {
    layers: [
      [circle(16.6, 8.4, 2.7), path('M13.5 20c0-3.6 1.6-6.4 3.6-6.4 2.4 0 4.4 2.8 4.4 6.4z')],
      [circle(9, 8, 3.3), path('M2.8 20c0-3.6 2.8-6.3 6.2-6.3s6.2 2.7 6.2 6.3z')],
    ],
    details: [],
  },
  log: {layers: [[{tag: 'rect', attributes: {x: '4.5', y: '3', width: '15', height: '18', rx: '2.2'}}]], details: [path('M8.5 8h7M8.5 12h7M8.5 16h4.5')]},
  rocket: {
    layers: [[path('M12 2.5c2.8 1.9 4.5 5.2 4.5 9V16l-1.8 2.5H9.3L7.5 16v-4.5c0-3.8 1.7-7.1 4.5-9z')]],
    details: [circle(12, 10, 1.8), path('M7.5 13.5L4.5 16.5v3l3-1.5M16.5 13.5l3 3v3l-3-1.5M10.5 21.5h3')],
  },
};
