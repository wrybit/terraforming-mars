import {expect} from 'chai';
import {testGame} from '../TestGame';
import {DecisionRecord, setDecisionRecorder} from '../../src/server/ai/decisionTrace';
import {prepareHumanDecision} from '../../src/server/ai/humanDecisionTrace';
import {SelectCard} from '../../src/server/inputs/SelectCard';
import {AquiferPumping} from '../../src/server/cards/base/AquiferPumping';
import {IoMiningIndustries} from '../../src/server/cards/base/IoMiningIndustries';
import {CardName} from '../../src/common/cards/CardName';
import {InputResponse} from '../../src/common/inputs/InputResponse';

describe('humanDecisionTrace', () => {
  let records: Array<DecisionRecord>;

  beforeEach(() => {
    records = [];
    setDecisionRecorder((record) => records.push(record));
  });

  afterEach(() => {
    setDecisionRecorder(undefined);
  });

  function askForCard() {
    const [game, player] = testGame(2);
    player.cardsInHand.push(new AquiferPumping());
    const offer = new SelectCard('Select card', 'Save', [new AquiferPumping(), new IoMiningIndustries()]).andThen(() => undefined);
    player.setWaitingFor(offer);
    return {game, player};
  }

  it('records the offer, the hand and the answer', () => {
    const {game, player} = askForCard();
    const response: InputResponse = {type: 'card', cards: [CardName.IO_MINING_INDUSTRIES]};
    const pending = prepareHumanDecision(player, response, 4200);
    player.cardsInHand.length = 0;
    pending?.();

    expect(records).has.length(1);
    const record = records[0];
    expect(record.human).is.true;
    expect(record.kind).eq('human');
    expect(record.gameId).eq(game.id);
    expect(record.player).eq(player.name);
    // Hand as it was when the question was asked, not after the answer
    expect(record.state.hand).deep.eq([CardName.AQUIFER_PUMPING]);
    const offered = (record.input as {cards?: Array<{name: string}>}).cards?.map((card) => card.name);
    expect(offered).deep.eq([CardName.AQUIFER_PUMPING, CardName.IO_MINING_INDUSTRIES]);
    expect(record.response).deep.eq(response);
    expect(record.milliseconds).eq(4200);
  });

  it('records nothing without a recorder', () => {
    setDecisionRecorder(undefined);
    const {player} = askForCard();
    expect(prepareHumanDecision(player, {type: 'card', cards: []}, 0)).is.undefined;
  });
});
