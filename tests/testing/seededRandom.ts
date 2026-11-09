import {SeededRandom} from '../../src/common/utils/Random';

// Fork: the AI samples future hands, draws and tableaus with Math.random, and several specs compare two such
// estimates. With real randomness they failed now and then in CI. Every test starts from the same seed, so a
// result is the same on every run and every machine.
const SEED = 1;
const originalRandom = Math.random;

export const seededRandomHooks = {
  beforeEach(): void {
    const random = new SeededRandom(SEED);
    Math.random = () => random.next();
  },
  afterEach(): void {
    Math.random = originalRandom;
  },
};
