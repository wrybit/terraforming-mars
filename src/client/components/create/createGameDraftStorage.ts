import {JSONObject} from '@/common/Types';

// Unsent "Create game" form of this tab: closing the form by mistake (Escape, backdrop) must not lose anything,
// reopening continues where it was left. Per tab (sessionStorage), so it survives a reload but not the tab;
// independent of "Remember settings", which keeps the settings of the last created game across visits
const DRAFT_KEY = 'tm_create_game_draft';

export type CreateGameDraft = {
  /** Same shape as the remembered settings (createGameSettingsStorage.ts), applied by JSONProcessor */
  settings: JSONObject;
  gameName: string;
  gameNamePlaceholder: string;
  lobbyPublic: boolean;
  /** Seat keys (seatOrder.ts) entered by hand */
  manualSeats: Array<number>;
  /** JSONProcessor does not restore the predefined game, so it travels here */
  seededGame: boolean;
  clonedGameId: string | undefined;
  /** Picture of the own seat; the lobby profile replaces it when there is one */
  hostEmoji: string;
  hostImage: string | undefined;
};

// Fail-soft like safeLocalStorage: without storage (private mode, blocked) the draft simply is not kept
export const createGameDraftStorage = {
  save(draft: CreateGameDraft): void {
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn('unable to keep the create game draft', err);
    }
  },

  load(): CreateGameDraft | undefined {
    try {
      const data = sessionStorage.getItem(DRAFT_KEY);
      return data === null ? undefined : JSON.parse(data) as CreateGameDraft;
    } catch (err) {
      console.warn('unable to read the create game draft', err);
      return undefined;
    }
  },

  clear(): void {
    try {
      sessionStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      console.warn('unable to remove the create game draft', err);
    }
  },
};
