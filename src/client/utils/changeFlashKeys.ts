// Contract between the change tracker (changeFlashSnapshot.ts) and the templates (v-flash):
// both sides build their keys only through these functions, so a value and its element always match.
import {Color} from '@/common/Color';
import {Resource} from '@/common/Resource';

// Areas of the game view. A tab names the areas it hides (v-flash-tab), so it can blink
// for changes inside it while it is not active.
export const FLASH_AREAS = ['players', 'mars', 'moon', 'milestonesAwards', 'colonies', 'turmoil'] as const;
export type FlashArea = typeof FLASH_AREAS[number];

export type PlayerCounter = 'terraformRating' | 'victoryPoints' | 'cardsInHand' | 'playedCards';
export type GlobalParameterName = 'temperature' | 'oxygen' | 'oceans' | 'venus';
export type MoonRate = 'habitat' | 'mining' | 'logistic';
export type TurmoilPart = 'ruling' | 'chairman' | 'lobby';

export const flashKeys = {
  playerStock: (color: Color, resource: Resource) => `players.${color}.${resource}`,
  playerProduction: (color: Color, resource: Resource) => `players.${color}.${resource}.production`,
  playerCounter: (color: Color, counter: PlayerCounter) => `players.${color}.${counter}`,
  playerTag: (color: Color, tag: string) => `players.${color}.tag.${tag}`,
  marsSpace: (spaceId: string) => `mars.space.${spaceId}`,
  globalParameter: (parameter: GlobalParameterName) => `mars.parameter.${parameter}`,
  moonSpace: (spaceId: string) => `moon.space.${spaceId}`,
  moonRate: (rate: MoonRate) => `moon.rate.${rate}`,
  milestone: (name: string) => `milestonesAwards.milestone.${name}`,
  award: (name: string) => `milestonesAwards.award.${name}`,
  colony: (name: string) => `colonies.${name}`,
  turmoilParty: (name: string) => `turmoil.party.${name}`,
  turmoil: (part: TurmoilPart) => `turmoil.${part}`,
} as const;

// Every key starts with its area, so no second lookup table is needed
export function flashAreaOf(key: string): FlashArea {
  return key.substring(0, key.indexOf('.')) as FlashArea;
}
