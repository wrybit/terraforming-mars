import {Message} from '../../common/logs/Message';
import {BasePlayerInput} from '../PlayerInput';
import {InputResponse, isSelectTradeResponse} from '../../common/inputs/InputResponse';
import {SelectTradeModel, TradeGiveOption, TradeRate} from '../../common/models/PlayerInputModel';
import {TradePricing, pairGiveLimit, tradeRate} from '../../common/inputs/tradeRate';
import {Resource} from '../../common/Resource';
import {InputError} from './InputError';

/** What the player chose in a trade */
export type Trade = {
  give: Resource,
  giveAmount: number,
  get: Resource,
  getAmount: number,
};

/**
 * A whole trade in one input: the resource and amount the player gives, the resource and amount they get
 * (Dune expansion: CHOAM offer, black market, moving spice). Replaces chains of nested choices, so the client can
 * show both sides at once. A priced trade (fixed rate, or worth per resource) only allows whole multiples of the
 * rate of its pair (common/inputs/tradeRate.ts).
 */
export class SelectTrade extends BasePlayerInput<Trade> {
  constructor(
    title: string | Message,
    buttonLabel: string,
    public give: ReadonlyArray<TradeGiveOption>,
    public get: ReadonlyArray<Resource>,
    public maxGet: number,
    public pricing: TradePricing = {},
  ) {
    super('trade', title);
    this.buttonLabel = buttonLabel;
  }

  public toModel(): SelectTradeModel {
    return {
      title: this.title,
      buttonLabel: this.buttonLabel,
      type: 'trade',
      give: this.give,
      get: this.get,
      maxGet: this.maxGet,
      rate: this.pricing.rate,
      values: this.pricing.values,
      factor: this.pricing.factor,
      pairs: this.pricing.pairs,
    };
  }

  public process(input: InputResponse) {
    if (!isSelectTradeResponse(input)) {
      throw new InputError('Not a valid SelectTradeResponse');
    }
    const give = this.give.find((option) => option.resource === input.give);
    if (give === undefined) {
      throw new InputError('This resource cannot be given');
    }
    if (!this.get.includes(input.get) || input.get === input.give) {
      throw new InputError('This resource cannot be received');
    }
    for (const amount of [input.giveAmount, input.getAmount]) {
      if (typeof amount !== 'number' || !Number.isInteger(amount) || amount < 1) {
        throw new InputError('Amounts must be whole numbers of at least 1');
      }
    }
    const limit = Math.min(give.max, pairGiveLimit(this.pricing, input.give, input.get) ?? Infinity);
    if (input.giveAmount > limit) {
      throw new InputError('Amount to give too high (max ' + String(limit) + ')');
    }
    if (input.getAmount > this.maxGet) {
      throw new InputError('Amount to get too high (max ' + String(this.maxGet) + ')');
    }
    const rate = tradeRate(this.pricing, input.give, input.get);
    if (rate !== undefined) {
      const units = input.giveAmount / rate.give;
      if (!Number.isInteger(units) || input.getAmount !== units * rate.get) {
        throw new InputError('Amounts do not match the exchange rate');
      }
    }
    return this.cb({give: input.give, giveAmount: input.giveAmount, get: input.get, getAmount: input.getAmount});
  }
}

/** Largest number of whole rate units possible when giving `option` (with the own limit of the pair, if any) */
export function tradeUnits(option: TradeGiveOption, maxGet: number, rate: TradeRate, limit = Infinity): number {
  return Math.min(Math.floor(Math.min(option.max, limit) / rate.give), Math.floor(maxGet / rate.get));
}
