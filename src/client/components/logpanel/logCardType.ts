import {CardType} from '@/common/cards/CardType';

// Card type -> colour class of the log (chips in text lines, type stripe in action rows)
export const cardTypeToCss: Record<CardType, string | undefined> = {
  event: 'background-color-events',
  corporation: 'background-color-corporation',
  active: 'background-color-active',
  automated: 'background-color-automated',
  prelude: 'background-color-prelude',
  ceo: 'background-color-ceo',
  standard_project: 'background-color-standard-project',
  standard_action: 'background-color-standard-project',
  proxy: undefined,
};

// Party name -> image name in assets/parties ('Mars First' -> 'mars-first')
export function partySlug(party: string | undefined): string {
  return (party ?? '').toLowerCase().replace(/\s+/g, '-');
}
