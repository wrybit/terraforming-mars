import {Phase} from '@/common/Phase';

// Short name of the current task for the tab title ("Buy", "Play" …).
// The phase is enough for that and is as reliable for every input as the input itself.
// Returns the English translation key; translation happens at the caller.
export function turnTaskLabel(game: {phase: Phase, generation: number}): string {
  switch (game.phase) {
  case Phase.INITIALDRAFTING:
  case Phase.DRAFTING:
    return 'Draft';
  case Phase.RESEARCH:
    // In the first generation you choose corporation, preludes and cards at the same time.
    return game.generation === 1 ? 'Opening' : 'Buying';
  case Phase.PRELUDES:
    return 'Prelude';
  case Phase.CEOS:
    return 'CEO';
  case Phase.ACTION:
    return 'Play';
  case Phase.PRODUCTION:
    return 'Production';
  case Phase.SOLAR:
    return 'Solar phase';
  default:
    return 'Your turn';
  }
}
