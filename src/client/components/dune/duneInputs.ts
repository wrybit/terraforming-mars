import {Component} from 'vue';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PlayerViewModel} from '@/common/models/PlayerModel';
import {WORM_TITLE} from '@/common/dune/duneActionTitles';
import WormMoveInput from './WormMoveInput.vue';

// Inputs of the Dune modules with their own picture instead of the plain input (PlayerInputFactory.vue, and the move
// panel of the module tabs). Only in a Dune game with the data the picture needs, so Mars never meets them.
export function duneInputComponent(input: PlayerInputModel, playerView: PlayerViewModel): Component | undefined {
  const title = typeof input.title === 'string' ? input.title : input.title.message;
  if (input.type === 'or' && title === WORM_TITLE && (playerView.game?.dune?.worm?.choices?.length ?? 0) > 0) {
    return WormMoveInput;
  }
  return undefined;
}
