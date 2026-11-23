import {IPlayer} from '../../IPlayer';
import {PlayerInput} from '../../PlayerInput';
import {AiDecisionSummary} from '../../../common/ai/AiDecisionSummary';
import {
  DecisionKind, DecisionRecord, PlayerSnapshot, SERVER_VERSION, TracedOption,
  emitDecision, globalsOf, nextDecisionId, summaryOf, titleText,
} from '../decisionTrace';
import {possibleActionsOf} from '../possibleActions';
import {spaceName} from '../spaceName';
import {SpaceId} from '../../../common/Types';
import {ContractChoice} from './rustContract';

// Analysis games with the Rust AI: the bot's decision record (engine bot/record.rs, the same format its self-play
// writes for training) becomes what the TS AI gives the analysis log (options with values, the AI's situation) and a
// line in the decision log file. The raw record goes along, so later analyses and training can read everything the
// search knew. Without an analysis game the bot is not asked for it and gives only its move.

/** One option of the Rust search (bot/record.rs `candidates`). */
export type RustCandidate = {
  /** The option as contract choice (bot/contract.rs), the same shape as the moves of a chain. */
  move: ContractChoice,
  /** Mean result of the trial games: point lead over the best opponent (a win adds a bonus); absent when not searched. */
  mean?: number | null,
  /** Trial games played for this option. */
  rollouts?: number,
  /** Correction of a fixed rule on top of the mean (part of what the search compared). */
  adjustment?: number,
  prior?: number | null,
};

/** A decision record of the Rust bot (bot/record.rs `decision_record`); only the fields read here are typed. */
export type RustDecisionRecord = {
  kind: string,
  generation: number,
  candidates: Array<RustCandidate>,
  /** Index of the played candidate. */
  chosen: number,
  milliseconds?: number,
  [field: string]: unknown,
};

const KINDS: Record<string, DecisionKind> = {initial: 'initial', draft: 'draft', research: 'research', action: 'action', space: 'space'};

function names(value: unknown): Array<string> {
  return Array.isArray(value) ? value.map(String) : [];
}

/** Readable option in the style of the TS AI's labels (decisionLabels.ts): "Menu title: detail", card names as they are. */
export function contractLabel(move: ContractChoice, player: IPlayer): string {
  switch (move.kind) {
  case 'initial':
    return [move.corporation, ...names(move.preludes)].join(' + ') + ` | ${names(move.cards).join(', ') || '(keine)'}`;
  case 'cards':
    return names(move.cards).join(', ') || '(keine)';
  case 'projectCard':
    return String(move.card);
  case 'menu': {
    const detail = move.project ?? move.name ?? move.card ?? move.party ?? move.ware ?? move.amount ??
      (move.cards !== undefined ? names(move.cards).join(', ') : undefined) ?? move.trade?.colonyName;
    return detail === undefined ? String(move.option) : `${move.option}: ${detail}`;
  }
  case 'space':
    return spaceName(player.game, move.space as SpaceId);
  case 'player':
    return String(move.color);
  case 'amount':
    return String(move.amount);
  case 'amounts':
    return names(move.amounts).join(' / ');
  case 'title':
    return String(move.text);
  case 'colony':
    return String(move.colony);
  case 'party':
    return String(move.party);
  case 'resource':
    return String(move.resource);
  case 'payment':
    return Object.entries(move.payment ?? {}).filter(([, amount]) => Number(amount) > 0).map(([unit, amount]) => `${amount} ${unit}`).join(', ');
  case 'index':
    return `#${Number(move.index) + 1}`;
  default:
    return String(move.kind);
  }
}

/** The single card behind an option (draft pick, played card), so the analysis log shows it as a card. */
function singleCard(move: ContractChoice): string | undefined {
  if (move.kind === 'cards' && names(move.cards).length === 1) {
    return names(move.cards)[0];
  }
  return move.kind === 'projectCard' ? String(move.card) : undefined;
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

export function optionsOf(record: RustDecisionRecord, player: IPlayer): Array<TracedOption> {
  return record.candidates.map((candidate, index) => {
    // What the search compared: mean of the trial games plus the rule's correction; unsearched options have no value
    const searched = typeof candidate.mean === 'number' && (candidate.rollouts ?? 0) > 0;
    return {
      index,
      label: contractLabel(candidate.move, player),
      card: singleCard(candidate.move),
      value: searched ? round((candidate.mean as number) + (candidate.adjustment ?? 0)) : undefined,
      samples: searched ? candidate.rollouts : undefined,
      chosen: index === record.chosen,
    };
  });
}

/**
 * Summary for the analysis log and a line for the decision log file, from the first record of the chain (the
 * decision the input asked; follow-ups of the same input are in the raw records). `state` is taken before the move.
 */
export function rustDecisionSummary(player: IPlayer, input: PlayerInput, traces: ReadonlyArray<RustDecisionRecord> | undefined,
  state: PlayerSnapshot, saveId: number): AiDecisionSummary | undefined {
  const record = traces?.[0];
  if (record === undefined || !Array.isArray(record.candidates) || record.candidates.length === 0) {
    return undefined;
  }
  const game = player.game;
  const kind = KINDS[record.kind] ?? 'other';
  const options = optionsOf(record, player);
  const title = titleText(input);
  const decisionId = nextDecisionId(game);
  // The start selection is one option per combination here (TS: per card); summaryOf would keep only card options
  const summary = summaryOf(decisionId, kind === 'initial' ? 'other' : kind, title, options, saveId, game.generation, state);
  summary.kind = kind;
  summary.valueUnit = 'points';
  if (summary.state !== undefined && kind === 'action') {
    summary.state.possibleActions = possibleActionsOf(input);
  }
  const chosen = options[record.chosen];
  const line: DecisionRecord = {
    decisionId,
    playerId: player.id,
    aiLevel: player.aiLevel,
    serverVersion: SERVER_VERSION,
    gameId: game.id,
    generation: game.generation,
    phase: game.phase,
    player: player.name,
    color: player.color,
    kind,
    title,
    state,
    globals: globalsOf(player),
    options,
    chosen: chosen?.label ?? '',
    milliseconds: Math.round(record.milliseconds ?? 0),
    saveId,
    engine: 'rust',
    rustTraces: [...traces ?? []],
  };
  emitDecision(line);
  return summary;
}
