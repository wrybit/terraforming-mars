import {expect} from 'chai';
import {activeParticipants, applyServerStatus, markServerUpdating, resetServerStatus, serverUpdateCommits, serverUpdatePhase} from '@/client/utils/serverStatus';

describe('serverStatus', () => {
  beforeEach(() => resetServerStatus());

  it('stays quiet while the same server answers', () => {
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1});
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1});
    expect(serverUpdatePhase.value).eq('none');
  });

  it('freezes on an announced update and offers the reload once the new server answers', () => {
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1});
    applyServerStatus({updating: true, startedAt: 1, activeParticipants: 1});
    expect(serverUpdatePhase.value).eq('updating');
    applyServerStatus({updating: false, startedAt: 2, activeParticipants: 0});
    expect(serverUpdatePhase.value).eq('done');
  });

  it('notices a restart even when the announcement was missed', () => {
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1});
    applyServerStatus({updating: false, startedAt: 2, activeParticipants: 1});
    expect(serverUpdatePhase.value).eq('done');
  });

  it('unfreezes when the announcement is withdrawn without a restart', () => {
    applyServerStatus({updating: true, startedAt: 1, activeParticipants: 1});
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1});
    expect(serverUpdatePhase.value).eq('none');
  });

  it('a refused input freezes the page', () => {
    markServerUpdating();
    expect(serverUpdatePhase.value).eq('updating');
  });

  it('keeps the number of players online for the start page', () => {
    expect(activeParticipants.value).is.undefined;
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 3});
    expect(activeParticipants.value).eq(3);
  });

  it('keeps the commits of the update for the notice, not afterwards', () => {
    const commits = [{hash: 'abc1234', subject: 'Change'}];
    // A list from an earlier update is ignored while nothing happens
    applyServerStatus({updating: false, startedAt: 1, activeParticipants: 1, updateCommits: commits});
    expect(serverUpdateCommits.value).deep.eq([]);
    applyServerStatus({updating: true, startedAt: 1, activeParticipants: 1, updateCommits: commits});
    expect(serverUpdateCommits.value).deep.eq(commits);
    // New server without list (older script): the announced list stays
    applyServerStatus({updating: false, startedAt: 2, activeParticipants: 0});
    expect(serverUpdatePhase.value).eq('done');
    expect(serverUpdateCommits.value).deep.eq(commits);
  });
});
