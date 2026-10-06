// Shared pieces of the Turmoil board tab and the delegate tab: party colours and pictures, delegates as figures,
// policy/bonus texts and a simple forecast of what sending a delegate changes.
import {reactive} from 'vue';
import {PartyName} from '@/common/turmoil/PartyName';
import {PartyModel, TurmoilModel} from '@/common/models/TurmoilModel';
import {Color} from '@/common/Color';
import {BonusId, PolicyId} from '@/common/turmoil/Types';
import {getAgenda} from '@/client/turmoil/ClientAgendaManifest';

// Party colours as on the committee board
export const PARTY_COLOR: Record<PartyName, string> = {
  [PartyName.MARS]: '#b0703a',
  [PartyName.SCIENTISTS]: '#bdbdb8',
  [PartyName.UNITY]: '#3d74b8',
  [PartyName.GREENS]: '#4e9a3c',
  [PartyName.REDS]: '#c2412f',
  [PartyName.KELVINISTS]: '#6c6366',
};

export function partyImage(party: PartyName): string {
  return 'assets/parties/' + party.toLowerCase().replace(/ /g, '-') + '.png';
}

// Delegates as acrylic astronauts in the player colour (baked like the cubes and shuttles)
const FIGURE_COLORS: ReadonlyArray<string> = ['red', 'yellow', 'green', 'black', 'blue', 'purple', 'orange', 'pink', 'neutral'];
export function figureImage(color: Color | undefined): string {
  return 'assets/acrylic/astronaut-' + (color !== undefined && FIGURE_COLORS.includes(color) ? color : 'neutral') + '.png';
}

// One entry per delegate (the model counts them per colour)
export function delegatesOf(party: PartyModel): Array<Color> {
  return party.delegates.flatMap((delegate) => Array.from({length: delegate.number}, () => delegate.color));
}

// Delegates on the seats: all except the leader (who sits on the leader seat)
export function seatedDelegates(party: PartyModel): Array<Color> {
  const delegates = delegatesOf(party);
  const leader = party.partyLeader === undefined ? -1 : delegates.indexOf(party.partyLeader);
  if (leader >= 0) {
    delegates.splice(leader, 1);
  }
  return delegates;
}

export type PartyAgenda = {policy: PolicyId | undefined, bonus: BonusId | undefined};

const AGENDA_KEY: Record<PartyName, 'marsFirst' | 'scientists' | 'unity' | 'greens' | 'reds' | 'kelvinists'> = {
  [PartyName.MARS]: 'marsFirst',
  [PartyName.SCIENTISTS]: 'scientists',
  [PartyName.UNITY]: 'unity',
  [PartyName.GREENS]: 'greens',
  [PartyName.REDS]: 'reds',
  [PartyName.KELVINISTS]: 'kelvinists',
};

export function partyAgenda(turmoil: TurmoilModel, party: PartyName): PartyAgenda {
  const agenda = turmoil.politicalAgendas?.[AGENDA_KEY[party]];
  return {policy: agenda?.policyId, bonus: agenda?.bonusId};
}

export function agendaText(id: PolicyId | BonusId | undefined): string {
  return id === undefined ? '' : getAgenda(id)?.description ?? '';
}

function countOf(party: PartyModel, color: Color): number {
  return party.delegates.find((delegate) => delegate.color === color)?.number ?? 0;
}

function totalOf(party: PartyModel): number {
  return party.delegates.reduce((sum, delegate) => sum + delegate.number, 0);
}

// Influence from the board alone: chairman, leader of the dominant party, a further delegate there
function boardInfluence(turmoil: TurmoilModel, dominant: PartyName | undefined, leaders: Map<PartyName, Color | undefined>, counts: (party: PartyName) => number, color: Color): number {
  const isLeader = dominant !== undefined && leaders.get(dominant) === color;
  const delegates = dominant === undefined ? 0 : counts(dominant);
  return (turmoil.chairman === color ? 1 : 0) + (isLeader ? 1 : 0) + (delegates - (isLeader ? 1 : 0) > 0 ? 1 : 0);
}

export type DelegateForecast = {
  becomesLeader: boolean;
  becomesDominant: boolean;
  influenceGain: number;
};

// What sending one own delegate to the party changes (leader, dominance, influence)
export function delegateForecast(turmoil: TurmoilModel, party: PartyName, color: Color): DelegateForecast {
  const target = turmoil.parties.find((candidate) => candidate.name === party);
  if (target === undefined) {
    return {becomesLeader: false, becomesDominant: false, influenceGain: 0};
  }
  const leaders = new Map(turmoil.parties.map((candidate) => [candidate.name, candidate.partyLeader]));
  const before = (name: PartyName) => {
    const candidate = turmoil.parties.find((entry) => entry.name === name);
    return candidate === undefined ? 0 : countOf(candidate, color);
  };
  const after = (name: PartyName) => before(name) + (name === party ? 1 : 0);

  const leaderCount = target.partyLeader === undefined ? 0 : countOf(target, target.partyLeader);
  const becomesLeader = target.partyLeader !== color && (target.partyLeader === undefined || after(party) > leaderCount);
  const leadersAfter = new Map(leaders);
  if (becomesLeader) {
    leadersAfter.set(party, color);
  }
  const dominantParty = turmoil.parties.find((candidate) => candidate.name === turmoil.dominant);
  const becomesDominant = turmoil.dominant !== party && totalOf(target) + 1 > (dominantParty === undefined ? 0 : totalOf(dominantParty));
  const dominantAfter = becomesDominant ? party : turmoil.dominant;
  const influenceGain = boardInfluence(turmoil, dominantAfter, leadersAfter, after, color) - boardInfluence(turmoil, turmoil.dominant, leaders, before, color);
  return {becomesLeader, becomesDominant, influenceGain};
}

// Party picked in the delegate tab: the Turmoil board outlines it
export const turmoilPickState = reactive({
  pick: undefined as PartyName | undefined,
});
