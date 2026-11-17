import {translateTextWithParams, $t} from '@/client/directives/i18n';

// Decision log of a self-play game of the new AI: one record line of the training data (tools/selfplayTs.ts in the
// lab, record format 4). Only the fields the page shows are typed; the raw block shows everything else.

export type DecisionMove = {
  kind: string;
  cards?: ReadonlyArray<string>;
  corporation?: string;
  preludes?: ReadonlyArray<string>;
  space?: string;
  color?: string;
  index?: number;
  option?: string;
  card?: string;
  project?: string;
  name?: string;
  payment?: Record<string, number>;
};

export type DecisionCandidate = {
  move: DecisionMove;
  mean: number | null;
  rollouts: number;
  adjustment?: number;
  pairedDeviation?: number | null;
};

export type DecisionPlayer = {
  points: number;
  tr: number;
  stock: ReadonlyArray<number>;
  production: ReadonlyArray<number>;
  hand: ReadonlyArray<string>;
  played: ReadonlyArray<string>;
};

export type DecisionTrace = {
  player: number;
  generation: number;
  kind: string;
  followUp?: boolean;
  candidates: ReadonlyArray<DecisionCandidate>;
  chosen: number;
  searchBest?: number | null;
  rule?: number | null;
  explored?: boolean;
  milliseconds?: number;
  offered?: {cards?: ReadonlyArray<string>};
  players: ReadonlyArray<DecisionPlayer>;
};

export type DecisionRecord = {
  scores: ReadonlyArray<number>;
  corporations: ReadonlyArray<string>;
  generation: number;
  setup?: string;
  botVersion?: string;
  rollouts?: number;
  decisions: ReadonlyArray<{title?: string, traces: ReadonlyArray<DecisionTrace>}>;
};

/** Kinds of decisions in the order of the filter chips */
export const DECISION_KINDS = ['initial', 'draft', 'research', 'action', 'space', 'cards', 'other'] as const;
const KIND_LABELS: Record<string, string> = {
  initial: 'Game start', draft: 'Draft round', research: 'Buying cards', action: 'Action', space: 'Board space', cards: 'Cards', other: 'Choice',
};
/** Name of a seat: all players of a self-play game are the new AI */
export const seatName = (seat: number): string => translateTextWithParams('AI ${0}', [String(seat + 1)]);

export const kindLabel = (kind: string): string => $t(KIND_LABELS[kind] ?? kind);

/** Value of an option as the search compares it: mean of the rollouts plus the correction of the TS rules */
export function optionValue(candidate: DecisionCandidate): number | null {
  return candidate.mean === null || candidate.mean === undefined ? null : candidate.mean + (candidate.adjustment ?? 0);
}

/** Measuring error of the gap to the best option: paired spread over the square root of the rollouts */
export function gapError(candidate: DecisionCandidate): number | undefined {
  return candidate.pairedDeviation ? candidate.pairedDeviation / Math.sqrt(candidate.rollouts) : undefined;
}

/** good: played the clear best; close: within the measuring error; drop: clearly worse; single: nothing to compare */
export type RatingTone = 'good' | 'close' | 'drop' | 'single';
export type DecisionRating = {tone: RatingTone, label: string};

const fixed = (value: number) => value.toFixed(1);

export function rateDecision(trace: DecisionTrace): DecisionRating {
  const searched = trace.candidates.filter((candidate) => candidate.mean !== null && candidate.rollouts > 1);
  if (searched.length < 2) {
    return {tone: 'single', label: $t('one option')};
  }
  const best = trace.searchBest ?? trace.chosen;
  const bestValue = optionValue(trace.candidates[best]) ?? 0;
  const chosen = trace.candidates[trace.chosen];
  if (trace.chosen !== best) {
    const regret = bestValue - (optionValue(chosen) ?? 0);
    const error = gapError(chosen) ?? 0;
    const why = trace.explored ? 'tried out' : trace.rule === trace.chosen ? 'rule' : 'other';
    return {tone: regret > 2 * error ? 'drop' : 'close', label: `${$t(why)}: −${fixed(regret)} ± ${fixed(error)}`};
  }
  const second = searched.filter((candidate) => candidate !== chosen).sort((a, b) => (optionValue(b) ?? 0) - (optionValue(a) ?? 0))[0];
  const gap = bestValue - (optionValue(second) ?? 0);
  const error = gapError(second) ?? 0;
  const clear = gap > 2 * error;
  return {tone: clear ? 'good' : 'close', label: `${$t(clear ? 'clear' : 'narrow')} +${fixed(gap)} ± ${fixed(error)}`};
}

