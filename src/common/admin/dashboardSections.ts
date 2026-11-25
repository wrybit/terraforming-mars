import {paths} from '../app/paths';
import {ServerDashboard} from './ServerDashboard';

/**
 * Parts of the admin dashboard, each with its own request (GET api/admin/dashboard/<section>): reading every saved
 * game or calling the own public address takes seconds, so a card shows as soon as the parts it needs are there.
 */
export const DASHBOARD_SECTIONS = ['machine', 'reachability', 'games', 'history', 'deploy'] as const;

export type DashboardSection = typeof DASHBOARD_SECTIONS[number];

export type DashboardSectionData = {
  machine: Pick<ServerDashboard, 'identity' | 'host' | 'cpu' | 'memory' | 'disk' | 'machineUsage' | 'gpus' | 'rustAi'>,
  reachability: Pick<ServerDashboard, 'reachability'>,
  games: Pick<ServerDashboard, 'games' | 'activity'>,
  history: Pick<ServerDashboard, 'presence' | 'availability' | 'serverStarts' | 'rustFallbacks'>,
  deploy: Pick<ServerDashboard, 'build' | 'commits' | 'upstream' | 'updateRequest' | 'deployRun' | 'playersOnline'>,
};

export function dashboardSectionPath(section: DashboardSection): string {
  return `${paths.API_ADMIN_DASHBOARD}/${section}`;
}
