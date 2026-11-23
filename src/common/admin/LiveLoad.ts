/**
 * One measurement of the machine for the live graph on the admin page (AI tab): how busy each core is and how much
 * of the processor and memory the AI bots and the game server take. Shares are of the whole machine (0–100).
 */
export type LiveLoadSample = {
  measuredAtMs: number,
  /** Cores the server and its AI bots can use (the upper limit of the AI threads) */
  cores: number,
  processorModel: string,
  /** Busy share per core since the previous measurement */
  corePercent: Array<number>,
  cpu: {
    totalPercent: number,
    gameServerPercent: number,
    /** Undefined where the bots cannot be measured (only Linux has /proc) */
    aiPercent: number | undefined,
  },
  memory: {
    totalBytes: number,
    availableBytes: number,
    gameServerBytes: number,
    aiBytes: number | undefined,
  },
  /** Running Rust bot processes (one per game with Rust AI players) */
  aiBots: number,
};
