import {expect} from 'chai';
import {BannedDelegate} from '../../../src/server/cards/turmoil/BannedDelegate';
import {IGame} from '../../../src/server/IGame';
import {OrOptions} from '../../../src/server/inputs/OrOptions';
import {SelectDelegate} from '../../../src/server/inputs/SelectDelegate';
import {SelectOption} from '../../../src/server/inputs/SelectOption';
import {PlayerInput} from '../../../src/server/PlayerInput';
import {PartyName} from '../../../src/common/turmoil/PartyName';
import {Turmoil} from '../../../src/server/turmoil/Turmoil';
import {cast} from '@/common/utils/utils';
import {TestPlayer} from '../../TestPlayer';
import {testGame} from '../../TestingUtils';

function titleOf(input: PlayerInput): string {
  return typeof input.title === 'string' ? input.title : input.title.message;
}

describe('Banned Delegate', () => {
  let card: BannedDelegate;
  let player: TestPlayer;
  let player2: TestPlayer;
  let game: IGame;
  let turmoil: Turmoil;

  beforeEach(() => {
    card = new BannedDelegate();
    [game, player, player2] = testGame(2, {turmoilExtension: true});
    turmoil = game.turmoil!;
  });

  it('Cannot play', () => {
    turmoil.chairman = player2;
    expect(card.canPlay(player)).is.not.true;
  });

  it('Should play', () => {
    turmoil.chairman = player;
    expect(card.canPlay(player)).is.true;

    const greens = turmoil.getPartyByName(PartyName.GREENS);
    turmoil.sendDelegateToParty(player, PartyName.GREENS, game);
    turmoil.sendDelegateToParty(player2, PartyName.GREENS, game);

    // By putting 2 delegates in the Reds party, Reds is a second option.
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.REDS, game);
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.REDS, game);

    const initialDelegatesCount = greens.delegates.size;

    // The party is an explicit choice: party names as plain options (rendered as party cards)
    const orOptions = cast(card.play(player), OrOptions);
    expect(orOptions.options.map(titleOf)).has.members([PartyName.GREENS, PartyName.REDS]);

    const greensOption = orOptions.options.find((option) => titleOf(option) === PartyName.GREENS);
    const selectDelegate = cast(cast(greensOption, SelectOption).cb(undefined), SelectDelegate);
    // The party leader is not a valid target
    expect(selectDelegate.players).has.members([player2]);

    selectDelegate.cb(selectDelegate.players[0]);

    expect(greens.delegates.size).eq(initialDelegatesCount - 1);
  });

  it('Removes duplicates', () => {
    turmoil.chairman = player;
    expect(card.canPlay(player)).is.true;

    turmoil.sendDelegateToParty(player, PartyName.GREENS, game);
    turmoil.sendDelegateToParty(player, PartyName.GREENS, game);
    turmoil.sendDelegateToParty(player2, PartyName.GREENS, game);
    turmoil.sendDelegateToParty(player2, PartyName.GREENS, game);
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.GREENS, game);
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.GREENS, game);

    turmoil.sendDelegateToParty('NEUTRAL', PartyName.REDS, game);
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.REDS, game);

    const orOptions = cast(card.play(player), OrOptions);
    const greensOption = orOptions.options.find((option) => titleOf(option) === PartyName.GREENS);
    const selectDelegate = cast(cast(greensOption, SelectOption).cb(undefined), SelectDelegate);
    expect(selectDelegate.players).has.members([player, player2, 'NEUTRAL']);
    expect(selectDelegate.players.length).eq(3);
  });

  it('Asks for the delegate directly when only one party has a removable delegate', () => {
    turmoil.chairman = player;
    turmoil.sendDelegateToParty(player, PartyName.GREENS, game);
    turmoil.sendDelegateToParty(player2, PartyName.GREENS, game);

    const selectDelegate = cast(card.play(player), SelectDelegate);
    expect(selectDelegate.players).has.members([player2]);
  });

  it('Does nothing when every party has only its leader', () => {
    turmoil.chairman = player;

    expect(card.play(player)).is.undefined;
  });

  it('Offers the parties as plain options so the client shows party cards', () => {
    turmoil.chairman = player;
    turmoil.sendDelegateToParty(player, PartyName.GREENS, game);
    turmoil.sendDelegateToParty(player2, PartyName.GREENS, game);
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.REDS, game);
    turmoil.sendDelegateToParty('NEUTRAL', PartyName.REDS, game);

    const model = cast(card.play(player), OrOptions).toModel(player);
    expect(model.type).eq('or');
    expect(model.options.map((option) => option.type)).deep.eq(['option', 'option']);
    expect(model.options.map((option) => option.title)).has.members([PartyName.GREENS, PartyName.REDS]);
  });
});
