import {expect} from 'chai';
import {CARD_FADE_LENGTH, CARD_SCROLL_AREAS, cardScrollKind, cardScrollState, cardScrollStyle, scrollTopForThumb} from '@/client/components/card/cardScrollArea';

describe('cardScrollArea', () => {
  it('picks the scroll area by the kind of card', () => {
    expect(cardScrollKind({isHouse: true, isStandardProject: false, hasBottomTab: true})).eq('house');
    expect(cardScrollKind({isHouse: false, isStandardProject: true, hasBottomTab: false})).eq('standardProject');
    expect(cardScrollKind({isHouse: false, isStandardProject: false, hasBottomTab: true})).eq('projectWithTab');
    expect(cardScrollKind({isHouse: false, isStandardProject: false, hasBottomTab: false})).eq('project');
  });

  it('places the content box and the scrollbar relative to their positioning parents', () => {
    const style = cardScrollStyle(CARD_SCROLL_AREAS.projectWithTab, {width: 250, height: 349, parentTop: 4, parentLeft: 4, frameTop: 4, frameLeft: 4});
    expect(style).deep.eq({
      '--card-content-top': '74px',
      '--card-content-left': '0px',
      '--card-content-width': '242px',
      '--card-content-height': '255px',
      '--card-scrollbar-top': '74px',
      '--card-scrollbar-left': '233px',
      '--card-scrollbar-height': '227px',
    });
  });

  it('fades only an edge with hidden content and shows no scrollbar for content that fits', () => {
    expect(cardScrollState({top: 0, height: 200, visible: 200}, 100).scrolls).is.false;
    expect(cardScrollState({top: 0, height: 201, visible: 200}, 100).scrolls).is.false;
    const top = cardScrollState({top: 0, height: 400, visible: 200}, 100);
    expect(top).deep.eq({scrolls: true, fadeTop: 0, fadeBottom: CARD_FADE_LENGTH, thumbTop: 0, thumbHeight: 50});
    const end = cardScrollState({top: 200, height: 400, visible: 200}, 100);
    expect(end).deep.eq({scrolls: true, fadeTop: CARD_FADE_LENGTH, fadeBottom: 0, thumbTop: 50, thumbHeight: 50});
  });

  it('keeps the thumb long enough to grab and turns its travel into a scroll position', () => {
    expect(cardScrollState({top: 0, height: 10000, visible: 200}, 100).thumbHeight).eq(18);
    expect(scrollTopForThumb(0, 25, {height: 400, visible: 200}, 100, 50)).eq(100);
    expect(scrollTopForThumb(0, 500, {height: 400, visible: 200}, 100, 50)).eq(200);
    expect(scrollTopForThumb(100, -500, {height: 400, visible: 200}, 100, 50)).eq(0);
  });
});
