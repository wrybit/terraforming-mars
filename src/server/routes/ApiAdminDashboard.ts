import * as path from 'path';
import * as responses from '../server/responses';
import {Handler} from './Handler';
import {Context} from './IHandler';
import {Request} from '../Request';
import {Response} from '../Response';
import {DashboardDeployRun, DashboardMachineUsage, DashboardUpstream, DEPLOY_STATE_FILE, MACHINE_USAGE_FILE, ServerDashboard, UPSTREAM_COMMITS_FILE} from '../../common/admin/ServerDashboard';
import {DashboardSection, DashboardSectionData} from '../../common/admin/dashboardSections';
import {assertNever} from '../../common/utils/utils';
import {Phase} from '../../common/Phase';
import {IGame} from '../IGame';
import {activeParticipantCount} from '../server/activeParticipants';
import {isSecureRequest} from '../server/auth/adminCookie';
import {systemMetrics} from '../admin/dashboard/systemMetrics';
import {diskUsage} from '../admin/dashboard/diskUsage';
import {readOperatorFile} from '../admin/dashboard/operatorFile';
import {playerActivity} from '../admin/dashboard/playerActivity';
import {gameActivity} from '../admin/dashboard/playerActivityOfGames';
import {UptimeRecord} from '../admin/dashboard/uptimeRecord';
import {presenceRecord} from '../admin/dashboard/presenceRecord';
import {pendingUpdateRequest} from '../admin/dashboard/updateRequest';
import {withoutAiTrainingGames} from '../aiTraining/aiTrainingGameIds';
import {isAiOnlyGame} from '../aiTraining/aiOnlyGames';
import {checkReachability, publicStatusUrl} from '../admin/dashboard/reachability';
import raw_settings from '../../genfiles/settings.json';
import recentCommits from '../../genfiles/recentCommits.json';
import {rustAiSupport} from '../ai/aiEngineChoice';
import {rustFallbackLog} from '../ai/rust/rustFallbackLog';

// Values the server runs with (like every setting: a change applies after the restart)
function serverLogo(hostname: string): ServerDashboard['identity'] {
  const name = process.env.SERVER_LOGO_NAME?.trim() || process.env.SERVER_NAME?.trim() || hostname;
  const imageUrl = process.env.SERVER_LOGO_IMAGE?.trim() || undefined;
  return {name, imageUrl};
}

/**
 * Machine, game and deployment values for the admin dashboard (like a small phpSysInfo for this server), one part per
 * route (dashboardSections.ts): the slow parts (saved games, own public address) must not hold back the fast ones.
 */
export class ApiAdminDashboard extends Handler {
  public static forSection(section: DashboardSection): ApiAdminDashboard {
    return new ApiAdminDashboard(section);
  }

  constructor(private readonly section: DashboardSection, private readonly uptimeRecord: UptimeRecord = new UptimeRecord()) {
    super({validateServerId: true});
  }

  public override async get(req: Request, res: Response, ctx: Context): Promise<void> {
    responses.writeJson(res, ctx, await this.sectionData(req, ctx));
  }

  private async sectionData(req: Request, ctx: Context): Promise<DashboardSectionData[DashboardSection]> {
    const dataFolder = path.resolve('db');
    const nowMs = Date.now();
    switch (this.section) {
    case 'machine': {
      const metrics = await systemMetrics(dataFolder);
      const machine: DashboardSectionData['machine'] = {
        ...metrics,
        identity: serverLogo(metrics.host.hostname),
        disk: metrics.disk === undefined ? undefined : {...metrics.disk, usage: diskUsage(dataFolder, process.env.AI_DECISION_LOG_DIR)},
        // Measured every minute: older than five minutes means the script stopped
        machineUsage: readOperatorFile<DashboardMachineUsage>(dataFolder, MACHINE_USAGE_FILE, 5 * 60 * 1000, nowMs),
        rustAi: rustAiInfo(),
      };
      return machine;
    }
    case 'reachability': {
      const host = req.headers.host ?? 'localhost';
      return {reachability: await checkReachability(publicStatusUrl(host, isSecureRequest(req)))};
    }
    case 'games': {
      const games = await humanGames(ctx);
      return {
        games: {
          running: games.filter((game) => game.phase !== Phase.END).length,
          finished: games.filter((game) => game.phase === Phase.END).length,
        },
        activity: playerActivity(games.map(gameActivity), nowMs),
      };
    }
    case 'history':
      return {
        presence: presenceRecord.profiles(nowMs),
        availability: this.uptimeRecord.availability(nowMs),
        serverStarts: this.uptimeRecord.read().starts,
        rustFallbacks: rustFallbackLog.summary(),
      };
    case 'deploy':
      return {
        build: {head: raw_settings.head, builtAt: raw_settings.builtAt},
        commits: recentCommits,
        // Written at every update check (every 5 minutes): older than half an hour means the script stopped
        upstream: readOperatorFile<DashboardUpstream>(dataFolder, UPSTREAM_COMMITS_FILE, 30 * 60 * 1000, nowMs),
        updateRequest: pendingUpdateRequest(dataFolder, nowMs),
        // Also written every 5 minutes; a build takes a few minutes, so half an hour old means the script died
        deployRun: readOperatorFile<DashboardDeployRun>(dataFolder, DEPLOY_STATE_FILE, 30 * 60 * 1000, nowMs),
        playersOnline: activeParticipantCount(),
      };
    default:
      return assertNever(this.section);
    }
  }
}

/** Saved games with a human player: AI training games are only for watching from the lobby (aiTrainingGameIds.ts). */
async function humanGames(ctx: Context): Promise<Array<IGame>> {
  const games: Array<IGame> = [];
  for (const {gameId} of withoutAiTrainingGames(await ctx.gameLoader.getIds())) {
    const game = await ctx.gameLoader.getGame(gameId);
    // A broken game state must not break the dashboard; games without a human belong to the AI training (aiOnlyGames.ts)
    if (game !== undefined && !isAiOnlyGame(game)) {
      games.push(game);
    }
  }
  return games;
}

/** Version of the installed Rust AI for the server card; undefined when this server has none. */
function rustAiInfo(): ServerDashboard['rustAi'] {
  const support = rustAiSupport();
  if (support.botVersion === undefined && support.aiVersion === undefined) {
    return undefined;
  }
  return {version: support.aiVersion, commit: support.botVersion, generated: support.generated};
}
