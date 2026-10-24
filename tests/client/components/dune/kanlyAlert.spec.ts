import {expect} from 'chai';
import {claimKanlyAlert, isAttacked, kanlyAlertKey} from '@/client/components/dune/kanlyAlert';
import {KanlyModel} from '@/common/dune/DuneModel';

describe('kanlyAlert', () => {
  const kanly: KanlyModel = {
    garrisons: [],
    battle: {spaceId: '04' as any, owner: 'red', opener: 'yellow', troops: []},
    foughtThisGeneration: true,
  };

  it('only the owner of the war field is attacked, not its opener or a bystander', () => {
    expect(isAttacked(kanly, 'red')).is.true;
    expect(isAttacked(kanly, 'yellow')).is.false;
    expect(isAttacked(kanly, 'blue')).is.false;
    expect(isAttacked(kanly, undefined)).is.false;
    expect(isAttacked({...kanly, battle: undefined}, 'red')).is.false;
  });

  it('alerts once per battle', () => {
    const key = kanlyAlertKey('s1', 3, '04');
    localStorage.removeItem(key);
    expect(claimKanlyAlert(key)).is.true;
    expect(claimKanlyAlert(key)).is.false;
    expect(claimKanlyAlert(kanlyAlertKey('s1', 4, '04'))).is.true;
  });
});
