// Names for players left without a name in a Dune game (Jens, 24 Oct 2026): people of the Dune novels instead of the
// colour names of Mars, the same for humans and AI. One short name each (Jessica, not Lady Jessica), proper names, so they stay the same in every language.
export const DUNE_NAMES: ReadonlyArray<string> = [
  'Paul', 'Leto', 'Jessica', 'Alia', 'Gurney', 'Duncan',
  'Thufir', 'Yueh', 'Stilgar', 'Chani', 'Liet', 'Jamis',
  'Harah', 'Otheym', 'Korba', 'Vladimir', 'Feyd', 'Rabban',
  'Piter', 'Shaddam', 'Irulan', 'Fenring', 'Margot', 'Mohiam',
  'Esmar', 'Staban', 'Mapes', 'Wensicia', 'Ghanima', "Farad'n",
];

/**
 * One name per empty seat, drawn at random without repeats and without the names typed for the other seats
 * (`random` returns [0, 1) like Math.random; injectable for tests)
 */
export function drawDuneNames(count: number, taken: ReadonlyArray<string>, random: () => number = Math.random): Array<string> {
  const used = new Set(taken.map((name) => name.trim().toLowerCase()));
  const pool = DUNE_NAMES.filter((name) => !used.has(name.toLowerCase()));
  const drawn: Array<string> = [];
  while (drawn.length < count && pool.length > 0) {
    const index = Math.floor(random() * pool.length);
    drawn.push(pool.splice(index, 1)[0]);
  }
  return drawn;
}

/**
 * Seats as typed in the form: a drawn name becomes empty again, so the remembered settings draw anew next time
 * (`typed` holds the form's names; drawn names never equal one of them, see drawDuneNames)
 */
export function withoutDrawnDuneNames<T extends {name: string}>(players: ReadonlyArray<T>, typed: ReadonlyArray<string>): Array<T> {
  return players.map((player) => DUNE_NAMES.includes(player.name) && !typed.includes(player.name) ? {...player, name: ''} : player);
}
