import {PLAYER_COLORS} from '../../common/Color';
import {LobbyProfile, LOBBY_EMOJIS, LOBBY_IMAGE_MAX_LENGTH, LOBBY_NAME_MAX_LENGTH, LOBBY_TITLE_MAX_LENGTH} from '../../common/lobby/LobbyModel';

/** A request the lobby cannot fulfil; the route answers it as a bad request with this message */
export class LobbyError extends Error {}

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;

/** Profiles come from the browser: trim the name, keep only known emojis and colors and small pictures */
export function sanitizeProfile(profile: unknown): LobbyProfile {
  if (typeof profile !== 'object' || profile === null) {
    throw new LobbyError('Missing profile');
  }
  const raw = profile as Partial<LobbyProfile>;
  const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, LOBBY_NAME_MAX_LENGTH) : '';
  if (name === '') {
    throw new LobbyError('Please enter a name');
  }
  const color = PLAYER_COLORS.find((c) => c === raw.color) ?? 'red';
  const emoji = LOBBY_EMOJIS.find((e) => e === raw.emoji) ?? LOBBY_EMOJIS[0];
  const image = typeof raw.image === 'string' && raw.image.length <= LOBBY_IMAGE_MAX_LENGTH && IMAGE_DATA_URL.test(raw.image) ? raw.image : undefined;
  return image === undefined ? {name, color, emoji} : {name, color, emoji, image};
}

export function sanitizeTitle(title: unknown): string {
  return typeof title === 'string' ? title.trim().slice(0, LOBBY_TITLE_MAX_LENGTH) : '';
}
