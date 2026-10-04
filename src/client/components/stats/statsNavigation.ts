import {paths} from '@/common/app/paths';
import {isStatsKind, StatsKind} from './statsKinds';

// Every statistics view has its own address: links can be shared, browser back works.
export type StatsTab = 'overview' | 'games' | 'players' | 'corporation' | 'prelude' | 'card' | 'combinations' | 'milestone' | 'award' | 'board' | 'records';

export const STATS_TABS: ReadonlyArray<{tab: StatsTab, label: string}> = [
  {tab: 'overview', label: 'Overview'},
  {tab: 'games', label: 'Games'},
  {tab: 'players', label: 'Players'},
  {tab: 'corporation', label: 'Corporations'},
  {tab: 'prelude', label: 'Prelude cards'},
  {tab: 'card', label: 'Project cards'},
  {tab: 'combinations', label: 'Combinations'},
  {tab: 'milestone', label: 'Milestones'},
  {tab: 'award', label: 'Awards'},
  {tab: 'board', label: 'Boards'},
  {tab: 'records', label: 'Records'},
];

/** Kinds whose most played the overview shows and that can be expanded to the top-20 page. */
export type StatsTopKind = Extract<StatsKind, 'card' | 'corporation'>;
const TOP_KINDS: ReadonlyArray<StatsTopKind> = ['card', 'corporation'];

export type StatsView =
  {type: 'tab', tab: StatsTab} |
  {type: 'detail', kind: StatsKind, name: string} |
  {type: 'top', kind: StatsTopKind};

/** Tab belonging to a view: detail page → its list, top 20 → overview. */
export function tabOfView(view: StatsView): StatsTab {
  if (view.type === 'tab') {
    return view.tab;
  }
  return view.type === 'top' ? 'overview' : tabOfKind(view.kind);
}

/** List a detail page belongs to (player → players tab). */
export function tabOfKind(kind: StatsKind): StatsTab {
  return kind === 'player' ? 'players' : kind;
}

export function statsHref(view: StatsView): string {
  const params = new URLSearchParams(
    view.type === 'tab' ? {tab: view.tab} :
      view.type === 'top' ? {top: view.kind} :
        {kind: view.kind, name: view.name});
  return `${paths.STATS}?${params.toString()}`;
}

export function parseStatsView(search: string): StatsView {
  const params = new URLSearchParams(search);
  const kind = params.get('kind');
  const name = params.get('name');
  if (isStatsKind(kind) && name !== null) {
    return {type: 'detail', kind, name};
  }
  const top = TOP_KINDS.find((kind) => kind === params.get('top'));
  if (top !== undefined) {
    return {type: 'top', kind: top};
  }
  const tab = STATS_TABS.find((entry) => entry.tab === params.get('tab'));
  return {type: 'tab', tab: tab?.tab ?? 'overview'};
}
