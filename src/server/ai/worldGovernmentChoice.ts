import {IPlayer} from '../IPlayer';
import {OrOptions} from '../inputs/OrOptions';
import {SelectSpace} from '../inputs/SelectSpace';
import {InputResponse} from '../../common/inputs/InputResponse';
import {playerView, withCopy} from './gameCopy';
import {relativeValue, valuationContext} from './stateValue';
import {handCardValues} from './cardValue';
import {spaceValue} from './spaceValue';
import {SpaceId} from '../../common/Types';

// World Government terraforming (solar phase, played with Venus Next): the first player raises one global
// parameter for free. The AI took the first option (temperature) every time. Strategy guides: raise Venus to
// prolong the game when the own engine is stronger, close the game when the rival's is; raise a parameter
// that unlocks own hand cards; never hand the rival a bonus step. Each option is tried on a copy of the
// game and valued like a move (relativeValue, with fresh hand values for unlocked requirements).

export const WORLD_GOVERNMENT_TITLE = 'Select action for World Government Terraforming';

function oceanSpace(input: SelectSpace, player: IPlayer): SpaceId | undefined {
  let best: {id: SpaceId, value: number} | undefined;
  for (const space of input.spaces) {
    const value = spaceValue(space, 'ocean', player);
    if (best === undefined || value > best.value) {
      best = {id: space.id, value};
    }
  }
  return best?.id;
}

/** The best World Government option, or undefined when no option could be tried. */
export function chooseWorldGovernment(input: OrOptions, player: IPlayer): InputResponse | undefined {
  const snapshot = playerView(player);
  const frozen = valuationContext(player.game, player);
  let best: {response: InputResponse, value: number} | undefined;
  input.options.forEach((option, index) => {
    let inner: InputResponse = {type: 'option'};
    if (option instanceof SelectSpace) {
      const spaceId = oceanSpace(option, player);
      if (spaceId === undefined) {
        return;
      }
      inner = {type: 'space', spaceId};
    }
    const response: InputResponse = {type: 'or', index, response: inner};
    const value = withCopy(snapshot, (copy): number | undefined => {
      const copyPlayer = copy.getPlayerById(player.id);
      const menu = copy.worldGovernmentTerraformingInput(copyPlayer);
      if (menu.options.length !== input.options.length) {
        return undefined;
      }
      try {
        menu.process(response, copyPlayer);
      } catch {
        return undefined;
      }
      return relativeValue(copyPlayer, {...frozen, handValues: handCardValues(copyPlayer), handOwner: copyPlayer.id});
    });
    if (value !== undefined && (best === undefined || value > best.value)) {
      best = {response, value};
    }
  });
  return best?.response;
}
