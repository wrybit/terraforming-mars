import {expect} from 'chai';
import {withScreenshotSetup} from '../../src/server/stats/screenshotSetup';
import {StatsGameDetails, StatsPlayerDetails} from '../../src/common/stats/StatsGame';
import {CardName} from '../../src/common/cards/CardName';

function player(name: string, cards: Array<CardName>, timeSeconds?: number): StatsPlayerDetails {
  return {name, cards, timeSeconds};
}

function screenshot(players: Array<StatsPlayerDetails>, shuffledBoard?: boolean): StatsGameDetails {
  return {source: 'screenshot', cardsComplete: false, boardName: undefined, shuffledBoard, expansions: [], players, milestones: [], awards: []};
}

describe('screenshotSetup', () => {
  it('visible corporations and cards prove their expansions', () => {
    const details = withScreenshotSetup(
      screenshot([player('Jens', [CardName.BIRDS]), player('Daniel', [CardName.TARDIGRADES])]),
      [CardName.CHEUNG_SHING_MARS, CardName.SATURN_SYSTEMS]);
    expect(details.expansions).to.have.members(['prelude', 'corpera']);
  });

  it('base game only stays base game; shuffled board and timers come along', () => {
    const details = withScreenshotSetup(screenshot([player('Jens', [CardName.BIRDS], 600), player('Daniel', [], 700)], true), [CardName.ECOLINE]);
    expect(details.expansions).deep.eq([]);
    expect(details.options?.shuffledBoard).is.true;
    expect(details.options?.showTimers).is.true;
    expect(details.options?.startingCorporations).is.undefined;
  });

  it('two corporations for one player mean Merger', () => {
    const details = withScreenshotSetup(screenshot([player('Jens', [])]), [CardName.ECOLINE, CardName.SATURN_SYSTEMS]);
    expect(details.options?.twoCorpsVariant).is.true;
    expect(details.expansions).to.include('prelude');
    expect(details.options?.showTimers).is.false;
  });
});
