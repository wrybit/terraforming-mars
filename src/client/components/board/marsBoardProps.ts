import {GameModel} from '@/common/models/GameModel';
import {TileView} from '@/client/components/board/TileView';

// Props of the Mars board (Board.vue) from the game model. Shared by every place that shows Mars and its
// enlargement (game view, end screen), so the small and the large board always get the same data.
export function marsBoardProps(game: GameModel, tileView: TileView) {
  return {
    spaces: game.spaces,
    expansions: game.gameOptions.expansions,
    venusScaleLevel: game.venusScaleLevel,
    boardName: game.gameOptions.boardName,
    oceans_count: game.oceans,
    oxygen_level: game.oxygenLevel,
    temperature: game.temperature,
    altVenusBoard: game.gameOptions.altVenusBoard,
    aresData: game.aresData,
    tileView,
  };
}
