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

// Breiten: Name fest, Wertung fest, nur Waren und Tags teilen sich den freien Platz.
// Trenner-Spalten sind breiter als die Abstände innerhalb eines Abschnitts (Gesetz der Nähe).
const NAME_WIDTH = '196px';
const DIVIDER_WIDTH = '12px';
const TAG_GROUP_GAP = '6px';
const PLAYED_CARDS_WIDTH = '48px';
const GOODS_TRACK = 'minmax(70px, 1fr)';
const TAG_TRACK = 'minmax(23px, 1fr)';
const SCORE_TRACK = '34px';
export const GOODS_COUNT = 6;
export const SCORE_COUNT = 4;

export function columnTemplate(visibility: SectionVisibility, tagColumns: TagColumnGroups): string {
  const tracks = [NAME_WIDTH];
  if (visibility.goods) {
    tracks.push(DIVIDER_WIDTH, `repeat(${GOODS_COUNT}, ${GOODS_TRACK})`);
  }
  if (visibility.tags && tagColumns.length > 0) {
    tracks.push(DIVIDER_WIDTH, tagColumns.map((group) => `repeat(${group.length}, ${TAG_TRACK})`).join(` ${TAG_GROUP_GAP} `));
  }
  if (visibility.score) {
    tracks.push(DIVIDER_WIDTH, `repeat(${SCORE_COUNT}, ${SCORE_TRACK})`);
  }
  // Kartenanzahl immer sichtbar, mit eigenem Trenner
  tracks.push(DIVIDER_WIDTH, PLAYED_CARDS_WIDTH);
  return tracks.join(' ');
}