/** Piece of a move text: plain text, or a card name that shows the card on hover */
export type MovePart = {text: string, card?: string};

// Marks a parameter in the translated template, so card names can be cut out again afterwards
const MARK = '\u0001';

/**
 * Translated template with its parameters; a list parameter is a list of cards (comma separated, each with its hover).
 * The record keeps the English card names only: they are translated here, in the language of the page.
 */
function withParams(template: string, params: ReadonlyArray<string | ReadonlyArray<string>>): Array<MovePart> {
  const text = translateTextWithParams(template, params.map((_, index) => `${MARK}${index}${MARK}`));
  const parts: Array<MovePart> = [];
  text.split(MARK).forEach((piece, position) => {
    if (position % 2 === 0) {
      if (piece !== '') {
        parts.push({text: piece});
      }
      return;
    }
    const param = params[Number(piece)];
    if (typeof param === 'string') {
      parts.push({text: param});
      return;
    }
    parts.push(...cardParts(param));
  });
  return parts;
}

/** Card names in the language of the page, comma separated, each with its hover */
function cardParts(cards: ReadonlyArray<string>): Array<MovePart> {
  return cards.flatMap((card, index) => [...index > 0 ? [{text: ', '}] : [], {text: $t(card), card}]);
}

function paymentText(payment: Record<string, number> | undefined): string {
  const parts = [['megacredits', 'M€'], ['steel', 'steel'], ['titanium', 'titanium'], ['heat', 'heat']]
    .filter(([key]) => (payment?.[key] ?? 0) > 0).map(([key, unit]) => `${payment?.[key]} ${$t(unit)}`);
  return parts.length > 0 ? ` (${parts.join(' + ')})` : '';
}

const one = (name: string | undefined): ReadonlyArray<string> => name === undefined || name === '' ? [] : [name];

// Menu options of the TS game (English texts of OrOptions) and how a move of that option reads
const MENU_TEXTS: Record<string, (move: DecisionMove) => Array<MovePart>> = {
  'Play project card': (move) => [...withParams('plays ${0}', [one(move.card)]), {text: paymentText(move.payment)}],
  'Standard projects': (move) => [...withParams('Standard project ${0}', [$t(move.project ?? '')]), {text: paymentText(move.payment)}],
  'Pass': () => [{text: $t('passes')}],
  'End Turn': () => [{text: $t('ends the turn')}],
  'Convert plants': () => [{text: $t('greenery from plants')}],
  'Convert heat': () => [{text: $t('temperature from heat')}],
  'Claim a milestone': (move) => withParams('Milestone ${0}', [$t(move.name ?? '')]),
  'Fund an award': (move) => withParams('Award ${0}', [$t(move.name ?? '')]),
  'Sell patents': (move) => withParams('sells ${0}', [move.cards ?? []]),
  'Perform an action from a played card': (move) => withParams('action of ${0}', [one(move.cards?.[0])]),
};

/** Move as text pieces from the contract format (bot/contract.rs in the lab) */
export function moveParts(move: DecisionMove, kind: string): Array<MovePart> {
  switch (move.kind) {
  case 'initial':
    return withParams('${0} · ${1} · buys ${2}', [one(move.corporation), move.preludes ?? [], String(move.cards?.length ?? 0)]);
  case 'cards':
    if (kind === 'draft') {
      return withParams('takes ${0}', [one(move.cards?.[0])]);
    }
    if (kind === 'research') {
      return (move.cards?.length ?? 0) > 0 ? withParams('buys ${0}', [move.cards ?? []]) : [{text: $t('buys nothing')}];
    }
    return (move.cards?.length ?? 0) > 0 ? cardParts(move.cards ?? []) : [{text: $t('none')}];
  case 'space': return withParams('Space ${0}', [move.space ?? '']);
  case 'player': return withParams('Player ${0}', [$t(move.color ?? '')]);
  case 'index': return withParams('Option ${0}', [String((move.index ?? 0) + 1)]);
  case 'menu': return MENU_TEXTS[move.option ?? '']?.(move) ?? [{text: $t(move.option ?? '')}];
  default: return [{text: JSON.stringify(move)}];
  }
}

