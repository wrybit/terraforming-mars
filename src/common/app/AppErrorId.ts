export const INVALID_RUN_ID = '#invalid-run-id' as const;
export const RESPONDING_TOO_QUICKLY = '#responding-too-quickly' as const;
export const SERVER_UPDATING = '#server-updating' as const;
export type AppErrorId = typeof INVALID_RUN_ID | typeof RESPONDING_TOO_QUICKLY | typeof SERVER_UPDATING;

export type AppErrorResponse = {
  id: AppErrorId | undefined;
  message: string;
}
