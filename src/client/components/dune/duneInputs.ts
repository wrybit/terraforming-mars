import {Component} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {SMUGGLE_TITLE, WORM_TITLE} from '@/common/dune/duneActionTitles';
import WormMoveInput from './WormMoveInput.vue';
import SmuggleInput from './SmuggleInput.vue';

// Inputs of the Dune modules with their own picture instead of the plain input (PlayerInputFactory.vue, and the move
// panel of the module tabs). Only in a Dune game with the data the picture needs, so Mars never meets them.
export function duneInputComponent(input: PlayerInputModel, playerView: PlayerViewModel): Component | undefined {
  const title = typeof input.title === 'string' ? input.title : input.title.message;
  if (input.type === 'or' && title === WORM_TITLE && (playerView.game?.dune?.worm?.choices?.length ?? 0) > 0) {
    return WormMoveInput;
  }
  if (isSmugglingTab(input)) {
    return SmuggleInput;
  }
  return undefined;
}

// The smuggling tab (trade or bribe, SmuggleInput.vue): one choice of the server whose button depends on the chosen
// move, so the input brings its own button instead of the menu's
function isSmugglingTab(input: PlayerInputModel): boolean {
  return input.type === 'or' && (typeof input.title === 'string' ? input.title : input.title?.message) === SMUGGLE_TITLE;
}

/** Dune inputs that render their own save button (OrOptions.vue leaves its own out for them) */
export function duneInputHasOwnButton(input: PlayerInputModel): boolean {
  return isSmugglingTab(input);
}
