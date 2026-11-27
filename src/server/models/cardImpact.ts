import {CardImpactAmount, CardImpactBasis, CardImpactCount, CardImpactLine, CardImpactPlayer, CardImpactResource, CardImpactTarget} from '../../common/models/CardImpact';
import {CardName} from '../../common/cards/CardName';
import {CardResource} from '../../common/CardResource';
import {Tag} from '../../common/cards/Tag';
import {Resource} from '../../common/Resource';
import {Phase} from '../../common/Phase';
import {Units} from '../../common/Units';
import {GlobalParameterTracks} from '../../common/boards/GlobalParameterTracks';
import {IPlayer} from '../IPlayer';
import {IProjectCard} from '../cards/IProjectCard';
import {ICard} from '../cards/ICard';
import {Behavior} from '../behavior/Behavior';
import {Countable, CountableUnits} from '../behavior/Countable';
import {Counter} from '../behavior/Counter';
import {RemoveResourcesFromCard} from '../deferredActions/RemoveResourcesFromCard';

/**
 * What playing `card` changes for `player` beyond its printed effects. Every number comes from the same counting the
 * engine uses when the card is played (Counter, the bespoke play code it mirrors), so wild tags, "including this"
 * and protections count exactly as in play. Returns undefined when there is nothing to work out.
 */
export function computeCardImpact(player: IPlayer, card: IProjectCard): ReadonlyArray<CardImpactLine> | undefined {
  const lines: Array<CardImpactLine> = [];
  const bespoke = BESPOKE_IMPACTS[card.name];
  if (bespoke !== undefined) {
    lines.push(...bespoke(player, card));
  }
  if (card.behavior !== undefined) {
    lines.push(...behaviorImpact(player, card, card.behavior, false));
  }
  // The repeatable action of a declarative card (e.g. Martian Rails: M€ per city on Mars); Card.actionBehavior
  const actionBehavior = (card as {actionBehavior?: Behavior}).actionBehavior;
  if (actionBehavior !== undefined) {
    lines.push(...behaviorImpact(player, card, actionBehavior, true));
  }
  lines.push(...victoryPointImpact(player, card));
  return lines.length > 0 ? lines : undefined;
}

// ---------- Counting ----------

/** Breaks a countable down into the parts the player can check (own tags, wild tags, this card). */
function describeCount(player: IPlayer, card: ICard, countable: Exclude<Countable, number>, context: 'default' | 'vps'): CardImpactCount {
  const counter = new Counter(player, card);
  const total = counter.count({...countable, each: undefined, per: undefined}, context);
  if (countable.tag !== undefined && !Array.isArray(countable.tag) && countable.all !== true) {
    const tag = countable.tag;
    if (countable.others === true) {
      return {kind: 'tag', tag, own: total, wild: 0, self: 0, others: true};
    }
    const self = player.tableau.has(card.name) ? 0 : card.tags.filter((t) => t === tag).length;
    // Victory points count tags raw (no wild tags), every other count includes them (Tags.count 'default')
    const wild = context === 'vps' || tag === Tag.WILD ? 0 : player.tags.count(Tag.WILD, 'raw');
    return {kind: 'tag', tag, own: total - wild - self, wild, self, others: false};
  }
  if (countable.cities !== undefined) {
    return {kind: 'cities', where: countable.cities.where ?? 'everywhere', count: total};
  }
  if (countable.greeneries !== undefined) {
    return {kind: 'greeneries', count: total};
  }
  if (countable.oceans !== undefined) {
    return {kind: 'oceans', count: total};
  }
  if (countable.eventsPlayed !== undefined) {
    return {kind: 'events', count: total};
  }
  return {kind: 'total', count: total};
}

function countBasis(player: IPlayer, card: ICard, countable: Exclude<Countable, number>, context: 'default' | 'vps', action: boolean): CardImpactBasis {
  const basis: CardImpactBasis = {type: 'count', count: describeCount(player, card, countable, context)};
  if (countable.each !== undefined) {
    basis.each = countable.each;
  }
  if (countable.per !== undefined) {
    basis.per = countable.per;
  }
  if (action) {
    basis.action = true;
  }
  return basis;
}

