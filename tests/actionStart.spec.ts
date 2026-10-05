import {expect} from 'chai';
import {testGame} from './TestGame';
import {TestPlayer} from './TestPlayer';
import {IGame} from '../src/server/IGame';
import {Phase} from '../src/common/Phase';
import {canCancelAction, cancellableActionStart, rememberActionStart} from '../src/server/actionStart';
import {SelectOption} from '../src/server/inputs/SelectOption';
import {Game} from '../src/server/Game';

describe('actionStart', () => {
  let game: IGame;
  let player: TestPlayer;
  let other: TestPlayer;

  beforeEach(() => {
    [game, player, other] = testGame(2);
    game.phase = Phase.ACTION;
    game.activePlayer = player;
    player.megaCredits = 30;
    rememberActionStart(player);
    // The action menu is shown, then the player starts an action (e.g. pays for the city standard project)
    game.inputsThisRound += 2;
    player.megaCredits -= 25;
    player.setWaitingFor(new SelectOption('Select space for city tile'));
  });

  it('can cancel a paid plan and returns the payment', () => {
    expect(canCancelAction(player)).is.true;
    const restored = Game.deserialize(cancellableActionStart(player)!);
    expect(restored.getPlayerById(player.id).megaCredits).eq(30);
  });

  it('not before the action has started', () => {
    rememberActionStart(player);
    expect(canCancelAction(player)).is.false;
  });

  it('not once a card was drawn', () => {
    player.drawCard();
    expect(canCancelAction(player)).is.false;
  });

  it('not once another player was affected', () => {
    other.plants += 2;
    expect(canCancelAction(player)).is.false;
  });

  it('only for the active player', () => {
    expect(canCancelAction(other)).is.false;
  });
});
