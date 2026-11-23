// The Rust bot's answer (a chain of contract choices, see the lab repo's core/src/bot/contract.rs) as a TS input
// response. Nested inputs that need their own decision take the next element of the chain.
import {titleOf} from './rustSteps';

export type ContractChoice = Record<string, any>;

const PAYMENT_KEYS = ['auroraiData', 'floaters', 'graphene', 'heat', 'kuiperAsteroids', 'lunaArchivesScience',
  'megacredits', 'microbes', 'plants', 'seeds', 'spireScience', 'steel', 'titanium'];

function payment(contract: any): Record<string, number> {
  const result: Record<string, number> = {};
  for (const key of PAYMENT_KEYS) {
    result[key] = contract?.[key] ?? 0;
  }
  return result;
}

/** Option of the action menu for a "menu" choice. */
function menuIndex(options: Array<any>, option: string, choice: ContractChoice = {}): number {
  const titles = options.map((candidate) => titleOf(candidate));
  // Dune bazaar: one option per ware ("Bazaar: buy <ware>")
  if (option === 'Bazaar: buy' && choice.ware !== undefined) {
    return titles.findIndex((title) => title === `Bazaar: buy ${choice.ware}` || title.startsWith(`Bazaar: buy ${choice.ware} for `));
  }
  // CHOAM: a single move may stand in the menu itself ("CHOAM: trade with the guild") instead of a CHOAM sub-menu
  if (option === 'CHOAM' && typeof choice.name === 'string' && titles.includes(choice.name)) {
    return titles.indexOf(choice.name);
  }
  const matches = (title: string) => {
    switch (option) {
    case 'Pass': return title === 'Pass for this generation' || title.startsWith('Don\'t');
    case 'Convert plants': return !title.startsWith('Don\'t') && (title.includes('plants') || title.includes('greenery'));
    case 'Convert heat': return title.startsWith('Convert') && title.includes('heat');
    case 'Fund an award': return title.startsWith('Fund an award');
    // "(from lobby)" or "(from reserve)" follows when the delegate's source matters
    case 'Send a delegate in an area': return title.startsWith('Send a delegate in an area');
    case 'Turmoil party action': return title.includes('(Turmoil ');
    default: return title === option;
    }
  };
  return titles.findIndex(matches);
}

/**
 * The TS response for `input` from the bot's chain of choices, starting at `chain[position]`.
 * Nested inputs that need their own decision take the next chain element.
 */
