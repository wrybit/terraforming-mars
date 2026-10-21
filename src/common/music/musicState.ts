// Shared between server (ApiMusic, ApiAdminMusic) and client (gameMusic.ts, AdminMusic.vue)

/** Answer of api/music and api/admin/music: the ids of the tracks that may play */
export type MusicState = {enabled: Array<string>};

/** Body of a POST to api/admin/music */
export type MusicSwitch = {id: string, enabled: boolean};
