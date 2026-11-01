import {expect} from 'chai';
import {boxProblemKeys, hasBlockingProblem} from '@/client/components/create/validationProblemKeys';
import {ValidationErrors} from '@/common/game/validateNewGameConfig';

const NO_ERRORS: ValidationErrors = {
  negativeEscapeVelocity: false,
  notEnoughColonies: 0,
  notEnoughCeos: 0,
  notEnoughPreludes: 0,
  maybeNotEnoughPreludes: [],
  coloniesMissingExpansions: [],
  corporationsMissingExpansions: [],
  preludesMissingExpansions: [],
  ceosMissingExpansions: [],
  soloWithoutCorporateEra: false,
  infiniteEnergyBug: false,
  altVenusBoardOnAmazonis: false,
  prelude2WithoutPrelude: false,
  deltaProjectWithoutPrelude: false,
  notEnoughCorporations: 0,
  modularMAInDevelopment: false,
  invalidCustomMA: '',
};

describe('validationProblemKeys', () => {
  it('keeps the Official Random note out of the box', () => {
    expect(boxProblemKeys({...NO_ERRORS, modularMAInDevelopment: true})).deep.eq([]);
  });

  it('lists engaged problems in validationDetails order', () => {
    expect(boxProblemKeys({...NO_ERRORS, notEnoughCorporations: 4, soloWithoutCorporateEra: true}))
      .to.have.members(['notEnoughCorporations', 'soloWithoutCorporateEra']);
  });

  it('treats a non-empty string as engaged', () => {
    expect(boxProblemKeys({...NO_ERRORS, invalidCustomMA: 'bad'})).deep.eq(['invalidCustomMA']);
    expect(hasBlockingProblem({...NO_ERRORS, invalidCustomMA: 'bad'})).is.true;
    expect(hasBlockingProblem({...NO_ERRORS, modularMAInDevelopment: true})).is.false;
  });
});
