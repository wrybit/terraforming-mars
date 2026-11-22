import {PlayerInput} from '../PlayerInput';
import {AndOptions} from '../inputs/AndOptions';
import {SelectAmount} from '../inputs/SelectAmount';
import {InputResponse} from '../../common/inputs/InputResponse';
import {SPEND_HEAT_TITLE, heatSplitError} from '../cards/colonies/StormCraftIncorporated';

/**
 * Stormcraft Incorporated pays heat with heat and floaters (2 heat each) in one AndOptions.
 * Answering each amount with its maximum overspends ("You cannot overspend heat") and the move fails,
 * so the split is searched here with the card's own rule. Floaters go first: they are worth nothing
 * else, while heat in stock stays usable for later conversions.
 */
export function heatPaymentResponse(input: PlayerInput): InputResponse | undefined {
  if (!(input instanceof AndOptions) || input.options.length !== 2) {
    return undefined;
  }
  const title = input.title;
  if (typeof title === 'string' || title.message !== SPEND_HEAT_TITLE) {
    return undefined;
  }
  const [heat, floaters] = input.options;
  if (!(heat instanceof SelectAmount) || !(floaters instanceof SelectAmount)) {
    return undefined;
  }
  const target = Number(title.data[0]?.value);
  if (!Number.isFinite(target)) {
    return undefined;
  }
  for (let floaterAmount = floaters.max; floaterAmount >= floaters.min; floaterAmount--) {
    for (let heatAmount = heat.min; heatAmount <= heat.max; heatAmount++) {
      if (heatSplitError(target, heatAmount, floaterAmount) === undefined) {
        return {type: 'and', responses: [{type: 'amount', amount: heatAmount}, {type: 'amount', amount: floaterAmount}]};
      }
    }
  }
  return undefined;
}
