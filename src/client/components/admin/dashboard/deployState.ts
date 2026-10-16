import {DashboardCommit, ServerDashboard} from '@/common/admin/ServerDashboard';
import {translateText, translateTextWithParams} from '@/client/directives/i18n';

export type CommitRow = {
  commit: DashboardCommit,
  /** The commit this server runs */
  live: boolean,
};

export type DeployState = {
  rows: Array<CommitRow>,
  /**
   * Commits on the deploy branch newer than the running build: 0 = up to date; undefined if unknown (no update
   * script reports the branch). Running build not in the list: at least the length of the list.
   */
  behind?: number,
};

// Abbreviated hashes differ in length between the build and the server checkout: one has to start with the other
function sameCommit(hash: string, head: string): boolean {
  return hash !== '' && head !== '' && (hash.startsWith(head) || head.startsWith(hash));
}

/** Commits to list and how far the running build is behind the deploy branch. */
export function deployState(dashboard: ServerDashboard): DeployState {
  const commits = dashboard.upstream?.commits ?? dashboard.commits;
  const rows = commits.map((commit) => ({commit, live: sameCommit(commit.hash, dashboard.build.head)}));
  if (dashboard.upstream === undefined) {
    return {rows};
  }
  const liveIndex = rows.findIndex((row) => row.live);
  return {rows, behind: liveIndex === -1 ? rows.length : liveIndex};
}

/** The update script works right now: a request waits for it, it checks the new commits or it builds. */
export function updateInProgress(dashboard: ServerDashboard): boolean {
  const outcome = dashboard.deployRun?.outcome;
  return dashboard.updateRequest !== undefined || outcome === 'checking' || outcome === 'building';
}

/** An update can be asked for: the server is behind the deploy branch and the script is not busy with one. */
export function canRequestUpdate(dashboard: ServerDashboard): boolean {
  return (deployState(dashboard).behind ?? 0) > 0 && !updateInProgress(dashboard);
}

export type DeployProblem = {
  text: string,
  /** Shell command that resolves it (shown as code, not translated) */
  command?: string,
  /** Blocks the update for good (red); otherwise only a note (dim) */
  blocking: boolean,
};

/**
 * Why the server is still behind after the last run of the update script; undefined if it is current, busy or no
 * script reports. Before, a refused update just fell back to "behind" and looked like a click that did nothing.
 */
export function deployProblem(dashboard: ServerDashboard): DeployProblem | undefined {
  const run = dashboard.deployRun;
  if (run === undefined || updateInProgress(dashboard) || (deployState(dashboard).behind ?? 0) === 0) {
    return undefined;
  }
  switch (run.outcome) {
  case 'refused':
    return {
      text: translateTextWithParams('Update blocked: commit ${0} is not signed', [run.blockedCommit ?? '?']),
      command: run.blockedRepository === 'lab' ? 'ops/shared/approve-deploy.sh lab' : 'ops/shared/approve-deploy.sh',
      blocking: true,
    };
  case 'buildFailed':
    return {text: translateText('Build failed – the old version keeps running'), blocking: true};
  case 'postponed':
    return {text: translateText('Starts by itself once nobody plays'), blocking: false};
  default:
    return undefined;
  }
}

/** How far the server is behind, as shown on the games and the commits card; empty if unknown. */
export function deployStatusText(dashboard: ServerDashboard): string {
  if (dashboard.updateRequest !== undefined) {
    return translateText('Update requested – starting now');
  }
  if (dashboard.deployRun?.outcome === 'checking') {
    return translateText('Checking the new commits…');
  }
  if (dashboard.deployRun?.outcome === 'building') {
    return translateText('Building the new version…');
  }
  const state = deployState(dashboard);
  if (state.behind === undefined) {
    return '';
  }
  if (state.behind === 0) {
    return translateText('Up to date');
  }
  // Running build older than the whole list: at least that many
  const count = state.rows.some((row) => row.live) ? String(state.behind) : `${state.behind}+`;
  return translateTextWithParams('${0} commits behind', [count]);
}

/** Commit time of the running build; undefined if neither the deploy branch nor the build lists it. */
export function liveCommitTime(dashboard: ServerDashboard): string | undefined {
  // Build list as fallback: an old build has dropped out of the deploy branch list
  const commits = [...(dashboard.upstream?.commits ?? []), ...dashboard.commits];
  return commits.find((commit) => sameCommit(commit.hash, dashboard.build.head))?.time;
}
