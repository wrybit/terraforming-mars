import {Message} from '../../common/logs/Message';
import {BasePlayerInput} from '../PlayerInput';
import {InputResponse, isSelectTradeResponse} from '../../common/inputs/InputResponse';
import {SelectTradeModel, TradeGiveOption, TradeRate} from '../../common/models/PlayerInputModel';
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
 * show both sides at once. With a rate the amounts must be whole multiples of it.
 */
export class SelectTrade extends BasePlayerInput<Trade> {
  constructor(
    title: string | Message,
    buttonLabel: string,
    public give: ReadonlyArray<TradeGiveOption>,
    public get: ReadonlyArray<Resource>,
    public maxGet: number,
    public rate?: TradeRate,
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
      rate: this.rate,
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
    if (input.giveAmount > give.max) {
      throw new InputError('Amount to give too high (max ' + String(give.max) + ')');
    }
    if (input.getAmount > this.maxGet) {
      throw new InputError('Amount to get too high (max ' + String(this.maxGet) + ')');
    }
    if (this.rate !== undefined) {
      const units = input.giveAmount / this.rate.give;
      if (!Number.isInteger(units) || input.getAmount !== units * this.rate.get) {
        throw new InputError('Amounts do not match the exchange rate');
      }
    }
    return this.cb({give: input.give, giveAmount: input.giveAmount, get: input.get, getAmount: input.getAmount});
  }
}

/** Largest number of whole rate units possible when giving `option` */
export function tradeUnits(option: TradeGiveOption, maxGet: number, rate: TradeRate): number {
  return Math.min(Math.floor(option.max / rate.give), Math.floor(maxGet / rate.get));
}
