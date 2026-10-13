/** One commit of the deployed code (newest first), written at build time. */
export type DashboardCommit = {
  hash: string,
  /** ISO time of the commit */
  time: string,
  title: string,
};

/** One storage area: the disk holding the game database. */
export type DashboardDisk = {
  totalBytes: number,
  freeBytes: number,
};

/** Players or availability for one day or one week (start date, YYYY-MM-DD in server time). */
export type DashboardPeriodCount = {
  start: string,
  value: number,
};

/** Distinct human players per hour of one day (index 0 = 0:00–0:59, server time). */
export type DashboardDayProfile = {
  start: string,
  hours: Array<number>,
};

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
  storage: {
    databaseBytes?: number,
    decisionLogBytes?: number,
  },
  games: {
    running: number,
    finished: number,
    playersOnline: number,
  },
  /** Distinct human players per day (last 14 days) and per week (last 12 weeks), oldest first */
  activity: {
    days: Array<DashboardPeriodCount>,
    weeks: Array<DashboardPeriodCount>,
    /** Last 28 days, oldest first: when during the day people play */
    dayProfiles: Array<DashboardDayProfile>,
  },
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
