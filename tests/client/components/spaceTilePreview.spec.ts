import {expect} from 'chai';
import {placementActionLabel, previewTileForSpaceInput, specialTileForSpaceInput} from '@/client/components/spaceTilePreview';
import {TileType} from '@/common/TileType';
import {CardName} from '@/common/cards/CardName';

describe('previewTileForSpaceInput', () => {
  it('detects greenery, city and ocean by title', () => {
    expect(previewTileForSpaceInput({message: 'Convert ${0} plants into greenery', data: []})).eq('greenery');
    expect(previewTileForSpaceInput('Select space for greenery tile')).eq('greenery');
    expect(previewTileForSpaceInput('Select space for city tile')).eq('city');
    expect(previewTileForSpaceInput('Select space for ocean tile')).eq('ocean');
  });

  it('no preview for an unknown tile', () => {
    expect(previewTileForSpaceInput('Select space to excavate')).is.undefined;
  });

  it('a tile sent by the server wins over the title', () => {
    const industrialCenter = {title: 'Select space adjacent to a city tile', tile: {type: TileType.INDUSTRIAL_CENTER, card: CardName.INDUSTRIAL_CENTER}};
    expect(previewTileForSpaceInput(industrialCenter)).is.undefined;
    expect(specialTileForSpaceInput(industrialCenter)).deep.eq(industrialCenter.tile);
    expect(placementActionLabel(industrialCenter)).eq('Place Industrial Center');
    expect(previewTileForSpaceInput({title: 'Select space', tile: {type: TileType.CITY}})).eq('city');
    expect(specialTileForSpaceInput({title: 'Select space', tile: {type: TileType.CITY}})).is.undefined;
    expect(placementActionLabel({title: 'Select space for city tile'})).eq('Place city');
  });
});
