import {expect} from 'chai';
import {colonyView, tradePreview} from '@/client/components/colonies/colonyView';
import {ColonyName} from '@/common/colonies/ColonyName';
import {fakeColony} from './coloniesFixtures';

describe('tradePreview', () => {
  it('shows the track value without a trade offset', () => {
    const luna = colonyView(fakeColony(ColonyName.LUNA, {trackPosition: 2}));
    expect(tradePreview(luna, 0)).deep.include({value: 4, baseValue: 4, raised: 0, optional: false});
  });

  it('adds the trade offset before reading the value', () => {
    const luna = colonyView(fakeColony(ColonyName.LUNA, {trackPosition: 2}));
    // Track values are 1, 2, 4, 7, 10, 13, 17
    expect(tradePreview(luna, 2)).deep.include({value: 10, baseValue: 4, raised: 2});
  });

  it('never raises Titania, whose rewards get worse', () => {
    const titania = colonyView(fakeColony(ColonyName.TITANIA, {trackPosition: 2}));
    expect(tradePreview(titania, 2)).deep.include({value: titania.tradeValue, raised: 0});
  });

  it('marks Europa as optional and shows the resource of the higher step', () => {
    const europa = colonyView(fakeColony(ColonyName.EUROPA, {trackPosition: 1}));
    const preview = tradePreview(europa, 2);
    expect(preview.raised).eq(2);
    expect(preview.optional).is.true;
    // Steps 0-1 give M€, steps 2-3 energy
    expect(preview.icon.src).eq('resources/power.png');
  });

  it('does not mark the raise optional when the server does not ask', () => {
    // Mercury steps 0-2 all give heat, so the server raises without asking
    const mercury = colonyView(fakeColony(ColonyName.MERCURY, {trackPosition: 1}));
    expect(tradePreview(mercury, 1)).deep.include({raised: 1, optional: false});
    // Hygiea steps 0-1 both give M€
    const hygiea = colonyView(fakeColony(ColonyName.HYGIEA, {trackPosition: 0}));
    expect(tradePreview(hygiea, 1)).deep.include({raised: 1, optional: false});
  });

  it('stops at the last track position', () => {
    const luna = colonyView(fakeColony(ColonyName.LUNA, {trackPosition: 5}));
    expect(tradePreview(luna, 4)).deep.include({value: 17, raised: 1});
  });
});
