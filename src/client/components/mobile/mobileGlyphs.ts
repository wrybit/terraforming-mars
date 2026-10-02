/* Symbole der Mobil-Ansicht (Fußleiste, Zug-Sheet) als SVG-Bausteine im 24er-Raster: eine Formensprache für alle,
   und Outline und gefüllte Form teilen denselben Umriss. */

export type SvgShape = {
  tag: 'circle' | 'path' | 'rect';
  attributes: Record<string, string>;
};

export type Glyph = {
  // Ebenen von hinten nach vorn; vordere Ebenen verdecken, was dahinter liegt
  layers: ReadonlyArray<ReadonlyArray<SvgShape>>;
  // Details: als Linie gezeichnet bzw. in der gefüllten Form ausgespart
  details: ReadonlyArray<SvgShape>;
};

export type GlyphName = 'mars' | 'hand' | 'players' | 'log' | 'rocket' |
  'cardActions' | 'playCard' | 'standardProjects' | 'sellPatents' | 'greenery' | 'temperature' | 'milestone' | 'award' | 'colonyTrade' | 'more' |
  'newGame' | 'rules' | 'statistics' | 'cardsList' | 'boardGame' | 'about' | 'updates' | 'discord';

const circle = (cx: number, cy: number, r: number): SvgShape => ({tag: 'circle', attributes: {cx: String(cx), cy: String(cy), r: String(r)}});
const path = (d: string): SvgShape => ({tag: 'path', attributes: {d}});
// Kleiner gefüllter Punkt (Listenpunkte); Inline-Style, weil die Linien-Klasse sonst fill: none setzt
const dot = (cx: number, cy: number): SvgShape => ({tag: 'circle', attributes: {cx: String(cx), cy: String(cy), r: '1.1', style: 'fill: currentColor'}});
const rect = (x: number, y: number, width: number, height: number, radius: number): SvgShape =>
  ({tag: 'rect', attributes: {x: String(x), y: String(y), width: String(width), height: String(height), rx: String(radius)}});
const HEXAGON = 'M12 2.5l8.2 4.75v9.5L12 21.5l-8.2-4.75v-9.5z';
const card = (x: number, rotation: string): SvgShape =>
  ({tag: 'rect', attributes: {x: String(x), y: '4.75', width: '10', height: '14.5', rx: '1.8', transform: rotation}});

export const GLYPHS: Record<GlyphName, Glyph> = {
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
  // Zug-Sheet: Motive angelehnt an die früheren Bilder der Kacheln
  cardActions: {layers: [[path('M9.5 7h10M9.5 12h10M9.5 17h10')]], details: [dot(5, 7), dot(5, 12), dot(5, 17)]},
  playCard: {layers: [[{tag: 'rect', attributes: {x: '5', y: '2.5', width: '14', height: '19', rx: '2.2'}}]], details: [circle(12, 8.8, 3), path('M8.5 15h7M8.5 18h4.5')]},
  standardProjects: {layers: [[path(HEXAGON)]], details: [path('M12 8.5v7M8.5 12h7')]},
  sellPatents: {layers: [[path('M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2z')]], details: [path('M10.2 9.2L12.6 7.5v9.5M10.2 17h4.8')]},
  greenery: {layers: [[path(HEXAGON)]], details: [path('M8.5 15.5c0-4 3-6.8 7-6.8 0 4-3 6.8-7 6.8zM8.5 15.5l3.4-3.4')]},
  temperature: {layers: [[path('M10 13.8V5a2 2 0 014 0v8.8a4.2 4.2 0 11-4 0z')]], details: [path('M12 9.5v6.5')]},
  milestone: {layers: [[path('M6 21.5V3M6 4h12l-2.8 4.5L18 13H6')]], details: []},
  award: {layers: [[circle(12, 9, 5.5)]], details: [path('M9 13.8l-1.5 7.7 4.5-2.4 4.5 2.4-1.5-7.7')]},
  colonyTrade: {layers: [[circle(12, 12, 5.2)]], details: [path('M3.5 15.5c-1.2-2 3-5.2 8.5-6.9s10-1.9 11 0-3 5.2-8.5 6.9-9.8 2-11 0z')]},
  more: {layers: [[{tag: 'rect', attributes: {x: '3.5', y: '3.5', width: '17', height: '17', rx: '4'}}]], details: [dot(8, 12), dot(12, 12), dot(16, 12)]},
  // Startseite (StartScreen.vue): je Menüpunkt ein Symbol, nur einlagig, weil Abdeckungen auf dem Foto-Hintergrund auffielen
  newGame: {layers: [[circle(12, 12, 8.5)]], details: [path('M12 8v8M8 12h8')]},
  rules: {layers: [[path('M3.5 5.5c2.8-1.4 5.7-1.4 8.5 0 2.8-1.4 5.7-1.4 8.5 0v13c-2.8-1.4-5.7-1.4-8.5 0-2.8-1.4-5.7-1.4-8.5 0z')]], details: [path('M12 5.5v13')]},
  statistics: {layers: [[rect(4, 12, 4, 8.5, 1), rect(10, 7, 4, 13.5, 1), rect(16, 3.5, 4, 17, 1)]], details: []},
  cardsList: {layers: [[rect(3.5, 3.5, 7.5, 7.5, 1.6), rect(13, 3.5, 7.5, 7.5, 1.6), rect(3.5, 13, 7.5, 7.5, 1.6), rect(13, 13, 7.5, 7.5, 1.6)]], details: []},
  boardGame: {layers: [[rect(3.5, 3.5, 17, 17, 3.5)]], details: [dot(8, 8), dot(16, 8), dot(12, 12), dot(8, 16), dot(16, 16)]},
  about: {layers: [[circle(12, 12, 8.5)]], details: [path('M12 11v5.5'), dot(12, 7.8)]},
  updates: {layers: [[path('M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z')]], details: []},
  discord: {
    layers: [[path('M6.5 4h11A2.5 2.5 0 0120 6.5v8a2.5 2.5 0 01-2.5 2.5H11l-4.5 3.5V17A2.5 2.5 0 014 14.5v-8A2.5 2.5 0 016.5 4z')]],
    details: [dot(8.5, 10.5), dot(12, 10.5), dot(15.5, 10.5)],
  },
};
