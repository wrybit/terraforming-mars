import * as path from 'path';
import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {ServerDashboard} from '../../common/admin/ServerDashboard';
import {Phase} from '../../common/Phase';
import {IGame} from '../IGame';
import {activeParticipantCount} from '../server/activeParticipants';
import {isSecureRequest} from '../server/auth/adminCookie';
import {sizeOnDisk, systemMetrics} from '../admin/dashboard/systemMetrics';
import {playerActivity} from '../admin/dashboard/playerActivity';
import {gameActivity} from '../admin/dashboard/playerActivityOfGames';
import {UptimeRecord} from '../admin/dashboard/uptimeRecord';
import {checkReachability, publicStatusUrl} from '../admin/dashboard/reachability';
import raw_settings from '../../genfiles/settings.json';
import recentCommits from '../../genfiles/recentCommits.json';

/** Machine, game and deployment values for the admin dashboard (like a small phpSysInfo for this server). */
export class ApiAdminDashboard extends Handler {
  public static readonly INSTANCE = new ApiAdminDashboard();
  constructor(private readonly uptimeRecord: UptimeRecord = new UptimeRecord()) {
    super({validateServerId: true});
  }

  public override async get(req: Request, res: Response, ctx: Context): Promise<void> {
    const dataFolder = path.resolve('db');
    const games: Array<IGame> = [];
    for (const {gameId} of await ctx.gameLoader.getIds()) {
      const game = await ctx.gameLoader.getGame(gameId);
      // A broken game state must not break the dashboard
      if (game !== undefined) {
        games.push(game);
      }
    }
    const nowMs = Date.now();
    const host = req.headers.host ?? 'localhost';
    const [metrics, reachability] = await Promise.all([
      systemMetrics(dataFolder),
      checkReachability(publicStatusUrl(host, isSecureRequest(req))),
    ]);
    const decisionLogFolder = process.env.AI_DECISION_LOG_DIR;
    const dashboard: ServerDashboard = {
      generatedAtMs: nowMs,
      ...metrics,
      storage: {
        // The whole data folder: works for SQLite (game.db) and the file database (one file per save)
        databaseBytes: sizeOnDisk(dataFolder),
        decisionLogBytes: decisionLogFolder ? sizeOnDisk(decisionLogFolder) : undefined,
      },
      games: {
        running: games.filter((game) => game.phase !== Phase.END).length,
        finished: games.filter((game) => game.phase === Phase.END).length,
        playersOnline: activeParticipantCount(),
      },
      activity: playerActivity(games.map(gameActivity), nowMs),
      availability: this.uptimeRecord.availability(nowMs),
      serverStarts: this.uptimeRecord.read().starts,
      reachability,
      build: {head: raw_settings.head, builtAt: raw_settings.builtAt},
      commits: recentCommits,
    };
    responses.writeJson(res, ctx, dashboard);
  }
}
