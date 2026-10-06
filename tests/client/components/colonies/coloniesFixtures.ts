import {ColonyModel} from '@/common/models/ColonyModel';
import {ColonyName} from '@/common/colonies/ColonyName';

// Colony models for the colony board / trade tests
export function fakeColony(name: ColonyName, overrides: Partial<ColonyModel> = {}): ColonyModel {
  return {name, isActive: true, trackPosition: 1, colonies: [], visitor: undefined, ...overrides};
}
