import {Message} from '@/common/logs/Message';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {PartyName} from '@/common/turmoil/PartyName';

// Party choices the server offers as plain options instead of SelectParty
// (ChooseRulingPartyDeferred: The New Space Race, By-Election; An Offer You Can't Refuse: move a delegate;
// ChooseAlliedParty: Mars Frontier Alliance). OrOptions shows them as the same party cards as SelectParty
// (PartyOptions.vue, PartyCard.vue), so every party choice looks alike.
export type PartyChoiceOption = {
  index: number;
  party: PartyName;
  // "Do not move": the option keeps the delegate in the party that is missing among the named ones
  stays: boolean;
  // Mars Frontier Alliance names bonus and policy of the allied party in the title
  bonusText: string | undefined;
  policyText: string | undefined;
};

const PARTY_NAMES: ReadonlyArray<string> = Object.values(PartyName);
const STAY_TITLE = 'Do not move';
// ChooseAlliedParty.ts: "[Party] - Bonus: … -  Policy: …"
const ALLIED_TITLE = /^\[(.+?)\] - Bonus: (.*?) - +Policy: (.*)$/;

function titleText(title: string | Message): string {
  return typeof title === 'string' ? title : title.message;
}

function parseOption(option: PlayerInputModel, index: number): PartyChoiceOption | 'stay' | undefined {
  if (option.type !== 'option') {
    return undefined;
  }
  const title = titleText(option.title);
  if (title === STAY_TITLE) {
    return 'stay';
  }
  if (PARTY_NAMES.includes(title)) {
    return {index, party: title as PartyName, stays: false, bonusText: undefined, policyText: undefined};
  }
  const allied = ALLIED_TITLE.exec(title);
  if (allied !== null && PARTY_NAMES.includes(allied[1])) {
    return {index, party: allied[1] as PartyName, stays: false, bonusText: allied[2], policyText: allied[3]};
  }
  return undefined;
}

// Party cards for an OrOptions, or undefined when it is not a pure party choice
export function partyChoice(options: ReadonlyArray<PlayerInputModel>): Array<PartyChoiceOption> | undefined {
  if (options.length < 2) {
    return undefined;
  }
  const parsed = options.map(parseOption);
  if (parsed.some((entry) => entry === undefined)) {
    return undefined;
  }
  const cards = parsed.filter((entry): entry is PartyChoiceOption => typeof entry === 'object');
  const stayIndex = parsed.indexOf('stay');
  if (stayIndex !== -1) {
    const named = new Set(cards.map((card) => card.party));
    const current = Object.values(PartyName).find((party) => !named.has(party));
    if (current === undefined || parsed.lastIndexOf('stay') !== stayIndex) {
      return undefined;
    }
    cards.splice(stayIndex, 0, {index: stayIndex, party: current, stays: true, bonusText: undefined, policyText: undefined});
  }
  return cards.length > 0 ? cards : undefined;
}
