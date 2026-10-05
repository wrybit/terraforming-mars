import {ComputedRef, InjectionKey} from 'vue';
import {Color} from '@/common/Color';
import {GameOptionsModel} from '@/common/models/GameOptionsModel';
import {OtherDeckSizesModel} from '@/common/models/GameModel';

// Everything the game menu (GameMenu.vue) shows or passes on to its dialogs. PlayerHome provides it once;
// the menu button sits deep inside the players table header and the setup turn order, so it is injected
// instead of being passed through every component in between.
export type GameMenuContext = {
  playerName: string;
  playerColor: Color;
  deckSize: number;
  discardPileSize: number;
  coloniesCount: number;
  gameOptions: GameOptionsModel;
  playerNumber: number;
  lastSoloGeneration: number;
  otherDeckSizes: OtherDeckSizesModel;
  spectatorId?: string;
  expectedPurgeTimeMs?: number;
};

export const GAME_MENU_CONTEXT: InjectionKey<ComputedRef<GameMenuContext>> = Symbol('gameMenuContext');
