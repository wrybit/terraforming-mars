import {Expansion} from '@/common/cards/GameModule';
import {LobbyRoomModel} from '@/common/lobby/LobbyModel';
import {boardChip, expansionChips, GameSetupChip, optionChips} from '@/client/components/common/gameSetupChips';
import {translateText} from '@/client/directives/i18n';

// Setup chips of a lobby game: the same chips as the create form's summary and the statistics (gameSetupChips.ts)
export function lobbySetupChips(room: LobbyRoomModel): Array<GameSetupChip> {
  const setup = room.setup;
  const isActive = (expansion: Expansion) => setup.expansions[expansion] === true;
  const board = setup.randomBoard || setup.boards.length === 0 ?
    boardChip('random', {label: translateText('Random board')}) :
    boardChip(setup.boards[0]);
  return [...expansionChips(isActive), board, ...optionChips(setup.options, isActive, room.seats.length)];
}
