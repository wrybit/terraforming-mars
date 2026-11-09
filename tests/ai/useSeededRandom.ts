import {SeededRandom} from '../../src/common/utils/Random';

/**
 * The AI samples future hands and tableaus with Math.random. Specs that compare two such estimates call this
 * inside their describe(): fixed numbers per test, so the comparison does not fail now and then in CI.
 */
export function useSeededRandom(seed = 1): void {
  const originalRandom = Math.random;
  beforeEach(() => {
    const random = new SeededRandom(seed);
    Math.random = () => random.next();
  });
  afterEach(() => {
    Math.random = originalRandom;
  });
}
