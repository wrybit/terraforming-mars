/** One commit of the deployed code (newest first), written at build time. */
export type DashboardCommit = {
  hash: string,
  /** ISO time of the commit */
  time: string,
  title: string,
};

/** The disk holding the game data, with its use by purpose. */
export type DashboardDisk = {
  totalBytes: number,
  freeBytes: number,
  usage?: DashboardDiskUsage,
};

/** Players or availability for one day or one week (start date, YYYY-MM-DD in server time). */
export type DashboardPeriodCount = {
  start: string,
  value: number,
};

/** Players online in each 5-minute slot of one day (index 0 = 0:00–0:04, server time); today up to now. */
export type DashboardDayProfile = {
  start: string,
  slots: Array<number>,
};

/**
 * Disk usage by purpose, measured on the machine itself (the game server only sees its container) by a small
 * script of the server operator, which writes it as JSON into the data folder (file name: DISK_USAGE_FILE).
 * All values in bytes; what no part covers is shown as "System and other".
 */
export type DashboardDiskUsage = {
  measuredAtMs: number,
  /** Docker and Node.js: images, build cache, runtime (without the game image and its data volume) */
  docker?: number,
  /** Game code: source checkout and the built image */
  game?: number,
  /** Saved games (the data folder without the AI logs) */
  gameData?: number,
  /** System and server logs */
  logs?: number,
  /** AI decision logs (training data) */
  aiLogs?: number,
};

export const DISK_USAGE_FILE = 'disk-usage.json';

/** Result of fetching this server's own public address from the inside (DNS, proxy, certificate). */
export type DashboardReachability = {
  url: string,
  ok: boolean,
  statusCode?: number,
  latencyMs?: number,
  error?: string,
};

/** Answer of GET api/admin/dashboard: everything the admin dashboard shows. */
export type ServerDashboard = {
  generatedAtMs: number,
  host: {
    hostname: string,
    operatingSystem: string,
    architecture: string,
    nodeVersion: string,
    /** Seconds since the machine (or VM) booted */
    systemUptimeSeconds: number,
    /** Seconds since the game server process started */
    serverUptimeSeconds: number,
  },
  cpu: {
    model: string,
    cores: number,
    /** Load over the last 1, 5 and 15 minutes */
    loadAverage: [number, number, number],
    /** Busy share of all cores, measured over a short moment */
    usagePercent: number,
    /** Hottest thermal sensor, if the system exposes one */
    temperatureCelsius?: number,
  },
  memory: {
    totalBytes: number,
    availableBytes: number,
    swapTotalBytes: number,
    swapFreeBytes: number,
    serverProcessBytes: number,
  },
  disk?: DashboardDisk,
  /** Graphics adapters found on the machine; empty if none */
  gpus: Array<string>,
  games: {
    running: number,
    finished: number,
    playersOnline: number,
  },
  /** Distinct human players per day (last 14 days) and per week (last 12 weeks), oldest first */
  activity: {
    days: Array<DashboardPeriodCount>,
    weeks: Array<DashboardPeriodCount>,
  },
  /** Every recorded day, oldest first: when during the day people are online */
  presence: Array<DashboardDayProfile>,
  /** Share of minutes the server was running, per day (last 14 days, percent), oldest first */
  availability: Array<DashboardPeriodCount>,
  /** Last starts of the server process (ISO times, newest first) */
  serverStarts: Array<string>,
  reachability: DashboardReachability,
  build: {
    head: string,
    builtAt: string,
  },
  commits: Array<DashboardCommit>,
};
