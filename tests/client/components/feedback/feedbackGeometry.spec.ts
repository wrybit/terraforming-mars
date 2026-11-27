import {expect} from 'chai';
import {FULL_CROP, boxBetween, isBigEnough, isFullCrop, isInsideCrop, toOriginal, toView} from '@/client/components/feedback/feedbackGeometry';

describe('feedbackGeometry', () => {
  const crop = {x: 50, y: 20, width: 50, height: 40};

  it('maps between original and cropped view', () => {
    expect(toView({x: 75, y: 40}, crop)).deep.eq({x: 50, y: 50});
    expect(toOriginal({x: 50, y: 50}, crop)).deep.eq({x: 75, y: 40});
    expect(toView({x: 10, y: 10}, FULL_CROP)).deep.eq({x: 10, y: 10});
  });

  it('spans a box in any drag direction', () => {
    expect(boxBetween({x: 30, y: 40}, {x: 10, y: 10})).deep.eq({x: 10, y: 10, width: 20, height: 30});
  });

  it('ignores tiny boxes', () => {
    expect(isBigEnough({x: 0, y: 0, width: 1, height: 30})).is.false;
    expect(isBigEnough({x: 0, y: 0, width: 5, height: 5})).is.true;
  });

  it('knows which markers stay inside the crop', () => {
    expect(isInsideCrop({x: 60, y: 30, width: 0, height: 0}, crop)).is.true;
    expect(isInsideCrop({x: 10, y: 30, width: 0, height: 0}, crop)).is.false;
    // An area overlapping the edge still counts
    expect(isInsideCrop({x: 40, y: 30, width: 20, height: 5}, crop)).is.true;
    expect(isFullCrop(FULL_CROP)).is.true;
    expect(isFullCrop(crop)).is.false;
  });
});
