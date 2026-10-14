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

/** An update can be asked for: the server is behind the deploy branch and no request waits yet. */
export function canRequestUpdate(dashboard: ServerDashboard): boolean {
  return (deployState(dashboard).behind ?? 0) > 0 && dashboard.updateRequest === undefined;
}

/** How far the server is behind, as shown on the games and the commits card; empty if unknown. */
export function deployStatusText(dashboard: ServerDashboard): string {
  if (dashboard.updateRequest !== undefined) {
    return translateText('Update requested – starting now');
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
