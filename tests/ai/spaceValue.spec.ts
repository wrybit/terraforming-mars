import {expect} from 'chai';
import {testGame} from '../TestGame';
import {SelectSpace} from '../../src/server/inputs/SelectSpace';
import {message} from '../../src/server/logs/MessageBuilder';
import {CardName} from '../../src/common/cards/CardName';
import {tileKindOf} from '../../src/server/ai/spaceValue';

describe('AI tile kinds', () => {
  it('knows tiles by the card in the title', () => {
    const [game] = testGame(2);
    const spaces = game.board.getAvailableSpacesOnLand(game.players[0]);
    const select = (card: CardName) => new SelectSpace(message('Select space for ${0} tile', (b) => b.cardName(card)), spaces);
    expect(tileKindOf(select(CardName.COMMERCIAL_DISTRICT))).eq('cityNeighbour');
    // Urbanized Area asks with its own text.
    expect(tileKindOf(new SelectSpace('Select space next to at least 2 other city tiles', spaces))).eq('city');
    expect(tileKindOf(select(CardName.RESTRICTED_AREA))).eq('other');
  });
});
