import {Expansion} from '@/common/cards/GameModule';
import {LobbyRoomModel} from '@/common/lobby/LobbyModel';

// Filters of the lobby list. The resting state selects nothing, which means: all games.

export type LobbyTempo = 'any' | 'normal' | 'fast';
export type LobbyDraft = 'any' | 'on' | 'off';

export type LobbyFilters = {
  /** Seat counts (humans and AI together); empty: every size */
  sizes: Array<number>;
  /** Expansions that must be part of the game; empty: any */
  expansions: Array<Expansion>;
  tempo: LobbyTempo;
  draft: LobbyDraft;
};

export function defaultLobbyFilters(): LobbyFilters {
  return {sizes: [], expansions: [], tempo: 'any', draft: 'any'};
}

export function activeFilterCount(filters: LobbyFilters): number {
  return [filters.sizes.length > 0, filters.expansions.length > 0, filters.tempo !== 'any', filters.draft !== 'any']
    .filter(Boolean).length;
}

export function matchesFilters(room: LobbyRoomModel, filters: LobbyFilters): boolean {
  const options = room.setup.options;
  if (filters.sizes.length > 0 && !filters.sizes.includes(room.seats.length)) {
    return false;
  }
  if (!filters.expansions.every((expansion) => room.setup.expansions[expansion])) {
    return false;
  }
  if (filters.tempo !== 'any' && (filters.tempo === 'fast') !== options.fastModeOption) {
    return false;
  }
  if (filters.draft !== 'any' && (filters.draft === 'on') !== options.draftVariant) {
    return false;
  }
  return true;
}

export function hasFreeSeat(room: LobbyRoomModel): boolean {
  return room.state === 'open' && room.seats.some((seat) => seat.kind === 'free');
}

/** Quick start: the fullest open game that fits, so it starts soonest */
export function bestMatch(rooms: ReadonlyArray<LobbyRoomModel>, filters: LobbyFilters): LobbyRoomModel | undefined {
  const fill = (room: LobbyRoomModel) => room.seats.filter((seat) => seat.kind !== 'free').length / room.seats.length;
  return rooms
    .filter((room) => hasFreeSeat(room) && !room.seats.some((seat) => seat.kind === 'human' && seat.you) && matchesFilters(room, filters))
    .sort((a, b) => fill(b) - fill(a))[0];
}