/** Move as plain text (search, tests) */
export const moveText = (move: DecisionMove, kind: string): string => moveParts(move, kind).map((part) => part.text).join('');

/** What kind of move it is, so the blocks can be told apart while scrolling (own background each) */
export type MoveCategory = 'start' | 'draft' | 'buy' | 'play' | 'standard' | 'sell' | 'cardAction' | 'claim' | 'convert' | 'space' | 'pass' | 'choice';
export const MOVE_CATEGORIES: ReadonlyArray<MoveCategory> = ['start', 'draft', 'buy', 'play', 'standard', 'sell', 'cardAction', 'claim', 'convert', 'space', 'pass', 'choice'];
export const MOVE_CATEGORY_LABELS: Record<MoveCategory, string> = {
  start: 'Game start', draft: 'Draft round', buy: 'Buying cards', play: 'Playing a card', standard: 'Standard project', sell: 'Selling cards',
  cardAction: 'Card action', claim: 'Milestone or award', convert: 'Converting plants or heat', space: 'Board space', pass: 'Passing', choice: 'Choice',
};
const MENU_CATEGORIES: Record<string, MoveCategory> = {
  'Play project card': 'play', 'Standard projects': 'standard', 'Sell patents': 'sell', 'Pass': 'pass', 'End Turn': 'pass',
  'Claim a milestone': 'claim', 'Fund an award': 'claim', 'Convert plants': 'convert', 'Convert heat': 'convert',
  'Perform an action from a played card': 'cardAction',
};

export function moveCategory(trace: DecisionTrace): MoveCategory {
  const move = trace.candidates[trace.chosen].move;
  switch (trace.kind) {
  case 'initial': return 'start';
  case 'draft': return 'draft';
  case 'research': return 'buy';
  case 'space': return 'space';
  default: return move.kind === 'menu' ? MENU_CATEGORIES[move.option ?? ''] ?? 'choice' : 'choice';
  }
}

/** One row of the lanes: a decision of one player */
export type DecisionRow = {
  id: string;
  trace: DecisionTrace;
  /** TS question of the decision when the move alone does not say it (follow-up questions, "Option 2") */
  question: string;
  /** Players at the next decision of the game: what the played move really changed (undefined at the very end) */
  after?: ReadonlyArray<DecisionPlayer>;
};

export type GenerationSection = {generation: number, rows: Array<DecisionRow>};

/** Decisions grouped by generation, after the kind filter and the search */
export function generationSections(record: DecisionRecord, kinds: ReadonlySet<string>, query: string): Array<GenerationSection> {
  const sections: Array<GenerationSection> = [];
  const needle = query.trim().toLowerCase();
  // Every trace in game order, so a row knows the state at the next decision
  const order = record.decisions.flatMap((decision) => decision.traces);
  let position = -1;
  record.decisions.forEach((decision, decisionIndex) => decision.traces.forEach((trace, traceIndex) => {
    position++;
    if (!kinds.has(trace.kind)) {
      return;
    }
    const text = moveText(trace.candidates[trace.chosen].move, trace.kind);
    if (needle !== '' && !(text + ' ' + JSON.stringify(trace.offered ?? '')).toLowerCase().includes(needle)) {
      return;
    }
    let section = sections[sections.length - 1];
    if (section === undefined || section.generation !== trace.generation) {
      section = {generation: trace.generation, rows: []};
      sections.push(section);
    }
    const question = trace.followUp || trace.kind === 'other' || trace.kind === 'space' ? decision.title ?? '' : '';
    section.rows.push({id: `${decisionIndex}-${traceIndex}`, trace, question, after: order[position + 1]?.players});
  }));
  return sections;
}
