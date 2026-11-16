// Random outcomes the Rust bot cannot reproduce (it has its own random generator): reshuffled project piles and
// the numbers the Dune modules draw. They are recorded per game and sent along with the event that caused them.
// Games without a Rust player pay one boolean check per random number.
import {SeededRandom} from '../../../common/utils/Random';
import {Deck} from '../../cards/Deck';

export type RandomRecord = {duneDraws: Array<number>, shuffles: Array<Array<string>>};

// rng of a game with a Rust player -> its record (game copies of the TS AI have their own rng and stay out)
const records = new WeakMap<object, RandomRecord>();
let recordedGames = 0;
// While a game with a Rust player is created: every Dune draw belongs to its setup
let setupRecord: RandomRecord | undefined;

const DUNE_CODE = /[\\/]src[\\/](server|common)[\\/]dune[\\/]/;

const originalNext = SeededRandom.prototype.next;
SeededRandom.prototype.next = function(this: SeededRandom): number {
  const value = originalNext.call(this);
  if (setupRecord !== undefined || recordedGames > 0) {
    const record = setupRecord ?? records.get(this);
    if (record !== undefined && DUNE_CODE.test(new Error().stack ?? '')) {
      record.duneDraws.push(value);
    }
  }
  return value;
};

const originalShuffle = Deck.shuffle;
Deck.shuffle = (array: Array<any>, random: any) => {
  originalShuffle(array, random);
  if (recordedGames > 0 && setupRecord === undefined && array.length > 0 && !['corporation', 'prelude'].includes(array[0].type)) {
    records.get(random)?.shuffles.push(array.map((card: any) => card.name));
  }
};

/** Runs the creation of a game and returns the Dune numbers drawn meanwhile. */
export function recordSetup<T>(create: () => T): {result: T, duneDraws: Array<number>} {
  setupRecord = {duneDraws: [], shuffles: []};
  try {
    return {result: create(), duneDraws: setupRecord.duneDraws};
  } finally {
    setupRecord = undefined;
  }
}

/** Starts recording the random outcomes of a game's generator. */
export function recordRandom(rng: object): RandomRecord {
  let record = records.get(rng);
  if (record === undefined) {
    record = {duneDraws: [], shuffles: []};
    records.set(rng, record);
    recordedGames++;
  }
  return record;
}

/** The outcomes since the last call (to attach to the event that caused them). */
export function takeRandom(record: RandomRecord): {random?: Array<number>, shuffles?: Array<Array<string>>} {
  const result: {random?: Array<number>, shuffles?: Array<Array<string>>} = {};
  if (record.duneDraws.length > 0) {
    result.random = record.duneDraws.splice(0);
  }
  if (record.shuffles.length > 0) {
    result.shuffles = record.shuffles.splice(0);
  }
  return result;
}
