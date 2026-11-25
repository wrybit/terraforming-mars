import {AiBlocker} from '@/common/ai/aiCompatibility';
import {AiSupport, EMPTY_AI_SUPPORT} from '@/common/ai/aiSupportContract';
import {AiBlockerChip, aiBlockerChip} from '@/client/components/create/aiBlockerChip';

/** One setting with whether each AI program plays it. */
export type AiSupportMatrixRow = {chip: AiBlockerChip, typescript: boolean, rust: boolean};
/** One block of the overview: its rows and how many of them both programs play. */
export type AiSupportMatrixGroup = {title: string, rows: Array<AiSupportMatrixRow>, both: number};

type Kind = AiBlocker['kind'];

// The base game is always part of what an AI plays; it is in no list
const BASE_GAME_CHIP: AiBlockerChip = {key: 'expansion:base', label: 'Base game', iconClass: 'create-game-expansion-icon expansion-icon-base'};

function idsOf(support: AiSupport, kind: Kind): ReadonlyArray<string> {
  switch (kind) {
  case 'expansion': return support.expansions;
  case 'board': return support.boards;
  case 'option': return support.options;
  case 'duneModule': return support.duneModules;
  // Setups beyond the support file (aiSetupLimits.ts) are no rows of the overview
  case 'setup': return [];
  }
}

// Union of both lists; rows both programs play come first, so the gaps stand together at the end
function rowsOf(typescript: AiSupport, rust: AiSupport, kind: Kind): Array<AiSupportMatrixRow> {
  const typescriptIds = idsOf(typescript, kind);
  const rustIds = idsOf(rust, kind);
  const ids = [...typescriptIds, ...rustIds.filter((id) => !typescriptIds.includes(id))];
  const rows = ids.map((id) => ({
    // The id comes from the list of this kind, so it fits the blocker of that kind
    chip: aiBlockerChip({kind, id} as AiBlocker),
    typescript: typescriptIds.includes(id),
    rust: rustIds.includes(id),
  }));
  const rank = (row: AiSupportMatrixRow) => row.typescript && row.rust ? 0 : 1;
  return rows.sort((a, b) => rank(a) - rank(b));
}

function group(title: string, rows: Array<AiSupportMatrixRow>): AiSupportMatrixGroup {
  return {title, rows, both: rows.filter((row) => row.typescript && row.rust).length};
}

/**
 * Expansions, options, boards and Dune modules of both programs side by side (Dune only where the game has modules).
 * Without a Rust bot (`rust` undefined) the Rust AI plays nothing, not even the base game.
 */
export function aiSupportMatrix(typescript: AiSupport, rustOrNothing: AiSupport | undefined): {expansions: AiSupportMatrixGroup, options: AiSupportMatrixGroup, boards: AiSupportMatrixGroup, duneModules?: AiSupportMatrixGroup} {
  const rust = rustOrNothing ?? EMPTY_AI_SUPPORT;
  const duneRows = rowsOf(typescript, rust, 'duneModule');
  return {
    expansions: group('Expansions', [{chip: BASE_GAME_CHIP, typescript: true, rust: rustOrNothing !== undefined}, ...rowsOf(typescript, rust, 'expansion')]),
    options: group('Options', rowsOf(typescript, rust, 'option')),
    boards: group('Boards', rowsOf(typescript, rust, 'board')),
    duneModules: duneRows.length === 0 ? undefined : group('Dune expansion', duneRows),
  };
}
