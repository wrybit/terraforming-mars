// Recognises the server's trade input (Colonies.tradeWithColony): AndOptions of
// "Pay trade fee" (OrOptions of SelectOption) and "Select colony tile for trade" (SelectColony).
import {AndOptionsModel, OrOptionsModel, PlayerInputModel, SelectColonyModel} from '@/common/models/PlayerInputModel';
import {Message} from '@/common/logs/Message';

export type TradeInput = {
  fee: OrOptionsModel;
  colony: SelectColonyModel;
};

export function tradeInput(input: AndOptionsModel): TradeInput | undefined {
  const [fee, colony] = input.options;
  if (input.options.length !== 2 || fee?.type !== 'or' || colony?.type !== 'colony') {
    return undefined;
  }
  return {fee, colony};
}

export type FeeKind = 'megacredits' | 'energy' | 'titanium' | 'other';

// One way to pay: amount and resource from the option's message ("Pay ${0} energy")
export type TradeFee = {
  index: number;
  kind: FeeKind;
  amount: number | undefined;
  title: string | Message;
};

function feeKind(text: string): FeeKind {
  if (text.includes('M€')) {
    return 'megacredits';
  }
  if (text.includes('energy')) {
    return 'energy';
  }
  if (text.includes('titanium')) {
    return 'titanium';
  }
  return 'other';
}

export function tradeFees(fee: OrOptionsModel): Array<TradeFee> {
  return fee.options.map((option: PlayerInputModel, index) => {
    const title = option.title;
    const text = typeof title === 'string' ? title : title.message;
    const number = typeof title === 'string' ? undefined : title.data.find((data) => /^\d+$/.test(String(data.value)));
    return {index, kind: feeKind(text), amount: number !== undefined ? Number(number.value) : undefined, title};
  });
}

export const FEE_ICON: Record<FeeKind, string> = {
  megacredits: 'resources/megacredit.png',
  energy: 'resources/power.png',
  titanium: 'resources/titanium.png',
  other: 'resources/wild.png',
};

// Ways to pay the server does not offer right now (too few resources): shown greyed out next to the offered
// ones, so all three fees are always visible. Amounts follow the offered fees (a trade discount lowers all alike).
export type MissingFee = {kind: 'megacredits' | 'energy' | 'titanium', amount: number};

const BASE_FEE: Record<MissingFee['kind'], number> = {megacredits: 9, energy: 3, titanium: 3};

export function missingFees(fees: ReadonlyArray<TradeFee>): Array<MissingFee> {
  const known = fees.find((fee) => fee.kind !== 'other' && fee.amount !== undefined);
  const discount = known === undefined || known.kind === 'other' ? 0 : BASE_FEE[known.kind] - (known.amount ?? 0);
  return (Object.keys(BASE_FEE) as Array<MissingFee['kind']>)
    .filter((kind) => !fees.some((fee) => fee.kind === kind))
    .map((kind) => ({kind, amount: Math.max(0, BASE_FEE[kind] - discount)}));
}

