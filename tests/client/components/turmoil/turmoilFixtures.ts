import {PartyName} from '@/common/turmoil/PartyName';
import {TurmoilModel} from '@/common/models/TurmoilModel';
import {fakePoliticalAgendasModel} from '../testHelpers';

// Turmoil with all six parties: Reds dominant with two neutral delegates, Greens ruling with one red delegate
export function fakeTurmoil(): TurmoilModel {
  const party = (name: PartyName, delegates: TurmoilModel['parties'][number]['delegates'] = [], partyLeader?: TurmoilModel['parties'][number]['partyLeader']) => ({name, delegates, partyLeader});
  return {
    dominant: PartyName.REDS,
    ruling: PartyName.GREENS,
    chairman: 'neutral',
    parties: [
      party(PartyName.MARS),
      party(PartyName.SCIENTISTS),
      party(PartyName.UNITY),
      party(PartyName.GREENS, [{color: 'red', number: 1}], 'red'),
      party(PartyName.REDS, [{color: 'neutral', number: 2}], 'neutral'),
      party(PartyName.KELVINISTS),
    ],
    lobby: ['red', 'blue'],
    reserve: [{color: 'red', number: 6}],
    distant: undefined,
    coming: undefined,
    current: undefined,
    politicalAgendas: fakePoliticalAgendasModel(),
    policyActionUsers: [],
  };
}
