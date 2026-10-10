import {BoardName} from '@/common/boards/BoardName';

// Colored hexagon of a board (create_game_form.less): board tiles and summary of the create form,
// setup chips of the statistics. Random board options get the multicolored hexagon.
// Takes board names and the random board options of the form alike
export function boardColorClass(boardName: string): string {
  switch (boardName) {
  case BoardName.THARSIS:
    return 'create-game-board-hexagon create-game-tharsis';
  case BoardName.HELLAS:
    return 'create-game-board-hexagon create-game-hellas';
  case BoardName.ELYSIUM:
    return 'create-game-board-hexagon create-game-elysium';
  case BoardName.UTOPIA_PLANITIA:
    return 'create-game-board-hexagon create-game-utopia-planitia';
  case BoardName.VASTITAS_BOREALIS_NOVA:
    return 'create-game-board-hexagon create-game-vastitas-borealis-nova';
  case BoardName.AMAZONIS:
    return 'create-game-board-hexagon create-game-amazonis';
  case BoardName.ARABIA_TERRA:
    return 'create-game-board-hexagon create-game-arabia-terra';
  case BoardName.TERRA_CIMMERIA:
    return 'create-game-board-hexagon create-game-terra-cimmeria';
  case BoardName.VASTITAS_BOREALIS:
    return 'create-game-board-hexagon create-game-vastitas-borealis';
  case BoardName.HOLLANDIA:
    return 'create-game-board-hexagon create-game-hollandia';
  default:
    return 'create-game-board-hexagon create-game-random';
  }
}
