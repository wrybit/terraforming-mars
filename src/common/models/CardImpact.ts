import {Tag} from '../cards/Tag';
import {CardName} from '../cards/CardName';
import {Color} from '../Color';
import {CardResource} from '../CardResource';

/**
 * Contract between server (models/cardImpact.ts) and client (CardImpactPanel.vue): what playing a project card
 * changes for the player right now, limited to what is not printed on the card or depends on the game state
 * (counts of tags and cities, track bonuses, how much an opponent actually loses). Fixed printed effects are
 * deliberately left out – the card already shows them.
 */

/** Things an impact can give or take; production is a flag on the amount. */
export type CardImpactResource =
  'megacredits' | 'steel' | 'titanium' | 'plants' | 'energy' | 'heat' |
  'cards' | 'tr' | 'vp' | 'ocean' | 'colony' | 'temperature' | CardResource;

export type CardImpactAmount = {
  resource: CardImpactResource;
  amount: number;
  production?: true;
};

/** The player an attack is aimed at (color for the box, name for the text). */
export type CardImpactPlayer = {
  color: Color;
  name: string;
};

/**
 * What a counted value is made of. The parts add up to the counted total before `per`/`each`:
 * `own` (the player's own tags, including tag substitutions such as Earth Embassy), `wild` (wild tags counted in),
 * `self` (the tags of the card being played).
 */
export type CardImpactCount =
  {kind: 'tag', tag: Tag, own: number, wild: number, self: number, others: boolean} |
  {kind: 'cities', where: 'onmars' | 'offmars' | 'everywhere', count: number} |
  {kind: 'greeneries', count: number} |
  {kind: 'oceans', count: number} |
  {kind: 'events', count: number} |
  {kind: 'total', count: number};

export type CardImpactBasis =
  /** A value counted from the game state; `action` marks the repeatable action of the card */
  {type: 'count', count: CardImpactCount, each?: number, per?: number, action?: true} |
  /** Bonuses of a global-parameter track crossed by the raise (values in track units, e.g. °C) */
  {type: 'trackBonus', parameter: 'temperature' | 'oxygen' | 'venus', values: ReadonlyArray<number>} |
  /** A yield that depends on having at least `needed` tags */
  {type: 'threshold', tag: Tag, count: number, needed: number} |
  /** A conversion of up to `max` (e.g. Insulation: up to the heat production) */
  {type: 'upTo', resource: CardImpactResource, production: boolean, max: number} |
  /** One option of an attack: up to `max` of a resource from one opponent (the targets are listed in the line) */
  {type: 'attack', resource: CardImpactResource, max: number} |
  /** One of the player's cards that can be chosen (e.g. Robotic Workforce copies its production) */
  {type: 'card', card: CardName};

/**
 * An opponent of an attack line and what they would actually lose. Every opponent is listed in every attack line,
 * in the same order, so each keeps its column; `empty` marks one who has nothing of that resource.
 */
export type CardImpactTarget = {
  player: CardImpactPlayer;
  amount: number;
  protected?: true;
  empty?: true;
};

export type CardImpactLine = {
  basis: CardImpactBasis;
  /** What the player gets (or pays, negative) */
  gains: ReadonlyArray<CardImpactAmount>;
  /** Attack: every opponent that can be chosen – one line per option however many players there are */
  targets?: ReadonlyArray<CardImpactTarget>;
};
