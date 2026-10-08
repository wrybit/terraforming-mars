import {expect} from 'chai';
import {describePlacement, placementTileOf} from '@/client/components/board/placementDescription';
import {Phase} from '@/common/Phase';
import {GameModel} from '@/common/models/GameModel';
import {fakeGameModel} from '../testHelpers';

function game(overrides: Partial<GameModel> = {}): GameModel {
  return {...fakeGameModel(), phase: Phase.ACTION, oxygenLevel: 3, oceans: 3, ...overrides};
}

describe('placementDescription', () => {
  it('recognizes Mars and Moon tiles from the title', () => {
    expect(placementTileOf('Select space for greenery tile')).eq('greenery');
    expect(placementTileOf('Select space for city tile')).eq('city');
    expect(placementTileOf('Select space for ocean tile')).eq('ocean');
    expect(placementTileOf('Select a space on The Moon for a mining tile.')).eq('mine');
    expect(placementTileOf('Select a space on The Moon for a habitat tile.')).eq('habitat');
    expect(placementTileOf('Select a space on The Moon for a road tile.')).eq('road');
    expect(placementTileOf('Select space to excavate')).is.undefined;
  });

  it('gives the general rules and gains for an ordinary greenery', () => {
    const description = describePlacement('Select space for greenery tile', game())!;
    expect(description.title).eq('Place greenery');
    expect(description.gains.map((gain) => gain.icon)).deep.eq(['oxygen', 'tr']);
    expect(description.rules.map((rule) => rule.kind)).deep.eq(['soft', 'required', 'bonus']);
  });

  it('drops the oxygen once it is at its maximum or for final greeneries', () => {
    expect(describePlacement('Select space for greenery tile', game({oxygenLevel: 14}))!.gains).is.empty;
    expect(describePlacement('Select space for greenery tile', game({phase: Phase.PRODUCTION}))!.gains).is.empty;
  });

  it('counts the oceans', () => {
    const gains = describePlacement('Select space for ocean tile', game())!.gains;
    expect(gains[1].labelParams).deep.eq(['3', '4', '9']);
  });

  it('shows a card\'s own rule instead of the general ones', () => {
    const description = describePlacement('Select space next to at least 2 other city tiles', game())!;
    expect(description.tile).eq('city');
    expect(description.rules[0]).deep.eq({kind: 'card', text: 'Select space next to at least 2 other city tiles'});
    expect(description.rules.some((rule) => rule.text === 'Not next to another city')).is.false;
  });
});
