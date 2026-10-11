/** Answer of GET /api/status: lets open pages notice a server update before the server goes down. */
export type ServerStatusModel = {
  /** True while the server is about to be replaced: inputs are refused, pages show the update notice. */
  updating: boolean,
  /** Start time of this server process; changes after every restart, so pages can tell a new version. */
  startedAt: number,
  /** Players of running games with a page open in the last minutes (decides whether an update may run now). */
  activeParticipants: number,
}
