// Durations in the lobby list: "6 min", "1 h 12 min" (time played, time left, length of a generation)
export function lobbyDuration(milliseconds: number): string {
  const minutes = Math.floor(Math.max(0, milliseconds) / 60_000);
  return minutes < 60 ? `${minutes} min` : `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
}