// ---------- Declarative behavior ----------

function behaviorImpact(player: IPlayer, card: ICard, behavior: Behavior, action: boolean): Array<CardImpactLine> {
  const lines: Array<CardImpactLine> = [];
  const counter = new Counter(player, card);
  const countedUnits = (units: Partial<CountableUnits> | undefined, production: boolean) => {
    for (const [key, countable] of Object.entries(units ?? {}) as Array<[keyof Units, Countable]>) {
      if (typeof countable === 'number') {
        continue; // Printed on the card
      }
      const amount: CardImpactAmount = {resource: key, amount: counter.count(countable)};
      if (production) {
        amount.production = true;
      }
      lines.push({basis: countBasis(player, card, countable, 'default', action), gains: [amount]});
    }
  };
  countedUnits(behavior.production, true);
  countedUnits(behavior.stock, false);
  if (behavior.tr !== undefined && typeof behavior.tr !== 'number') {
    lines.push({basis: countBasis(player, card, behavior.tr, 'default', action), gains: [{resource: 'tr', amount: counter.count(behavior.tr)}]});
  }
  if (!action && behavior.global !== undefined) {
    lines.push(...trackBonusImpact(player, behavior.global));
  }
  if (!action && behavior.removeAnyPlants !== undefined) {
    lines.push(...removePlantsImpact(player, behavior.removeAnyPlants));
  }
  return lines;
}

function victoryPointImpact(player: IPlayer, card: ICard): Array<CardImpactLine> {
  const vp = card.victoryPoints;
  // Fixed points are printed; points from resources on the card start at 0 and grow later
  if (vp === undefined || typeof vp !== 'object' || vp.resourcesHere !== undefined) {
    return [];
  }
  const countable = vp as Exclude<Countable, number>;
  return [{basis: countBasis(player, card, countable, 'vps', false), gains: [{resource: 'vp', amount: card.getVictoryPoints(player)}]}];
}

// ---------- Global parameter tracks ----------

type TrackRaise = {parameter: keyof GlobalParameterTracks, from: number, to: number};

/** Mirrors Game.increaseTemperature / increaseOxygenLevel / increaseVenusScaleLevel and grantGlobalParameterTrackBonuses. */
function trackBonusImpact(player: IPlayer, global: NonNullable<Behavior['global']>): Array<CardImpactLine> {
  const game = player.game;
  const raises: Array<TrackRaise> = [];
  if (global.temperature !== undefined && global.temperature > 0) {
    const from = game.getTemperature();
    raises.push({parameter: 'temperature', from, to: Math.min(game.max.temperature, from + global.temperature * 2)});
  }
  if (global.oxygen !== undefined && global.oxygen > 0) {
    const from = game.getOxygenLevel();
    raises.push({parameter: 'oxygen', from, to: Math.min(game.max.oxygen, from + global.oxygen)});
  }
  if (global.venus !== undefined && global.venus > 0) {
    const from = game.getVenusScaleLevel();
    raises.push({parameter: 'venus', from, to: Math.min(game.max.venus, from + global.venus * 2)});
  }

  const lines: Array<CardImpactLine> = [];
  let temperature = game.getTemperature();
  for (const raise of raises) {
    const crossed = game.globalParameterTracks[raise.parameter].filter((threshold) => raise.from < threshold.value && raise.to >= threshold.value);
    if (raise.parameter === 'temperature') {
      temperature = raise.to;
    }
    if (crossed.length === 0) {
      continue;
    }
    const gains: Array<CardImpactAmount> = [];
    for (const {bonus} of crossed) {
      // An oxygen bonus raises the temperature one step, which can cross a temperature bonus itself
      if (bonus === 'temperature' && temperature < game.max.temperature) {
        gains.push({resource: 'temperature', amount: 1}, {resource: 'tr', amount: 1});
        const next = temperature + 2;
        for (const cascade of game.globalParameterTracks.temperature.filter((t) => temperature < t.value && next >= t.value)) {
          addTrackBonus(player, cascade.bonus, gains);
        }
        temperature = next;
      } else if (bonus !== 'temperature') {
        addTrackBonus(player, bonus, gains);
      }
    }
    if (gains.length > 0) {
      lines.push({basis: {type: 'trackBonus', parameter: raise.parameter, values: crossed.map((t) => t.value)}, gains: mergeAmounts(gains)});
    }
  }
  return lines;
}

