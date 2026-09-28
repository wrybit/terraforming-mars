import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {ActionLabel} from '@/client/components/overview/ActionLabel';
import {InterfaceTagsType} from '@/client/components/overview/playerTagDetails';

// Spielerliste als Tabelle im Zwei-Spalten-Layout: Abschnitte, gespeicherte Schalter und Spaltenraster.
// Alle Zeilen (Kopf und Spieler) nutzen dasselbe Raster, damit die Spalten untereinander stehen.

export const TABLE_SECTIONS = ['goods', 'tags', 'score'] as const;
export type TableSection = typeof TABLE_SECTIONS[number];
export type SectionVisibility = Record<TableSection, boolean>;

// Eine Zeile der Tabelle: Spieler plus das, was PlayersOverview schon für die klassische Leiste berechnet
export type PlayersTableRowModel = {
  player: PublicPlayerModel;
  firstForGen: boolean;
  actionLabel: ActionLabel;
  playerIndex: number;
};

// Sichtbare Tag-Spalten in Gruppen (Haupt-Tags | Sonder-Tags), wie in der klassischen Leiste durch einen Abstand getrennt
export type TagColumnGroups = Array<Array<InterfaceTagsType>>;

const STORAGE_KEY = 'players_table_sections';
const PREFERRED_STORAGE_KEY = 'players_table_preferred';
const DEFAULT_VISIBILITY: SectionVisibility = {goods: true, tags: true, score: true};

// Schalterstellung überlebt das Neuladen; fehlt der Speicher (privates Fenster), gilt einfach alles an
export function loadSectionVisibility(): SectionVisibility {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    return {...DEFAULT_VISIBILITY, ...stored};
  } catch {
    return {...DEFAULT_VISIBILITY};
  }
}

export function saveSectionVisibility(visibility: SectionVisibility): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visibility));
  } catch {
    // Ohne Speicher gilt die Einstellung nur bis zum Neuladen
  }
}

// Zuletzt eingeschalteter Abschnitt: fällt bei Platzmangel als letzter weg (der letzte Klick gewinnt)
export function loadPreferredSection(): TableSection | undefined {
  try {
    const stored = localStorage.getItem(PREFERRED_STORAGE_KEY);
    return TABLE_SECTIONS.find((section) => section === stored);
  } catch {
    return undefined;
  }
}

export function savePreferredSection(section: TableSection | undefined): void {
  try {
    if (section === undefined) {
      localStorage.removeItem(PREFERRED_STORAGE_KEY);
    } else {
      localStorage.setItem(PREFERRED_STORAGE_KEY, section);
    }
  } catch {
    // Ohne Speicher gilt die Einstellung nur bis zum Neuladen
  }
}

// Breiten: Name fest, Wertung fest, nur Waren und Tags teilen sich den freien Platz.
// Trenner-Spalten sind breiter als die Abstände innerhalb eines Abschnitts (Gesetz der Nähe).
const NAME_WIDTH = 196;
const DIVIDER_WIDTH = 12;
const TAG_GROUP_GAP = 6;
const PLAYED_CARDS_WIDTH = 48;
const GOODS_MIN_WIDTH = 70;
const TAG_MIN_WIDTH = 23;
const SCORE_WIDTH = 34;
export const GOODS_COUNT = 6;
export const SCORE_COUNT = 4;

const px = (value: number) => `${value}px`;

export function columnTemplate(visibility: SectionVisibility, tagColumns: TagColumnGroups): string {
  const divider = px(DIVIDER_WIDTH);
  const tracks = [px(NAME_WIDTH)];
  if (visibility.goods) {
    tracks.push(divider, `repeat(${GOODS_COUNT}, minmax(${px(GOODS_MIN_WIDTH)}, 1fr))`);
  }
  if (visibility.tags && tagColumns.length > 0) {
    tracks.push(divider, tagColumns.map((group) => `repeat(${group.length}, minmax(${px(TAG_MIN_WIDTH)}, 1fr))`).join(` ${px(TAG_GROUP_GAP)} `));
  }
  if (visibility.score) {
    tracks.push(divider, `repeat(${SCORE_COUNT}, ${px(SCORE_WIDTH)})`);
  }
  // Kartenanzahl immer sichtbar, mit eigenem Trenner
  tracks.push(divider, px(PLAYED_CARDS_WIDTH));
  return tracks.join(' ');
}

// Mindestbreite des Rasters – dieselben Maße wie columnTemplate
export function minimumWidth(visibility: SectionVisibility, tagColumns: TagColumnGroups): number {
  let width = NAME_WIDTH + DIVIDER_WIDTH + PLAYED_CARDS_WIDTH;
  if (visibility.goods) {
    width += DIVIDER_WIDTH + GOODS_COUNT * GOODS_MIN_WIDTH;
  }
  if (visibility.tags && tagColumns.length > 0) {
    const tagCount = tagColumns.reduce((sum, group) => sum + group.length, 0);
    width += DIVIDER_WIDTH + tagCount * TAG_MIN_WIDTH + (tagColumns.length - 1) * TAG_GROUP_GAP;
  }
  if (visibility.score) {
    width += DIVIDER_WIDTH + SCORE_COUNT * SCORE_WIDTH;
  }
  return width;
}

// Reihenfolge, in der Abschnitte bei zu schmaler Spalte wegfallen: Waren sind am wichtigsten und bleiben am längsten
const AUTO_HIDE_ORDER: Array<TableSection> = ['tags', 'score', 'goods'];

export type FittedVisibility = {
  visibility: SectionVisibility;
  // Abschnitte, die nur aus Platzgründen ausgeblendet sind
  autoHidden: Array<TableSection>;
};

// Passt die gewünschte Sichtbarkeit an die verfügbare Breite an; unbekannte Breite (0) ändert nichts.
// Der bevorzugte (zuletzt eingeschaltete) Abschnitt fällt als letzter weg.
export function fitToWidth(wanted: SectionVisibility, tagColumns: TagColumnGroups, availableWidth: number, preferred?: TableSection): FittedVisibility {
  const visibility = {...wanted};
  const autoHidden: Array<TableSection> = [];
  if (availableWidth <= 0) {
    return {visibility, autoHidden};
  }
  const order = [...AUTO_HIDE_ORDER.filter((section) => section !== preferred), ...(preferred ? [preferred] : [])];
  for (const section of order) {
    if (minimumWidth(visibility, tagColumns) <= availableWidth) {
      break;
    }
    if (visibility[section]) {
      visibility[section] = false;
      autoHidden.push(section);
    }
  }
  return {visibility, autoHidden};
}
