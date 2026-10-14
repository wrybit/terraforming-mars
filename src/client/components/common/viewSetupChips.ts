import {ViewModel} from '@/common/models/PlayerModel';
import {Expansion} from '@/common/cards/GameModule';
import {splitAiMarker} from '@/common/ai/AiLevel';
import {setupOptionsFromGame} from '@/common/game/GameSetupOptions';
import {boardChip, expansionChips, GameSetupChip, optionChips, seatChips} from '@/client/components/common/gameSetupChips';
import {boardLabel} from '@/client/components/stats/statsLabels';

// Setup chips of a running or finished game, read from what the server sends to a player:
// the feedback summary and the results page build them here, so both show the same.
export function viewSetupChips(view: ViewModel): Array<GameSetupChip> {
  const players = view.players;
  const options = view.game.gameOptions;
  // AI players carry their marker in the name (AiLevel.ts)
  const aiCount = players.filter((player) => splitAiMarker(player.name).marker !== undefined).length;
  const isActive = (expansion: Expansion) => options.expansions[expansion] === true;
  return [
    ...seatChips(players.length - aiCount, aiCount),
    boardChip(options.boardName, {label: boardLabel(options.boardName)}),
    ...expansionChips(isActive),
    ...optionChips(setupOptionsFromGame(options), isActive, players.length),
  ];
}
