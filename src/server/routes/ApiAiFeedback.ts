import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {RouteError} from './RouteError';
import {readBody} from './readBody';
import {IGame} from '../IGame';
import {IPlayer} from '../IPlayer';
import {AiFeedbackStore} from '../aiFeedback/AiFeedbackStore';
import {aiPlayerOfLine} from '../aiFeedback/aiLogLines';
import {AiFeedbackRequest, isAiFeedbackRating, MAX_AI_FEEDBACK_TEXT} from '../../common/ai/AiFeedback';

/**
 * Ratings of AI decisions in analysis games.
 * GET ?id=<participant>: all ratings of the game (every player sees everyone's ratings).
 * POST ?id=<human player>: rate one AI line (or remove the own rating), answers with all ratings.
 */
export class ApiAiFeedback extends Handler {
  public static readonly INSTANCE = new ApiAiFeedback();
  private constructor(private readonly store: () => AiFeedbackStore = () => AiFeedbackStore.getInstance()) {
    super();
  }

  private static notAnalysisGame(game: IGame): RouteError {
    return RouteError.badRequest(`Game ${game.id} is no analysis game: AI decisions can only be rated when "Analysis game" was switched on when creating it.`);
  }

  public override async get(_req: Request, res: Response, ctx: Context): Promise<void> {
    const id = ctx.urlParams.participantId('id');
    const game = await ctx.gameLoader.getGame(id);
    if (game === undefined) {
      throw RouteError.notFound(`No game found for participant ${id}: it was deleted or never existed.`);
    }
    responses.writeJson(res, ctx, game.gameOptions.aiAnalysis === true ? this.store().get(game.id) : []);
  }

  public override async post(req: Request, res: Response, ctx: Context): Promise<void> {
    const playerId = ctx.urlParams.playerId('id');
    ctx.ipTracker.addParticipant(playerId, ctx.ip);
    const game = await ctx.gameLoader.getGame(playerId);
    if (game === undefined) {
      throw RouteError.notFound(`No game found for player ${playerId}: it was deleted or never existed.`);
    }
    let player: IPlayer;
    try {
      player = game.getPlayerById(playerId);
    } catch {
      throw RouteError.notFound(`Player ${playerId} is not part of game ${game.id}.`);
    }
    if (player.aiLevel !== undefined) {
      throw RouteError.badRequest('AI players cannot rate decisions.');
    }
    if (game.gameOptions.aiAnalysis !== true) {
      throw ApiAiFeedback.notAnalysisGame(game);
    }

    let request: AiFeedbackRequest;
    try {
      request = JSON.parse(await readBody(req, 10_000));
    } catch {
      throw RouteError.badRequest('The rating could not be read (invalid JSON).');
    }
    const message = game.gameLog.find((line) => line.id !== undefined && line.id === request.messageId);
    if (message === undefined) {
      throw RouteError.badRequest(`Log line ${String(request.messageId)} does not exist in game ${game.id} (maybe removed by an undo).`);
    }
    if (aiPlayerOfLine(game, message) === undefined) {
      throw RouteError.badRequest(`Log line ${message.id} is no AI line: only AI decisions can be rated.`);
    }
    if (request.rating !== undefined && !isAiFeedbackRating(request.rating)) {
      throw RouteError.badRequest(`Unknown rating ${String(request.rating)}: use flag, up or down.`);
    }
    const text = typeof request.text === 'string' ? request.text.trim().slice(0, MAX_AI_FEEDBACK_TEXT) : '';
    this.store().set(game.id, message.id ?? '', player.color, request.rating === undefined ? undefined : {
      messageId: message.id ?? '',
      decisionId: message.aiDecisionId,
      color: player.color,
      name: player.name,
      rating: request.rating,
      text,
      at: Date.now(),
    });
    responses.writeJson(res, ctx, this.store().get(game.id));
  }
}
