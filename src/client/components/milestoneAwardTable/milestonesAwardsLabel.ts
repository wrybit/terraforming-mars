// Title of milestones & awards wherever both appear under one heading (mobile players toggle, desktop log tab):
// built from the two existing translations, so every language gets it without a new string
export const MILESTONES_AWARDS_LABELS = ['Milestones', 'Awards'] as const;

export function milestonesAwardsLabel(translate: (text: string) => string): string {
  return MILESTONES_AWARDS_LABELS.map((label) => translate(label)).join(' & ');
}