export function responseFor(input: any, chain: Array<ContractChoice>, position = 0): any {
  let choice = chain[position];
  if (choice === undefined) {
    throw new Error(`no bot choice for ${titleOf(input)}`);
  }
  // Buying cards: TS asks for the cards and the payment separately, the bot answers both with the same chain
  // (cards, then payment). The payment question takes the payment element, otherwise it would pay nothing.
  if (input.type === 'payment' && choice.kind !== 'payment') {
    const paymentPosition = chain.findIndex((candidate, index) => index > position && candidate.kind === 'payment');
    if (paymentPosition >= 0) {
      choice = chain[paymentPosition];
    }
  }
  switch (input.type) {
  case 'initialCards': {
    const responses = input.options.map((option: any) => {
      if (option === input.inputs.corp) {
        return {type: 'card', cards: [choice.corporation]};
      }
      if (option === input.inputs.prelude) {
        return {type: 'card', cards: choice.preludes};
      }
      return {type: 'card', cards: choice.cards};
    });
    return {type: 'initialCards', responses};
  }
  case 'or': {
    let index = -1;
    if (choice.kind === 'menu') {
      index = menuIndex(input.options, choice.option, choice);
    } else if (choice.kind === 'index') {
      index = choice.index;
    } else if (choice.kind === 'title') {
      index = input.options.findIndex((option: any) => titleOf(option) === choice.text);
    } else {
      // A choice for an inner input (e.g. a player, card or space of the only sensible option)
      index = input.options.findIndex((option: any) => option.type === typeFor(choice));
      if (index >= 0) {
        return {type: 'or', index, response: responseFor(input.options[index], chain, position)};
      }
    }
    if (index < 0 || index >= input.options.length) {
      throw new Error(`bot option ${JSON.stringify(choice)} not in ${input.options.map((option: any) => titleOf(option)).join(' | ')}`);
    }
    const option = input.options[index];
    return {type: 'or', index, response: innerResponse(option, choice, chain, position)};
  }
  case 'card':
    return {type: 'card', cards: choice.cards ?? []};
  case 'and': {
    // resources of choice (Turmoil events, alternative Venus board, Stormcraft): one amount per resource in TS order
    if (choice.kind === 'amounts') {
      return {type: 'and', responses: input.options.map((_option: any, index: number) => ({type: 'amount', amount: choice.amounts[index] ?? 0}))};
    }
    // Parts the bot decides one after the other but TS asks together (Floating Trade Hub: amount + resource;
    // Focused Organization: resource + card to discard): each part takes the next unused fitting choice of the chain.
    // Unused, because a follow-up question of the same kind often comes next and would otherwise replace the part
    const partKinds: Record<string, string> = {amount: 'amount', resource: 'resource', card: 'cards'};
    if (input.options.every((part: any) => partKinds[part.type] !== undefined)) {
      const rest = chain.slice(position);
      const used = new Set<number>();
      return {type: 'and', responses: input.options.map((part: any) => {
        const index = rest.findIndex((item: any, itemIndex) => !used.has(itemIndex) && item.kind === partKinds[part.type]);
        if (index < 0) {
          throw new Error(`bot chain ${JSON.stringify(rest)} has no ${part.type} for ${titleOf(input)}`);
        }
        used.add(index);
        const found: any = rest[index];
        switch (part.type) {
        case 'amount': return {type: 'amount', amount: found.amount};
        case 'resource': return {type: 'resource', resource: found.resource};
        default: return {type: 'card', cards: found.cards ?? []};
        }
      })};
    }
    // with the parts: an "and" input often has no title of its own
    throw new Error(`bot choice ${JSON.stringify(choice)} does not fit ${titleOf(input)} [${input.options.map((part: any) => `${part.type}: ${titleOf(part)}`).join(' | ')}]; chain ${JSON.stringify(chain.slice(position))}`);
  }
  case 'projectCard':
    return {type: 'projectCard', card: choice.card, payment: payment(choice.payment)};
  case 'space':
    return {type: 'space', spaceId: choice.space};
  case 'player':
    return {type: 'player', player: choice.color};
  case 'delegate':
    return {type: 'delegate', player: choice.color};
  case 'amount':
    return {type: 'amount', amount: choice.amount};
  case 'payment':
    return {type: 'payment', payment: payment(choice.payment)};
  case 'option':
    return {type: 'option'};
  case 'party':
    return {type: 'party', partyName: choice.party};
  case 'colony':
    return {type: 'colony', colonyName: choice.colony};
  case 'resource':
    return {type: 'resource', resource: choice.resource};
  case 'trade':
    return {type: 'trade', ...choice.trade};
  // Philares: amounts per resource (TS SelectResources), the bot answers them split already
  case 'resources':
    return {type: 'resources', units: choice.units};
  default:
    throw new Error(`input type ${input.type} (${titleOf(input)}) not supported by the bridge, choice ${JSON.stringify(choice)}`);
  }
}

/** The answer of a sub-menu option's own input (CHOAM: trade, payment or nothing). */
function menuLeaf(input: any, choice: ContractChoice): any {
  switch (input.type) {
  case 'trade': return {type: 'trade', ...choice.trade};
  case 'payment': return {type: 'payment', payment: payment(choice.payment)};
  case 'space': return {type: 'space', spaceId: choice.space};
  default: return {type: 'option'};
  }
}

function typeFor(choice: ContractChoice): string {
  switch (choice.kind) {
  case 'cards': return 'card';
  case 'space': return 'space';
  case 'player': return 'player';
  case 'amount': return 'amount';
  case 'payment': return 'payment';
  case 'projectCard': return 'projectCard';
  case 'party': return 'party';
  case 'colony': return 'colony';
  case 'resource': return 'resource';
  default: return '?';
  }
}

