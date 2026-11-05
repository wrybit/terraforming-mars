import {PLAYER_COLORS} from '@/common/Color';
import {LobbyProfile, LOBBY_EMOJIS} from '@/common/lobby/LobbyModel';

// The lobby profile lives only in this browser: no account, no login. Storage can be blocked or empty
// (private window, cleared site data); then the page works with an in-memory profile.

const PROFILE_KEY = 'tm-lobby-profile';
const PARTICIPANT_KEY = 'tm-lobby-participant';

export function loadLobbyProfile(): LobbyProfile | undefined {
  try {
    const raw = JSON.parse(localStorage.getItem(PROFILE_KEY) ?? 'null');
    if (raw === null || typeof raw.name !== 'string' || raw.name.trim() === '') {
      return undefined;
    }
    return {
      name: raw.name,
      color: PLAYER_COLORS.find((color) => color === raw.color) ?? 'red',
      emoji: LOBBY_EMOJIS.find((emoji) => emoji === raw.emoji) ?? LOBBY_EMOJIS[0],
      image: typeof raw.image === 'string' ? raw.image : undefined,
    };
  } catch {
    return undefined;
  }
}

export function saveLobbyProfile(profile: LobbyProfile): void {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Not persisted: the profile stays valid for this page visit
  }
}

let memoryParticipantId: string | undefined;

/** Random id of this browser in the lobby; also the secret of its seat, so it never leaves the own requests */
export function lobbyParticipantId(): string {
  try {
    const stored = localStorage.getItem(PARTICIPANT_KEY);
    if (stored !== null && /^[a-z0-9]{16,40}$/.test(stored)) {
      return stored;
    }
    const created = newParticipantId();
    localStorage.setItem(PARTICIPANT_KEY, created);
    return created;
  } catch {
    memoryParticipantId ??= newParticipantId();
    return memoryParticipantId;
  }
}

function newParticipantId(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, '0')).join('').slice(0, 24);
}

/** Scales an uploaded picture to a small square JPEG (cropped to the middle), so it fits the lobby limits */
export function readProfileImage(file: File, size = 96): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('Not an image'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const scale = Math.max(size / image.width, size / image.height);
        canvas.getContext('2d')?.drawImage(image, (size - image.width * scale) / 2, (size - image.height * scale) / 2, image.width * scale, image.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
