import {Color, PLAYER_COLORS} from '../Color';
import {LOBBY_EMOJIS} from '../lobby/LobbyModel';

// Contract between the admin page "Players" (client) and its API (server): colour and emoji of a name in the
// statistics, chosen by the admin from the same cubes and emojis as the lobby profile. Missing values: the
// list shows the colour of the latest game (AI accounts their fixed colour) and the initial (AI: the robot).

export type PlayerAppearance = {
  name: string;
  color?: Color;
  emoji?: string;
};

export function isPlayerColor(value: unknown): value is Color {
  return typeof value === 'string' && (PLAYER_COLORS as ReadonlyArray<string>).includes(value);
}

export function isLobbyEmoji(value: unknown): value is string {
  return typeof value === 'string' && LOBBY_EMOJIS.includes(value);
}
