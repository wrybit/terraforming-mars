import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {NewGameConfig} from '../../common/game/NewGameConfig';
import {BoardPreviewModel} from '../../common/models/BoardPreviewModel';
import {Game} from '../Game';
import {GameSetup} from '../GameSetup';
import {ApiCreateGame} from './ApiCreateGame';
import {boardRandom, pickBoard} from '../boards/newGameBoard';
import {boardSpaceModels} from '../boards/boardSpaceModels';

/**
 * Board preview of the "Create game" page: takes the same request as creating the game and builds the board
 * the same way (same options, same board seed), so the preview matches the game exactly.
 */
export class ApiBoardPreview extends Handler {
  public static readonly INSTANCE = new ApiBoardPreview();
  private constructor() {
    super();
  }

  public static preview(gameReq: NewGameConfig): BoardPreviewModel {
    const boardRng = boardRandom(gameReq.boardSeed);
    const gameOptions = Game.resolveOptions(ApiCreateGame.gameOptions(gameReq, pickBoard(gameReq.board, boardRng)));
    const board = GameSetup.newBoard(gameOptions, boardRng);
    return {boardName: gameOptions.boardName, spaces: boardSpaceModels(board)};
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    let gameReq: NewGameConfig;
    try {
      gameReq = JSON.parse(await readBody(req)) as NewGameConfig;
    } catch {
      throw RouteError.badRequest('invalid request');
    }
    if (gameReq?.expansions === undefined) {
      throw RouteError.badRequest('invalid request');
    }
    responses.writeJson(res, ctx, ApiBoardPreview.preview(gameReq));
  }
}
