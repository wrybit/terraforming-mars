import {AiDecisionOption, AiDecisionSummary} from '@/common/ai/AiDecisionSummary';
import {translateText} from '@/client/directives/i18n';

// Readable options of an AI decision for the rating dialog (labels come from the AI's decision trace).

export type OptionGroup = {
  /** Heading (English key) or undefined for a single list. */
  title: string | undefined,
  options: Array<AiDecisionOption>,
};

const GROUP_TITLES: Record<NonNullable<AiDecisionOption['group']>, string> = {
  corporation: 'Corporations',
  prelude: 'Preludes',
  project: 'Project cards',
};

/** Heading of the decision by its kind; the trace title has unfilled placeholders. */
export const DECISION_KIND_TITLES: Record<string, string> = {
  initial: 'Starting selection',
  draft: 'Draft pick',
  research: 'Card purchase',
  action: 'Action',
  space: 'Tile placement',
};

/** Card names may carry a suffix (standard projects: "City:SP"); the log shows them without. */
function cardText(name: string): string {
  return translateText(name.split(':')[0]);
}

/** "Standard projects: City:SP" → both parts translated; card options show their translated name. */
export function optionLabel(option: AiDecisionOption): string {
  if (option.card !== undefined) {
    return cardText(option.card);
  }
  const separator = option.label.indexOf(': ');
  if (separator === -1) {
    return cardText(option.label);
  }
  return `${translateText(option.label.slice(0, separator))}: ${cardText(option.label.slice(separator + 2))}`;
}

/** Start selection grouped by corporation, preludes and project cards, each by value; otherwise one list. */
export function optionGroups(summary: AiDecisionSummary): Array<OptionGroup> {
  const byValue = (a: AiDecisionOption, b: AiDecisionOption) => (b.value ?? -Infinity) - (a.value ?? -Infinity);
  if (summary.options.some((option) => option.group !== undefined)) {
    return (['corporation', 'prelude', 'project'] as const)
      .map((group) => ({title: GROUP_TITLES[group], options: summary.options.filter((option) => option.group === group).sort(byValue)}))
      .filter((group) => group.options.length > 0);
  }
  return summary.options.length === 0 ? [] : [{title: undefined, options: [...summary.options].sort(byValue)}];
}

export function formatValue(value: number | undefined): string {
  if (value === undefined) {
    return '';
  }
  const rounded = Math.round(value * 10) / 10;
  return (rounded > 0 ? '+' : '') + rounded.toFixed(1);
}