// Colonies trade fee as the Rust bot numbers it (core/src/game/colonies.rs FEE_*) and the TS option text
const FEE_TEXT: Record<number, (title: string) => boolean> = {
  0: (title) => title.includes('M€'),
  1: (title) => title.includes('energy'),
  2: (title) => title.includes('titanium'),
  3: (title) => !title.includes('M€') && !title.includes('energy') && !title.includes('titanium'),
};

/** Colonies trade: the fee option and the colony tile (TS asks both in one AndOptions). */
function tradeResponse(option: any, choice: ContractChoice): any {
  const [feeInput, colonyInput] = option.options;
  const index = feeInput.options.findIndex((candidate: any) => FEE_TEXT[choice.fee as number]?.(titleOf(candidate)));
  if (index < 0) {
    throw new Error(`trade fee ${choice.fee} not in ${feeInput.options.map((candidate: any) => titleOf(candidate)).join(' | ')}`);
  }
  return {type: 'and', responses: [{type: 'or', index, response: {type: 'option'}}, {type: 'colony', colonyName: choice.colony ?? colonyInput?.colonies?.[0]?.name}]};
}

/** Response for the option chosen in an OrOptions. */
function innerResponse(option: any, choice: ContractChoice, chain: Array<ContractChoice>, position: number): any {
  if (option.type === 'option') {
    return {type: 'option'};
  }
  if (choice.kind === 'menu') {
    if (choice.option === 'CHOAM' && titleOf(option) === choice.name) {
      return menuLeaf(option, choice);
    }
    if (choice.option === 'Trade with a colony tile' && option.type === 'and') {
      return tradeResponse(option, choice);
    }
    switch (option.type) {
    case 'projectCard': {
      if (choice.project !== undefined) {
        const card = option.cards.find((candidate: any) => candidate.name === choice.project || candidate.name === `${choice.project}:SP`);
        return {type: 'projectCard', card: card?.name ?? choice.project, payment: payment(choice.payment)};
      }
      return {type: 'projectCard', card: choice.card, payment: payment(choice.payment)};
    }
    case 'card':
      return {type: 'card', cards: choice.cards ?? []};
    case 'or': {
      // a sub-menu option by name (milestones, awards, CHOAM tabs) or by prefix and suffix (CHOAM tribute)
      const index = option.options.findIndex((candidate: any) => {
        const title = titleOf(candidate);
        return choice.name !== undefined && choice.name !== null ? title === choice.name :
          title.startsWith(choice.prefix ?? '') && title.endsWith(choice.suffix ?? '');
      });
      if (index < 0) {
        throw new Error(`bot option ${JSON.stringify(choice)} not in ${option.options.map((candidate: any) => titleOf(candidate)).join(' | ')}`);
      }
      return {type: 'or', index, response: menuLeaf(option.options[index], choice)};
    }
    case 'payment':
      return {type: 'payment', payment: payment(choice.payment)};
    case 'amount':
      if (choice.amount !== undefined) {
        return {type: 'amount', amount: choice.amount};
      }
      return responseFor(option, chain, position + 1);
    case 'party':
      if (choice.party !== undefined) {
        return {type: 'party', partyName: choice.party};
      }
      return responseFor(option, chain, position + 1);
    case 'space':
      if (choice.space !== undefined) {
        return {type: 'space', spaceId: choice.space};
      }
      return responseFor(option, chain, position + 1);
    default:
      // e.g. the greenery space inside "Convert plants": the next choice of the chain
      return responseFor(option, chain, position + 1);
    }
  }
  // a card named with the option (alternative Venus board: the wild resource on a card)
  if (option.type === 'card' && Array.isArray(choice.cards)) {
    return {type: 'card', cards: choice.cards};
  }
  // a payment the bot does not ask as a choice of its own (only M€ possible, St. Joseph of Cupertino Mission: pay 2 M€
  // to draw a card): the amount in M€
  if (option.type === 'payment' && chain[position + 1] === undefined) {
    return {type: 'payment', payment: payment({megacredits: option.amount})};
  }
  return responseFor(option, chain, position + 1);
}
