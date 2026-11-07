// Readable invitation links of the lobby: lobby/room/<id>-<name>, e.g. lobby/room/x4m9-Feierabend_Runde.
// Only the id counts; the name is decoration and may be dropped or changed without breaking the link.

export const LOBBY_ROOM_PATH = 'lobby/room/';

// Lobby with the "Create game" form open above it (start page item "Start")
export const LOBBY_CREATE_PATH = 'lobby/create';

/** Room ids: 4 characters, lower-case letters and digits */
export const LOBBY_ROOM_ID = /^[a-z0-9]{4}$/;

// Letters whose usual spelling in a URL is longer than the stripped accent (ä -> ae, not a)
const SPELLED_OUT: Record<string, string> = {
  'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'Ä': 'Ae', 'Ö': 'Oe', 'Ü': 'Ue', 'ß': 'ss', 'ẞ': 'SS',
  'æ': 'ae', 'Æ': 'Ae', 'ø': 'oe', 'Ø': 'Oe', 'å': 'aa', 'Å': 'Aa', 'œ': 'oe', 'Œ': 'Oe',
  'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'ð': 'd', 'Ð': 'D', 'þ': 'th', 'Þ': 'Th', 'ı': 'i',
};

// Cyrillic (Russian, Ukrainian, Bulgarian) in a simple Latin spelling
const CYRILLIC: Record<string, string> = {
  'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'ґ': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'є': 'ye', 'ж': 'zh', 'з': 'z',
  'и': 'i', 'і': 'i', 'ї': 'yi', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r',
  'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'shch', 'ъ': '',
  'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
};

function transliterate(char: string): string {
  if (SPELLED_OUT[char] !== undefined) {
    return SPELLED_OUT[char];
  }
  const lower = char.toLowerCase();
  if (CYRILLIC[lower] !== undefined) {
    const latin = CYRILLIC[lower];
    return char === lower ? latin : latin.charAt(0).toUpperCase() + latin.slice(1);
  }
  // Remaining accents (é, ñ, ő, č …) fall off; letters without a Latin form (Chinese, Japanese, Korean) disappear
  return char.normalize('NFKD').replace(/[̀-ͯ]/g, '');
}

/** Room name as URL part: spaces become _, special letters a working Latin spelling, everything else is dropped */
export function lobbyRoomSlug(title: string): string {
  return Array.from(title.trim()).map(transliterate).join('')
    .replace(/\s+/g, '_')
    .replace(/[^A-Za-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')
    .slice(0, 40);
}

/** Path of a room relative to the app: lobby/room/<id>-<name> (only the id when the name has no usable letters) */
export function lobbyRoomPath(id: string, title: string): string {
  const slug = lobbyRoomSlug(title);
  return LOBBY_ROOM_PATH + (slug === '' ? id : `${id}-${slug}`);
}

/** True for a page address like /lobby/create (also behind a path prefix) */
export function isLobbyCreatePath(pathname: string): boolean {
  return /(?:^|\/)lobby\/create\/?$/.test(pathname);
}

/** Room id of a page address like /lobby/room/x4m9-Name (also behind a path prefix); undefined for other pages */
export function lobbyRoomIdFromPath(pathname: string): string | undefined {
  const match = /(?:^|\/)lobby\/room\/([a-z0-9]{4})(?:-[^/]*)?\/?$/.exec(pathname);
  return match?.[1];
}

/** Query parameter of a seat's own invitation link: the guest the host entered takes exactly that seat */
export const LOBBY_SEAT_PARAMETER = 'seat';

export function lobbySeatInvitePath(roomId: string, title: string, token: string): string {
  return `${lobbyRoomPath(roomId, title)}?${LOBBY_SEAT_PARAMETER}=${encodeURIComponent(token)}`;
}
