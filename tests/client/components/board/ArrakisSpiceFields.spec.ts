import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import ArrakisSpiceFields from '@/client/components/board/ArrakisSpiceFields.vue';
import {COUNT_WIDTH, ICON_SIZE, spiceLayout, spicePoint, spiceRow} from '@/client/components/board/arrakisSpiceFields';
import {LARGE_SCALES, STANDARD_SCALES} from '@/client/components/board/arrakisScales';

describe('ArrakisSpiceFields', () => {
  it('fills one cell per placed field, the next one blinks', () => {
    const wrapper = mount(ArrakisSpiceFields, {...globalConfig, props: {count: 3, fields: 9}});
    expect(wrapper.findAll('.arrakis-spice__cell--open')).has.length(6);
    expect(wrapper.findAll('.arrakis-spice__cell--next')).has.length(1);
    expect(wrapper.find('.arrakis-spice__count').text()).eq('3/9');
    expect(wrapper.find('.arrakis-spice__bar').exists()).is.false;
  });

  it('merges all fields into one bar with a check in a hexagon', () => {
    const wrapper = mount(ArrakisSpiceFields, {...globalConfig, props: {count: 9, fields: 9}});
    expect(wrapper.find('.arrakis-spice__bar').exists()).is.true;
    expect(wrapper.find('.arrakis-spice__cell--check').exists()).is.true;
    expect(wrapper.find('.arrakis-spice__count').exists()).is.false;
    expect(wrapper.find('.arrakis-spice__done').text()).contains('9');
  });

  it('centres the row below the planet and keeps the large one inside the gap between the scales', () => {
    const layout = spiceLayout(9);
    // The group from the outer edge of the tile to the outer edge of the count is centred
    expect((layout.icon - ICON_SIZE / 2) + (layout.count + COUNT_WIDTH / 2)).closeTo(0, 0.001);
    const standard = spiceRow(false);
    expect(spicePoint(standard, 0).x).closeTo(STANDARD_SCALES.centreX, 0.001);
    // Large: both ends on the scale circle, between the low ends of the two scales
    const large = spiceRow(true);
    const left = spicePoint(large, layout.icon - 12);
    const right = spicePoint(large, layout.count + 15);
    const angle = (point: {x: number, y: number}) => Math.atan2(point.y - LARGE_SCALES.centreY, point.x - LARGE_SCALES.centreX) * 180 / Math.PI;
    const vegetationStart = LARGE_SCALES.vegetationAngles[0] - (LARGE_SCALES.vegetationAngles[1] - LARGE_SCALES.vegetationAngles[0]) / 2;
    const waterStart = LARGE_SCALES.waterAngles[0] + (LARGE_SCALES.waterAngles[0] - LARGE_SCALES.waterAngles[1]) / 2;
    expect(angle(left)).lessThan(vegetationStart);
    expect(angle(right)).greaterThan(waterStart);
  });
});