function addTrackBonus(player: IPlayer, bonus: GlobalParameterTracks['temperature'][number]['bonus'], gains: Array<CardImpactAmount>) {
  // Player benefits are skipped during the solar phase (grantGlobalParameterTrackBonuses)
  const solar = player.game.phase === Phase.SOLAR;
  switch (bonus) {
  case 'heatproduction':
    if (!solar) {
      gains.push({resource: 'heat', amount: 1, production: true});
    }
    break;
  case 'plant':
    if (!solar) {
      gains.push({resource: 'plants', amount: 1, production: true});
    }
    break;
  case 'drawcard':
    if (!solar) {
      gains.push({resource: 'cards', amount: 1});
    }
    break;
  case 'colony':
    if (!solar) {
      gains.push({resource: 'colony', amount: 1});
    }
    break;
  case 'tr':
    if (!solar) {
      gains.push({resource: 'tr', amount: 1});
    }
    break;
  case 'ocean':
    if (player.game.canAddOcean()) {
      gains.push({resource: 'ocean', amount: 1}, {resource: 'tr', amount: 1});
    }
    break;
  }
}

/** Same resource and kind added up, order kept (e.g. two heat production bonuses become +2). */
function mergeAmounts(amounts: ReadonlyArray<CardImpactAmount>): Array<CardImpactAmount> {
  const merged: Array<CardImpactAmount> = [];
  for (const amount of amounts) {
    const existing = merged.find((m) => m.resource === amount.resource && m.production === amount.production);
    if (existing !== undefined) {
      existing.amount += amount.amount;
    } else {
      merged.push({...amount});
    }
  }
  return merged;
}

// ---------- Attacks ----------

function playerOf(target: IPlayer): CardImpactPlayer {
  return {color: target.color, name: target.name};
}

/** One attack option as a line, or nothing when no opponent has anything of the resource. */
function attackLine(resource: CardImpactResource, max: number, targets: ReadonlyArray<CardImpactTarget>): Array<CardImpactLine> {
  return targets.some((target) => target.empty !== true) ? [{basis: {type: 'attack', resource, max}, gains: [], targets}] : [];
}

function emptyTarget(target: IPlayer): CardImpactTarget {
  return {player: playerOf(target), amount: 0, empty: true};
}

/** Mirrors RemoveAnyPlants: only opponents with plants, protections that block or reduce the loss (lossAfterProtection). */
function removePlantsImpact(player: IPlayer, count: number): Array<CardImpactLine> {
  if (player.game.isSoloMode()) {
    return [];
  }
  const targets = player.opponents.map((target): CardImpactTarget => {
    if (target.plants === 0) {
      return emptyTarget(target);
    }
    if (target.plantsAreProtected()) {
      return {player: playerOf(target), amount: 0, protected: true};
    }
    return {player: playerOf(target), amount: target.lossAfterProtection(Resource.PLANTS, Math.min(target.plants, count))};
  });
  return attackLine('plants', count, targets);
}

/** Steal or remove up to `max` of a standard resource from one opponent, like Hired Raiders and Sabotage do. */
function standardResourceAttack(player: IPlayer, resource: 'steel' | 'titanium' | 'megacredits', max: number): Array<CardImpactLine> {
  if (player.game.isSoloMode()) {
    return [];
  }
  const stockOf = (target: IPlayer) => resource === 'steel' ? target.steel : resource === 'titanium' ? target.titanium : target.megaCredits;
  const targets = player.opponents.map((target): CardImpactTarget => {
    if (stockOf(target) === 0) {
      return emptyTarget(target);
    }
    if (resource !== 'megacredits' && target.alloysAreProtected()) {
      return {player: playerOf(target), amount: 0, protected: true};
    }
    return {player: playerOf(target), amount: Math.min(max, stockOf(target))};
  });
  return attackLine(resource, max, targets);
}

