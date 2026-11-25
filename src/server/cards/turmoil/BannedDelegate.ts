import {IProjectCard} from '../IProjectCard';
import {Card} from '../Card';
import {CardName} from '../../../common/cards/CardName';
import {CardType} from '../../../common/cards/CardType';
import {IPlayer} from '../../IPlayer';
import {OrOptions} from '../../inputs/OrOptions';
import {SelectDelegate} from '../../inputs/SelectDelegate';
import {SelectOption} from '../../inputs/SelectOption';
import {IParty} from '../../turmoil/parties/IParty';
import {CardRenderer} from '../render/CardRenderer';
import {NeutralPlayer, Turmoil} from '../../turmoil/Turmoil';
import {all} from '../Options';
import {MultiSet} from 'mnemonist';

type PartyChoice = {
  party: IParty;
  // The delegates that may be removed, without the party leader and without duplicates
  players: ReadonlyArray<IPlayer | NeutralPlayer>;
};

export class BannedDelegate extends Card implements IProjectCard {
  constructor() {
    super({
      type: CardType.EVENT,
      name: CardName.BANNED_DELEGATE,
      cost: 0,

      requirements: {chairman: true},
      metadata: {
        cardNumber: 'T02',
        description: 'Requires that you are Chairman. Remove any NON-LEADER delegate.',
        renderData: CardRenderer.builder((b) => {
          b.delegates(-1, {all});
        }),
      },
    });
  }

  public override bespokePlay(player: IPlayer): OrOptions | SelectDelegate | undefined {
    const turmoil = Turmoil.getTurmoil(player.game);
    const choices: Array<PartyChoice> = [];
    for (const party of turmoil.parties) {
      const players = this.removableDelegates(party, player);
      if (players.length > 0) {
        choices.push({party, players});
      }
    }

    if (choices.length === 0) {
      return undefined;
    }
    // Only one party has a removable delegate: ask for the delegate right away
    if (choices.length === 1) {
      return this.selectDelegate(player, choices[0]);
    }

    // Otherwise choose the party first. Party names as plain options are rendered as party
    // cards by the client (partyChoice.ts), so the party is an explicit step instead of a
    // tab labelled with a long sentence that hides which parties are available.
    const orOptions = new OrOptions().setTitle('Choose a party');
    for (const choice of choices) {
      orOptions.options.push(new SelectOption(choice.party.name)
        .andThen(() => this.selectDelegate(player, choice)));
    }
    return orOptions;
  }

  private removableDelegates(party: IParty, player: IPlayer): ReadonlyArray<IPlayer | NeutralPlayer> {
    // Take each party having more than just the party leader in the area
    if (party.delegates.size <= 1) {
      return [];
    }
    // Remove the party leader from available choices
    const copy = MultiSet.from(party.delegates);
    if (party.partyLeader !== undefined) {
      copy.remove(party.partyLeader);
    } else {
      // This wouldn't happen normally.
      throw new Error(`partyLeader not defined for ${player.game.id}`);
    }
    const players: Array<IPlayer | NeutralPlayer> = [];
    for (const entry of copy.multiplicities()) {
      if (entry[0] === 'NEUTRAL') {
        players.push('NEUTRAL');
      } else {
        players.push(entry[0]);
      }
    }
    return players;
  }

  private selectDelegate(player: IPlayer, choice: PartyChoice): SelectDelegate {
    const selectDelegate = new SelectDelegate(choice.players, 'Select player delegate to remove from ' + choice.party.name + ' party')
      .andThen((selectedPlayer) => {
        Turmoil.getTurmoil(player.game).removeDelegateFromParty(selectedPlayer, choice.party.name, player.game);
        this.log(player, choice.party, selectedPlayer);
        return undefined;
      });
    selectDelegate.buttonLabel = 'Remove delegate';
    return selectDelegate;
  }

  private log(player: IPlayer, party: IParty, selectedPlayer: IPlayer | NeutralPlayer) {
    if (selectedPlayer === 'NEUTRAL') {
      player.game.log('${0} removed neutral delegate from ${1}', (b) => b.player(player).party(party));
    } else {
      player.game.log('${0} removed ${1}\'s delegate from ${2}', (b) => b.player(player).player(selectedPlayer).party(party));
    }
  }
}
