import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {isArrakisBoard} from '@/common/dune/arrakisLayout';

const OFFICIAL_BOARDS = [
  BoardName.THARSIS,
  BoardName.HELLAS,
  BoardName.ELYSIUM,
  BoardName.UTOPIA_PLANITIA,
  BoardName.VASTITAS_BOREALIS_NOVA,
  BoardName.TERRA_CIMMERIA_NOVA,
];

export function boardOptions(board: RandomBoardOption): Array<BoardName> {
  // The Arrakis boards belong to the Dune theme only, never to a random pool
  const allBoards = Object.values(BoardName).filter((name) => !isArrakisBoard(name));

  switch (board) {
  case RandomBoardOption.ALL:
    return allBoards;
  case RandomBoardOption.OFFICIAL:
    return OFFICIAL_BOARDS;
  default:
    throw new Error('Unknown random board option :' + board);
  }
}
