import {LogMessageDataType} from '@/common/logs/LogMessageDataType';
import {ReplaySourceMessage, ReplaySourceModel} from '@/common/models/ReplaySourceModel';

// Since 18–20 Oct 2026 the server writes several log lines in a new form: resources and production as icons with a
// data type instead of words ("${0} gained ${1}${2}"), the payment of a card in brackets ("${0} played ${1} [ ${2} ]"),
// TR and ocean bonus as icons, and every gain of a card's own effect with "because of". The reconstruction reads the
// older form; this translates new lines into it, so both old and new games replay the same way.

// Paid resources of a card play, in the replay's order: M€, steel, titanium, plants, energy, heat
export type ReplayPayment = Array<number>;
export type ReplayMessage = ReplaySourceMessage & {payment?: ReplayPayment};

const PAYMENT_ICONS: Record<string, number> = {mc: 0, steel: 1, titanium: 2, plants: 3, heat: 5};

// "-3:r:mc: -1:r:steel:" → [3, 1, 0, 0, 0, 0]; other ways to pay (microbes, floaters …) don't count
export function parsePayment(text: string): ReplayPayment {
  const payment = [0, 0, 0, 0, 0, 0];
  for (const match of text.matchAll(/-(\d+):r:([a-z]+):/g)) {
    const index = PAYMENT_ICONS[match[2]];
    if (index !== undefined) {
      payment[index] += Number(match[1]);
    }
  }
  return payment;
}

const pick = (message: ReplaySourceMessage, ...indices: Array<number>) => indices.map((index) => message.data[index]);
const as = (message: ReplaySourceMessage, text: string, data = message.data): ReplayMessage => ({...message, message: text, data});

export function normalizeMessage(message: ReplaySourceMessage): ReplayMessage {
  const text = message.message;
  const kind = message.data[2]?.type;
  const production = kind === LogMessageDataType.PRODUCTION;
  switch (text) {
  case '${0} played ${1} [ ${2} ]':
    return {...as(message, '${0} played ${1}', pick(message, 0, 1)), payment: parsePayment(String(message.data[2]?.value ?? ''))};
  case '${0} gained ${1}${2}':
  case '${0} lost ${1}${2}':
  case '${0} gained ${1}${2} because of ${3}':
  case '${0} lost ${1}${2} because of ${3}': {
    if (kind === LogMessageDataType.CARD_RESOURCE) {
      return message;
    }
    const verb = text.includes(' lost ') ? 'lost' : 'gained';
    const cause = text.endsWith(' because of ${3}') ? ' because of ${3}' : '';
    return as(message, `\${0} ${verb} \${1} \${2}${production ? ' production' : ''}${cause}`);
  }
  case '${3} stole ${1} ${2} from ${0}':
    return production ? as(message, '${3} stole ${1} ${2} production from ${0}') : message;
  case '${0} gained ${1}:r:mc: from ${2} ocean(s)':
    return as(message, '${0} gained ${1} M€ from ${2} ocean(s)');
  case '${0} gained ${1}:i:tr:':
  case '${0} gained ${1}:i:tr: from ${2}':
    return as(message, '${0} gained ${1} TR', pick(message, 0, 1));
  case '${0} lost ${1}:i:tr:':
    return as(message, '${0} lost ${1} TR');
  case '${0} added ${1}${2} to ${3}':
    return as(message, '${0} added ${1} ${2} to ${3}');
  case '${0} removed ${1}${2} from ${3}\'s ${4}':
    return as(message, '${0} removed ${1} resource(s) from ${2}\'s ${3}', pick(message, 0, 1, 3, 4));
  default:
    return message;
  }
}

export function normalizeSource(source: ReplaySourceModel): ReplaySourceModel & {log: ReadonlyArray<ReplayMessage>} {
  return {...source, log: source.log.map(normalizeMessage)};
}
