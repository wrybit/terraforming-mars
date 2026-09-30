import {expect} from 'chai';
import {protectedTagsOf} from '@/client/components/overview/protectedTags';
import {PublicPlayerModel} from '@/common/models/PlayerModel';
import {CardName} from '@/common/cards/CardName';
import {Tag} from '@/common/cards/Tag';

const playerWith = (cards: Array<CardName>) => ({tableau: cards.map((name) => ({name}))}) as unknown as PublicPlayerModel;

describe('protectedTags', () => {
  it('protects the nature tags with Protected Habitats', () => {
    expect(protectedTagsOf(playerWith([CardName.PROTECTED_HABITATS]))).to.have.members([Tag.PLANT, Tag.MICROBE, Tag.ANIMAL]);
  });

  it('protects nothing without it', () => {
    expect(protectedTagsOf(playerWith([CardName.HELION]))).to.be.empty;
  });
});
