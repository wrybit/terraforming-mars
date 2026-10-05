import {expect} from 'chai';
import {amountConversion, amountSideValue} from '@/client/components/amount/amountConversion';
import {CardName} from '@/common/cards/CardName';
import {Resource} from '@/common/Resource';
import {CardResource} from '@/common/CardResource';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardModel} from '@/common/models/CardModel';

describe('amountConversion', () => {
  it('knows Insulation only for its own card (Ryu uses the same title)', () => {
    const insulation = amountConversion('Select amount of heat production to decrease', CardName.INSULATION);
    expect(insulation?.from).deep.eq({kind: 'production', resource: Resource.HEAT, perStep: 1});
    expect(insulation?.to).deep.eq({kind: 'production', resource: Resource.MEGACREDITS, perStep: 1});
    expect(amountConversion('Select amount of heat production to decrease', CardName.RYU)).is.undefined;
  });

  it('reads parameterised titles by their key', () => {
    const voltaic = amountConversion({message: 'Select up to ${0} steel to convert to titanium', data: []}, undefined);
    expect(voltaic?.to.resource).eq(Resource.TITANIUM);
  });

  it('takes stock, production or resources on the triggering card', () => {
    const player = {
      heat: 2, heatProduction: 5,
      tableau: [{name: CardName.SULPHUR_EATING_BACTERIA, resources: 6} as CardModel],
    } as unknown as PublicPlayerModel;
    expect(amountSideValue({kind: 'production', resource: Resource.HEAT, perStep: 1}, player, undefined)).eq(5);
    expect(amountSideValue({kind: 'stock', resource: Resource.HEAT, perStep: 1}, player, undefined)).eq(2);
    expect(amountSideValue({kind: 'card', resource: CardResource.MICROBE, perStep: 1}, player, CardName.SULPHUR_EATING_BACTERIA)).eq(6);
  });
});
