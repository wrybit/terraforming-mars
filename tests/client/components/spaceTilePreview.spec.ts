import {expect} from 'chai';
import {previewTileForSpaceInput} from '@/client/components/spaceTilePreview';

describe('previewTileForSpaceInput', () => {
  it('erkennt Grünfläche, Stadt und Ozean am Titel', () => {
    expect(previewTileForSpaceInput({message: 'Convert ${0} plants into greenery', data: []})).eq('greenery');
    expect(previewTileForSpaceInput('Select space for greenery tile')).eq('greenery');
    expect(previewTileForSpaceInput('Select space for city tile')).eq('city');
    expect(previewTileForSpaceInput('Select space for ocean tile')).eq('ocean');
  });

  it('keine Vorschau bei unbekanntem Plättchen', () => {
    expect(previewTileForSpaceInput('Select space to excavate')).is.undefined;
  });
});
