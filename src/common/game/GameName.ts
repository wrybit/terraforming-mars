import {Random} from '../utils/Random';

const firstWords = [
  'Remote', 'Isolated', 'Distant', 'Static', 'Silent',
  'Active', 'Latent', 'Faint', 'Massive', 'Erratic',
  'Stable', 'Thermal', 'Kinetic', 'Radiant', 'Cold',
  'Dense', 'Rarefied', 'Synthetic', 'Orbital', 'Binary',
  'Polar', 'Solar', 'Cosmic', 'Residual', 'Volatile',
];

const secondWords = [
  'Particle', 'Gravity', 'Carbon', 'Vacuum', 'Plasma',
  'Stellar', 'Oxygen', 'Mineral', 'Gamma', 'Proton',
  'Neutron', 'Isotope', 'Matter', 'Inertia', 'Laser',
  'Silicon', 'Hydrogen', 'Signal', 'Magnet', 'Vector',
  'Fusion', 'Pressure', 'Optics', 'Quartz', 'Flux',
];

const thirdWords = [
  'Trace', 'Wave', 'Node', 'Burst', 'Field',
  'Core', 'Pulse', 'Beam', 'Drift', 'Stream',
  'Cloud', 'Zone', 'Point', 'Loop', 'State',
  'Mass', 'Current', 'Fragment', 'Unit', 'Source',
  'Link', 'Flow', 'Charge', 'Surge', 'Signal',
];

/** Longest custom game name (create form, lobby) */
export const GAME_NAME_MAX_LENGTH = 40;

export function generateGameName(rng: Random): string {
  const first = firstWords[rng.nextInt(firstWords.length)];
  const second = secondWords[rng.nextInt(secondWords.length)];
  const third = thirdWords[rng.nextInt(thirdWords.length)];
  return `${first} ${second} ${third}`;
}
