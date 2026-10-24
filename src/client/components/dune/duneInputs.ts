import {Component} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {CHOAM_TITLE, MENTAT_TITLE, SCHEMES_TITLE, SPY_VIEW_TITLE, WORM_TITLE} from '@/common/dune/duneActionTitles';
import WormMoveInput from './WormMoveInput.vue';
import ChoamExchangeInput from './ChoamExchangeInput.vue';
import SchemesKeepInput from './SchemesKeepInput.vue';
import MentatSwapInput from './MentatSwapInput.vue';
import SpyAgendasInput from './SpyAgendasInput.vue';

// Inputs of the Dune modules with their own picture instead of the plain input (PlayerInputFactory.vue, and the move
// panel of the module tabs). Only in a Dune game with the data the picture needs, so Mars never meets them.
export function duneInputComponent(input: PlayerInputModel, playerView: PlayerViewModel): Component | undefined {
  const title = typeof input.title === 'string' ? input.title : input.title.message;
  if (input.type === 'or' && title === WORM_TITLE && (playerView.game?.dune?.worm?.choices?.length ?? 0) > 0) {
    return WormMoveInput;
  }
  if (isChoamTab(input)) {
    return ChoamExchangeInput;
  }
  // House schemes: which agenda to keep, as the agenda cards (SchemesKeepInput.vue)
  if (input.type === 'or' && title === SCHEMES_TITLE && playerView.game?.dune?.schemes !== undefined) {
    return SchemesKeepInput;
  }
  // Mentat Calculation: own agendas above, top 3 of the deck below, as cards (MentatSwapInput.vue)
  if (isMentatSwap(input) && playerView.game?.dune?.schemes?.look?.kind === 'mentat') {
    return MentatSwapInput;
  }
  // Tleilaxu Spy: the other player's agenda cards (SpyAgendasInput.vue)
  if (input.type === 'option' && title === SPY_VIEW_TITLE && playerView.game?.dune?.schemes?.look?.kind === 'spy') {
    return SpyAgendasInput;
  }
  return undefined;
}

// Mentat Calculation: its buttons (keep, swap) belong to the picture
function isMentatSwap(input: PlayerInputModel): boolean {
  return input.type === 'or' && (typeof input.title === 'string' ? input.title : input.title?.message) === MENTAT_TITLE;
}

// The CHOAM tab (guild, prophecy, privilege, pacts, tribute; ChoamExchangeInput.vue): one choice of the server whose
// button depends on the chosen move, so the input brings its own button instead of the menu's
function isChoamTab(input: PlayerInputModel): boolean {
  return input.type === 'or' && (typeof input.title === 'string' ? input.title : input.title?.message) === CHOAM_TITLE;
}

/** Dune inputs that render their own save button (OrOptions.vue leaves its own out for them) */
export function duneInputHasOwnButton(input: PlayerInputModel): boolean {
  return isChoamTab(input) || isMentatSwap(input);
}
