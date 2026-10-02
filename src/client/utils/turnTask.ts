import {Phase} from '@/common/Phase';

// Current task for the tab title: short label (English translation key) plus emoji.
// The phase is enough for that and is as reliable for every input as the input itself.
export type TurnTask = {label: string, icon: string};

// One table for all tasks, so label and emoji can never drift apart.
const TASKS = {
  draft: {label: 'Draft', icon: '🃏'},
  opening: {label: 'Opening', icon: '🚀'},
  buying: {label: 'Buying', icon: '🛒'},
  prelude: {label: 'Prelude', icon: '📜'},
  ceo: {label: 'CEO', icon: '👔'},
  play: {label: 'Play', icon: '▶️'},
  production: {label: 'Production', icon: '🏭'},
  solar: {label: 'Solar phase', icon: '☀️'},
  fallback: {label: 'Your turn', icon: '🔔'},
} as const satisfies Record<string, TurnTask>;

export function turnTask(game: {phase: Phase, generation: number}): TurnTask {
  switch (game.phase) {
  case Phase.INITIALDRAFTING:
  case Phase.DRAFTING:
    return TASKS.draft;
  case Phase.RESEARCH:
    // In the first generation you choose corporation, preludes and cards at the same time.
    return game.generation === 1 ? TASKS.opening : TASKS.buying;
  case Phase.PRELUDES:
    return TASKS.prelude;
  case Phase.CEOS:
    return TASKS.ceo;
  case Phase.ACTION:
    return TASKS.play;
  case Phase.PRODUCTION:
    return TASKS.production;
  case Phase.SOLAR:
    return TASKS.solar;
  default:
    return TASKS.fallback;
  }
}
