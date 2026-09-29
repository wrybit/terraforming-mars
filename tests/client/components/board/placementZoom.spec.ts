import {expect} from 'chai';
import {notifyZoomBoardHidden, notifyZoomBoardRendered, placementZoom, releasePlacementZoomAndWait, requestPlacementZoom} from '@/client/components/board/placementZoom';

describe('placementZoom', () => {
  afterEach(() => {
    notifyZoomBoardHidden();
  });

  it('resolves at once when the enlarged board is not shown', async () => {
    requestPlacementZoom();
    await releasePlacementZoomAndWait();
    expect(placementZoom.requested).to.be.false;
  });

  it('waits for the close animation of the enlarged board', async () => {
    requestPlacementZoom();
    notifyZoomBoardRendered();
    let resolved = false;
    const waiting = releasePlacementZoomAndWait().then(() => {
      resolved = true;
    });
    await Promise.resolve();
    expect(resolved).to.be.false;

    notifyZoomBoardHidden();
    await waiting;
    expect(resolved).to.be.true;
  });
});
