// Shared between server (ApiMusic, ApiAdminMusic) and client (gameMusic.ts, AdminMusic.vue)

/**
 * Answer of api/music and api/admin/music: the ids of the tracks that may play, and the track a game starts with
 * (chosen in the admin page; its group is the listener's default group)
 */
export type MusicState = {enabled: Array<string>, start: string};

/** Body of a POST to api/admin/music: switch one track on or off, or choose the start track */
export type MusicSwitch = {id: string, enabled: boolean} | {start: string};

/** Start track when the admin chose none (or one that no longer exists) */
export const DEFAULT_START_TRACK = 'ancient-ruins';
