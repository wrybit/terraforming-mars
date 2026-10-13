/** One commit of the deployed code (newest first), written at build time. */
export type DashboardCommit = {
  hash: string,
  /** ISO time of the commit */
  time: string,
  title: string,
};

/**
 * Newest commits of the branch the server deploys from (newest first), written by the update script of the server
 * operator after every fetch (file name: UPSTREAM_COMMITS_FILE in the data folder). Compared with the running
 * build it shows whether the server is behind.
 */
export type DashboardUpstream = {
  measuredAtMs: number,
  branch: string,
  commits: Array<DashboardCommit>,
  /** Newest commits of the deploy branch; missing where no update script reports them */
  upstream?: DashboardUpstream,
  /** Set while an update asked for on the admin page waits for the update script */
  updateRequest?: UpdateRequest,
};

export const UPSTREAM_COMMITS_FILE = 'upstream-commits.json';

/** The admin page asks the update script of the server operator to deploy the newest commit now (POST API_ADMIN_UPDATE). */
export const UPDATE_REQUEST_FILE = 'update-request.json';

export type UpdateRequest = {
  requestedAtMs: number,
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

/** Areas of the machine for processor and memory: who uses them. */
export type UsageArea = 'game' | 'ai' | 'containers' | 'docker' | 'reserve' | 'programs' | 'system';

/**
 * Processor and memory use by area, measured from the cgroups of the machine every minute by a script of the
 * server operator (file name: MACHINE_USAGE_FILE in the data folder). Memory is what the programs use
 * themselves, without the file cache. What no area covers counts as system.
 */
export type DashboardMachineUsage = {
  measuredAtMs: number,
  /** Share of the whole machine (all cores together = 100) */
  cpuPercent: Partial<Record<UsageArea, number>>,
  memoryBytes: Partial<Record<UsageArea, number>>,
};

export const MACHINE_USAGE_FILE = 'machine-usage.json';

/** One graphics adapter of the machine (from /sys/class/drm, readable without special rights). */
export type DashboardGpu = {
  name: string,
  /** Kernel driver, e.g. i915, amdgpu, virtio-pci */
  driver?: string,
  /** integrated: shares the main memory; virtual: display adapter of a VM, computes nothing */
  kind: 'integrated' | 'dedicated' | 'virtual',
  /** Busy share over a short moment; undefined where the driver does not tell */
  busyPercent?: number,
  clockMhz?: {current: number, max: number},
  /** Own memory of a dedicated card */
  videoMemory?: {totalBytes: number, usedBytes: number},
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
  /** Name and logo shown large on the server card (SERVER_LOGO_NAME, SERVER_LOGO_IMAGE) */
  identity: {
    name: string,
    /** Address of the image; undefined: none set */
    imageUrl?: string,
  },
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
    /** Not even used as cache; availableBytes minus this is cache the system frees on demand */
    freeBytes: number,
    swapTotalBytes: number,
    swapFreeBytes: number,
    serverProcessBytes: number,
  },
  disk?: DashboardDisk,
  /** Areas of processor and memory; missing where no operator script measures them */
  machineUsage?: DashboardMachineUsage,
  /** Graphics adapters found on the machine; empty if none */
  gpus: Array<DashboardGpu>,
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
  /** Newest commits of the deploy branch; missing where no update script reports them */
  upstream?: DashboardUpstream,
  /** Set while an update asked for on the admin page waits for the update script */
  updateRequest?: UpdateRequest,
};
