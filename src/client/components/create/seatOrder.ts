import {NewPlayerModel} from '@/common/game/NewGameConfig';

// Stable identity per seat object, so list animations follow the player and not the position
const seatKeys = new WeakMap<NewPlayerModel, number>();
let nextSeatKey = 0;

export function seatKey(player: NewPlayerModel): number {
  let key = seatKeys.get(player);
  if (key === undefined) {
    key = nextSeatKey++;
    seatKeys.set(player, key);
  }
  return key;
}

function isAi(player: NewPlayerModel): boolean {
  return player.aiLevel !== undefined;
}

/**
 * Arranges the seats as: all humans, then all AI players, then the unused seats.
 * Humans and AI players keep their own seat (name, color) when the counts change:
 * a removed seat goes to the front of the unused seats, so adding it again brings it back.
 */
export function arrangeSeats(
  players: ReadonlyArray<NewPlayerModel>,
  activeCount: number,
  humanCount: number,
  aiCount: number,
): Array<NewPlayerModel> {
  const active = players.slice(0, activeCount);
  const humans = active.filter((player) => !isAi(player));
  const ais = active.filter(isAi);
  const unused = players.slice(activeCount);

  while (humans.length > humanCount) {
    unused.unshift(humans.pop() as NewPlayerModel);
  }
  while (ais.length > aiCount) {
    unused.unshift(ais.pop() as NewPlayerModel);
  }
  while (humans.length < humanCount && unused.length > 0) {
    const seat = unused.shift() as NewPlayerModel;
    seat.aiLevel = undefined;
    humans.push(seat);
  }
  while (ais.length < aiCount && unused.length > 0) {
    const seat = unused.shift() as NewPlayerModel;
    seat.aiLevel = seat.aiLevel ?? 'normal';
    ais.push(seat);
  }
  return [...humans, ...ais, ...unused];
}
