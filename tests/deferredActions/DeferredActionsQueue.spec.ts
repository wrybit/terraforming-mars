import {expect} from 'chai';
import {SimpleDeferredAction} from '../../src/server/deferredActions/DeferredAction';
import {DeferredActionsQueue} from '../../src/server/deferredActions/DeferredActionsQueue';
import {SelectOption} from '../../src/server/inputs/SelectOption';
import {testGame} from '../TestGame';
import {runAllActions} from '../TestingUtils';
import {Sabotage} from '../../src/server/cards/base/Sabotage';
import {CardName} from '../../src/common/cards/CardName';
import {Server} from '../../src/server/models/ServerModel';

describe('DeferredActionsQueue', () => {
  it('runs actions for player', () => {
    const [/* game */, player, otherPlayer] = testGame(2);

    const queue = new DeferredActionsQueue();
    const expectedInput = new SelectOption('foo', 'bar');
    queue.push(new SimpleDeferredAction(player, () => expectedInput));
    queue.push(new SimpleDeferredAction(otherPlayer, () => undefined));
    let finished = false;
    expect(queue).has.length(2);
    queue.runAllFor(player, () => {
      finished = true;
    });
    expect(player.getWaitingFor()).eq(expectedInput);
    player.process({type: 'option'});
    expect(player.getWaitingFor()).eq(undefined);
    expect(finished).eq(true);
    expect(queue).has.length(1);
  });

  it('remembers the card whose effect queued an action', () => {
    const [game, player, otherPlayer] = testGame(2);
    otherPlayer.steel = 4;

    player.playCard(new Sabotage());
    runAllActions(game);

    expect(player.getWaitingFor()?.sourceCard).eq(CardName.SABOTAGE);
    expect(Server.getWaitingFor(player, player.getWaitingFor())?.sourceCard).eq(CardName.SABOTAGE);
  });

  it('does not attach a card outside its effect', () => {
    const [/* game */, player] = testGame(2);

    const queue = new DeferredActionsQueue();
    queue.push(new SimpleDeferredAction(player, () => new SelectOption('foo', 'bar')));
    queue.runAll(() => {});

    expect(player.getWaitingFor()?.sourceCard).is.undefined;
  });
});
