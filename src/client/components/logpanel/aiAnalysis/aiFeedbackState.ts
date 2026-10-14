import {markRaw, reactive} from 'vue';
import {paths} from '@/common/app/paths';
import {ParticipantId} from '@/common/Types';
import {AiFeedbackEntry, AiFeedbackRating, AiFeedbackRequest} from '@/common/ai/AiFeedback';
import {AiDecisionSummary} from '@/common/ai/AiDecisionSummary';
import {ViewModel} from '@/common/models/PlayerModel';
import {AiLogTarget} from './aiLogTarget';

// Ratings of the current analysis game and the open rating dialog. Module state: the game view
// remounts on updates (every AI move), the dialog lives in App.vue and must survive that.

type OpenDialog = {
  target: AiLogTarget,
  decision: AiDecisionSummary | undefined,
  // All AI rows of the log in order and the decisions by id: the dialog steps to the previous/next one
  targets: ReadonlyArray<AiLogTarget>,
  summaries: ReadonlyMap<string, AiDecisionSummary>,
  // Snapshot of the view the row was opened in (player names, own colour, participant id)
  viewModel: ViewModel,
  // Rating clicked in the hover bar: preselected in the dialog
  rating: AiFeedbackRating | undefined,
};

type State = {
  participantId: ParticipantId | undefined,
  ratings: Array<AiFeedbackEntry>,
  dialog: OpenDialog | undefined,
  // Error of the last save, shown in the dialog
  error: string | undefined,
};

export const aiFeedbackState = reactive<State>({
  participantId: undefined,
  ratings: [],
  dialog: undefined,
  error: undefined,
});

/** Loads all ratings of the game (everyone sees everyone's ratings). */
export async function loadAiFeedback(participantId: ParticipantId): Promise<void> {
  if (aiFeedbackState.participantId !== participantId) {
    aiFeedbackState.participantId = participantId;
    aiFeedbackState.ratings = [];
  }
  try {
    const response = await fetch(`${paths.API_AI_FEEDBACK}?id=${participantId}`);
    if (response.ok) {
      aiFeedbackState.ratings = await response.json();
    }
  } catch {
    // Ratings are an extra: the log works without them, the next update tries again
  }
}

/** Saves (or with rating undefined removes) the own rating of a line; throws the server's reason. */
export async function saveAiFeedback(participantId: ParticipantId, request: AiFeedbackRequest): Promise<void> {
  const response = await fetch(`${paths.API_AI_FEEDBACK}?id=${participantId}`, {method: 'POST', body: JSON.stringify(request)});
  if (!response.ok) {
    throw new Error(await response.text());
  }
  aiFeedbackState.ratings = await response.json();
}

export function ratingsOf(messageId: string): Array<AiFeedbackEntry> {
  return aiFeedbackState.ratings.filter((entry) => entry.messageId === messageId);
}

export function openAiDecision(target: AiLogTarget, targets: ReadonlyArray<AiLogTarget>, summaries: ReadonlyMap<string, AiDecisionSummary>,
  viewModel: ViewModel, rating?: AiFeedbackRating): void {
  aiFeedbackState.error = undefined;
  const decision = target.decisionId === undefined ? undefined : summaries.get(target.decisionId);
  aiFeedbackState.dialog = markRaw({target, decision, targets, summaries, viewModel, rating});
}

/** Position of the open row among all AI rows, or -1. */
export function openAiDecisionIndex(): number {
  const dialog = aiFeedbackState.dialog;
  return dialog === undefined ? -1 : dialog.targets.findIndex((target) => target.messageId === dialog.target.messageId);
}

/** Opens the previous (-1) or next (+1) AI row; at the ends nothing happens. */
export function stepAiDecision(step: -1 | 1): void {
  const dialog = aiFeedbackState.dialog;
  const next = dialog?.targets[openAiDecisionIndex() + step];
  if (dialog !== undefined && next !== undefined) {
    openAiDecision(next, dialog.targets, dialog.summaries, dialog.viewModel);
  }
}

export function closeAiDecision(): void {
  aiFeedbackState.dialog = undefined;
}
