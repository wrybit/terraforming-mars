// Flat picture of everything that can blink: key (changeFlashKeys.ts) -> comparable value.
// Two snapshots of consecutive server updates show what another player changed.
import {ViewModel} from '@/common/models/PlayerModel';
import {SpaceModel} from '@/common/models/SpaceModel';
import {playerGoods} from '@/client/components/overview/playerGoods';
import {flashKeys} from '@/client/utils/changeFlashKeys';

export type ChangeSnapshot = Map<string, string>;

// Everything visible on a space: tile, owner, cubes and markers
function spaceValue(space: SpaceModel): string {
  return JSON.stringify([space.tileType, space.color, space.coOwner, space.cube, space.excavator, space.undergroundResource, space.gagarin, space.cathedral, space.nomads]);
}

export function changeSnapshot(view: ViewModel): ChangeSnapshot {
  const snapshot: ChangeSnapshot = new Map();
  const set = (key: string, value: unknown) => snapshot.set(key, typeof value === 'string' ? value : JSON.stringify(value));
  const game = view.game;

  for (const player of view.players) {
    for (const good of playerGoods(player)) {
      set(flashKeys.playerStock(player.color, good.type), good.count);
      set(flashKeys.playerProduction(player.color, good.type), good.production);
    }
    set(flashKeys.playerCounter(player.color, 'terraformRating'), player.terraformRating);
    set(flashKeys.playerCounter(player.color, 'victoryPoints'), player.victoryPointsBreakdown.total);
    set(flashKeys.playerCounter(player.color, 'cardsInHand'), player.cardsInHandNbr);
    set(flashKeys.playerCounter(player.color, 'playedCards'), player.tableau.length);
    for (const [tag, count] of Object.entries(player.tags)) {
      set(flashKeys.playerTag(player.color, tag), count);
    }
  }

  for (const space of game.spaces) {
    set(flashKeys.marsSpace(space.id), spaceValue(space));
  }
  set(flashKeys.globalParameter('temperature'), game.temperature);
  set(flashKeys.globalParameter('oxygen'), game.oxygenLevel);
  set(flashKeys.globalParameter('oceans'), game.oceans);
  set(flashKeys.globalParameter('venus'), game.venusScaleLevel);

  if (game.moon !== undefined) {
    for (const space of game.moon.spaces) {
      set(flashKeys.moonSpace(space.id), spaceValue(space));
    }
    set(flashKeys.moonRate('habitat'), game.moon.habitatRate);
    set(flashKeys.moonRate('mining'), game.moon.miningRate);
    set(flashKeys.moonRate('logistic'), game.moon.logisticRate);
  }

  // Only claiming and funding blink, not every score change in the table
  for (const milestone of game.milestones) {
    set(flashKeys.milestone(milestone.name), milestone.color ?? '');
  }
  for (const award of game.awards) {
    set(flashKeys.award(award.name), award.color ?? '');
  }

  for (const colony of game.colonies) {
    set(flashKeys.colony(colony.name), [colony.colonies, colony.trackPosition, colony.visitor, colony.isActive]);
  }

  if (game.turmoil !== undefined) {
    for (const party of game.turmoil.parties) {
      set(flashKeys.turmoilParty(party.name), [party.partyLeader, party.delegates]);
    }
    set(flashKeys.turmoil('ruling'), game.turmoil.ruling ?? '');
    set(flashKeys.turmoil('chairman'), game.turmoil.chairman ?? '');
    set(flashKeys.turmoil('lobby'), game.turmoil.lobby);
  }
  return snapshot;
}