// ---------- Cards with their own play code ----------

type BespokeImpact = (player: IPlayer, card: IProjectCard) => Array<CardImpactLine>;

/** Access to the copy candidates of Robotic Workforce (protected in RoboticWorkforceBase). */
type RoboticWorkforceCandidates = {
  getPlayableBuildingCards(player: IPlayer): ReadonlyArray<ICard>;
  productionBehavior(behavior: Behavior): Behavior;
};

const BESPOKE_IMPACTS: Partial<Record<CardName, BespokeImpact>> = {
  // TerraformingGanymede.bespokePlay: 1 + Jovian tags (wild tags count)
  [CardName.TERRAFORMING_GANYMEDE]: (player, card) => {
    const countable = {tag: Tag.JOVIAN};
    return [{basis: countBasis(player, card, countable, 'default', false), gains: [{resource: 'tr', amount: new Counter(player, card).count(countable)}]}];
  },
  // NitrogenRichAsteroid.bespokePlay: 4 plant production with 3 plant tags, else 1
  [CardName.NITROGEN_RICH_ASTEROID]: (player) => {
    const count = player.tags.count(Tag.PLANT);
    return [{basis: {type: 'threshold', tag: Tag.PLANT, count, needed: 3}, gains: [{resource: 'plants', amount: count >= 3 ? 4 : 1, production: true}]}];
  },
  // Insulation.bespokePlay: up to the whole heat production
  [CardName.INSULATION]: (player) => {
    const max = player.production.heat;
    return [{basis: {type: 'upTo', resource: 'heat', production: true, max},
      gains: [{resource: 'heat', amount: -max, production: true}, {resource: 'megacredits', amount: max, production: true}]}];
  },
  // RoboticWorkforce: every building card it can copy, with the production that copy would give now
  [CardName.ROBOTIC_WORKFORCE]: (player, card) => {
    const robotic = card as unknown as RoboticWorkforceCandidates;
    return robotic.getPlayableBuildingCards(player).map((candidate) => {
      const production = robotic.productionBehavior(candidate.behavior ?? {}).production ?? {};
      const units = new Counter(player, candidate).countUnits(production);
      const gains: Array<CardImpactAmount> = (Object.entries(units) as Array<[keyof Units, number]>)
        .filter(([, amount]) => amount !== 0)
        .map(([resource, amount]) => ({resource, amount, production: true}));
      return {basis: {type: 'card', card: candidate.name}, gains};
    });
  },
  // HiredRaiders: up to 2 steel or 3 M€ from one opponent
  [CardName.HIRED_RAIDERS]: (player) => [
    ...standardResourceAttack(player, 'steel', 2),
    ...standardResourceAttack(player, 'megacredits', 3),
  ],
  // Sabotage: up to 3 titanium, 4 steel or 7 M€ from one opponent
  [CardName.SABOTAGE]: (player) => [
    ...standardResourceAttack(player, 'titanium', 3),
    ...standardResourceAttack(player, 'steel', 4),
    ...standardResourceAttack(player, 'megacredits', 7),
  ],
  // Virus: up to 2 animals from a card, or up to 5 plants (RemoveResourcesFromCard / RemoveAnyPlants)
  [CardName.VIRUS]: (player) => {
    if (player.game.isSoloMode()) {
      return [];
    }
    // Animals come off one card: per opponent the most that can be taken from one of their cards
    const animalCards = RemoveResourcesFromCard.getAvailableTargetCards(player, CardResource.ANIMAL, 'opponents');
    const animalTargets = player.opponents.map((target): CardImpactTarget => {
      const most = Math.max(0, ...animalCards.filter((card) => target.tableau.has(card.name)).map((card) => card.resourceCount));
      return most === 0 ? emptyTarget(target) : {player: playerOf(target), amount: Math.min(2, most)};
    });
    const animals = attackLine(CardResource.ANIMAL, 2, animalTargets);
    return [...animals, ...removePlantsImpact(player, 5)];
  },
};
