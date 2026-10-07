import {expect} from 'chai';
import {requiredByTooltip, requirementsOf} from '@/client/components/create/expansionDependencies';
import {Expansion, EXPANSIONS} from '@/common/cards/GameModule';

function selection(...on: Array<Expansion>): Record<Expansion, boolean> {
  return Object.fromEntries(EXPANSIONS.map((expansion) => [expansion, on.includes(expansion)])) as Record<Expansion, boolean>;
}

describe('expansionDependencies', () => {
  it('knows what an expansion needs', () => {
    expect(requirementsOf('pathfinders')).has.members(['colonies', 'turmoil']);
    expect(requirementsOf('venus')).is.empty;
  });

  it('explains a required tile only while the needing expansion is on', () => {
    expect(requiredByTooltip('colonies', selection('colonies', 'community'))).includes('Community');
    expect(requiredByTooltip('colonies', selection('colonies'))).is.undefined;
    expect(requiredByTooltip('colonies', selection('community'))).is.undefined;
  });
});
