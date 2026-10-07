import {translateText, translateTextWithParams} from '@/client/directives/i18n';
import {CONTENT_KEYS, ContentKey, TraitKey} from '@/common/game/expansionFacts';
import {expansionContents} from './expansionContents';
import {ExpansionTile} from './expansionGrouping';

// Second line of an expansion tile: what the expansion adds, e.g. "Own board · 49 cards · 5 corps".

/** One part of the content line; `highlighted` marks the content the current grouping is about. */
export type ContentLinePart = {
  text: string;
  highlighted: boolean;
};

// Count labels (English, translated with the number as parameter): singular and plural
const UNITS: Readonly<Record<ContentKey, [string, string]>> = {
  project: ['${0} card', '${0} cards'],
  corporation: ['${0} corp', '${0} corps'],
  prelude: ['${0} prelude', '${0} preludes'],
  ceo: ['${0} CEO', '${0} CEOs'],
  globalEvent: ['${0} global event', '${0} global events'],
  colonyTile: ['${0} colony tile', '${0} colony tiles'],
  standardProject: ['${0} standard project', '${0} standard projects'],
  award: ['${0} award', '${0} awards'],
  milestone: ['${0} milestone', '${0} milestones'],
};

/** Parts of the content line of `tile`: traits first, then counts by size; the highlighted part leads. */
export function contentLine(tile: ExpansionTile, highlight: ContentKey | TraitKey | undefined, withSource: boolean): Array<ContentLinePart> {
  const contents = expansionContents(tile.module);
  const parts: Array<ContentLinePart & {weight: number}> = [];
  if (contents.traits.has('ownBoard')) {
    parts.push({text: translateText('Board'), highlighted: highlight === 'ownBoard', weight: Number.MAX_SAFE_INTEGER});
  }
  if (contents.traits.has('newParameters')) {
    parts.push({text: translateText('New parameters'), highlighted: highlight === 'newParameters', weight: Number.MAX_SAFE_INTEGER});
  }
  // Colony tiles are counted below; other tiles have no count and are named instead
  if (contents.tiles !== undefined && contents.counts.colonyTile === undefined) {
    parts.push({text: translateText(contents.tiles), highlighted: highlight === 'newTiles', weight: Number.MAX_SAFE_INTEGER});
  }
  for (const key of CONTENT_KEYS) {
    const count = contents.counts[key];
    if (count !== undefined) {
      const unit = UNITS[key][count === 1 ? 0 : 1];
      const highlighted = highlight === key || (key === 'colonyTile' && highlight === 'newTiles');
      parts.push({text: translateTextWithParams(unit, [String(count)]), highlighted, weight: count});
    }
  }
  parts.sort((a, b) => Number(b.highlighted) - Number(a.highlighted) || b.weight - a.weight);
  const result: Array<ContentLinePart> = parts.map(({text, highlighted}) => ({text, highlighted}));
  // Grouped other than by source: the source moves into the line
  if (withSource) {
    result.unshift({text: translateText(tile.official ? 'Official' : 'Fan-made'), highlighted: false});
  }
  return result;
}
