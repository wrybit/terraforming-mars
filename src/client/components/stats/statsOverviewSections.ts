// Section titles of the overview, shared by the overview itself and its loading skeleton (StatsSkeleton.vue)
export const OVERVIEW_TITLES = {
  glance: 'At a glance',
  lineups: 'Wins per lineup',
  recent: 'Points in the last games',
  generations: 'Games by generations',
  points: 'Avg. points per generation',
  globals: 'Avg. terraforming per generation',
} as const;

// Number of key figures in "At a glance" (StatsOverview.vue tiles)
export const OVERVIEW_KPI_COUNT = 8;
