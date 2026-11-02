import {IPlayer} from '../IPlayer';
import {SelectColony} from '../inputs/SelectColony';
import {InputResponse} from '../../common/inputs/InputResponse';
import {IColony} from '../colonies/IColony';
import {playerView, withCopy} from './gameCopy';
import {relativeValue, valuationContext} from './stateValue';
import {handCardValues} from './cardValue';
import {isSimulating} from './simulationSandbox';
import {titleOf} from './quickResponse';

// Colonies expansion: the AI picked the colony to trade with or to build on at random. Trading and building are
// tried on a copy of the game and valued like a move (relativeValue), so the AI takes the colony whose trade income
// or placement bonus helps its position most. Inside simulations (thousands of rollouts) a copy per colony is too
// costly: there the colony with the furthest track marker wins a trade, the emptiest colony gets the new colony.
// Track moves, tile removal and new tiles keep the quick choice.

type ColonyIntent = 'trade' | 'build';

function intentOf(input: SelectColony): ColonyIntent | undefined {
  const title = titleOf(input).toLowerCase();
  if (input.buttonLabel === 'Build' || title.includes('build')) return 'build';
  if (title.includes('trade')) return 'trade';
  return undefined;
}

function apply(intent: ColonyIntent, colony: IColony, player: IPlayer): void {
  if (intent === 'build') {
    colony.addColony(player);
  } else {
    // The trade cost is already paid and equal for every colony: only the income and bonuses differ.
    colony.trade(player, {usesTradeFleet: false});
  }
}

function quickColony(intent: ColonyIntent, colonies: ReadonlyArray<IColony>): IColony {
  const score = (colony: IColony) => intent === 'trade' ? colony.trackPosition : -colony.colonies.length;
  return colonies.reduce((best, colony) => score(colony) > score(best) ? colony : best);
}

/** The colony to trade with or build on, or undefined for other colony choices. */
export function chooseColony(input: SelectColony, player: IPlayer): InputResponse | undefined {
  const intent = intentOf(input);
  if (intent === undefined || input.colonies.length === 0) {
    return undefined;
  }
  if (isSimulating() || input.colonies.length === 1) {
    return {type: 'colony', colonyName: quickColony(intent, input.colonies).name};
  }
  const snapshot = playerView(player);
  const frozen = valuationContext(player.game, player);
  let best: {colony: IColony, value: number} | undefined;
  for (const colony of input.colonies) {
    const value = withCopy(snapshot, (copy): number | undefined => {
      const copyPlayer = copy.getPlayerById(player.id);
      const copyColony = copy.colonies.find((candidate) => candidate.name === colony.name);
      if (copyColony === undefined) return undefined;
      try {
        apply(intent, copyColony, copyPlayer);
        copy.deferredActions.runAll(() => {});
      } catch {
        return undefined;
      }
      return relativeValue(copyPlayer, {...frozen, handValues: handCardValues(copyPlayer), handOwner: copyPlayer.id});
    });
    if (value !== undefined && (best === undefined || value > best.value)) {
      best = {colony, value};
    }
  }
  return {type: 'colony', colonyName: (best?.colony ?? quickColony(intent, input.colonies)).name};
}
