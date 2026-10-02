import {expect} from 'chai';
import {inputTone} from '@/client/components/inputTone';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';

// Minimal input model for color detection
function input(fields: Record<string, unknown>): PlayerInputModel {
  return {title: '', buttonLabel: '', ...fields} as unknown as PlayerInputModel;
}

describe('inputTone', () => {
  it('erkennt Angriffe am Titel', () => {
    expect(inputTone(input({type: 'player', title: 'Select player to steal ${0} ${1} from'}))).eq('attack');
    expect(inputTone(input({type: 'player', title: 'Select player to decrease ${0} production by ${1} step(s)'}))).eq('attack');
    expect(inputTone(input({type: 'option', title: {message: 'Remove ${0} plants from ${1}', data: []}}))).eq('attack');
  });

  it('selecting a player without attack is violet', () => {
    expect(inputTone(input({type: 'player', title: 'Select player'}))).eq('player');
  });

  it('removing own card resources is not an attack', () => {
    expect(inputTone(input({type: 'option', title: 'Remove a science resource from this card to draw a card'}))).is.undefined;
  });

  it('preludes are pink, other cards orange', () => {
    expect(inputTone(input({type: 'card', title: 'x', cards: [{name: CardName.BIOFUELS}]}))).eq('prelude');
    expect(inputTone(input({type: 'card', title: 'x', cards: [{name: CardName.MANGROVE}]}))).eq('cards');
  });

  it('space selection for oceans is blue, other spaces stay Mars brown', () => {
    expect(inputTone(input({type: 'space', title: 'Select space for first ocean'}))).eq('ocean');
    expect(inputTone(input({type: 'space', title: {message: 'Select space for ${0} to place an ocean', data: []}}))).eq('ocean');
    expect(inputTone(input({type: 'space', title: 'Select space for claim'}))).eq('mars');
  });

  it('space selection for cities is light gray', () => {
    expect(inputTone(input({type: 'space', title: 'Select space for city tile'}))).eq('city');
  });

  it('space selection for greeneries is green', () => {
    expect(inputTone(input({type: 'space', title: 'Select space for greenery tile'}))).eq('greenery');
    expect(inputTone(input({type: 'space', title: {message: 'Convert ${0} plants into greenery', data: []}}))).eq('greenery');
  });

  it('color by input type', () => {
    expect(inputTone(input({type: 'space', title: 'x'}))).eq('mars');
    expect(inputTone(input({type: 'amount', title: 'x'}))).eq('resources');
    expect(inputTone(input({type: 'colony', title: 'x'}))).eq('colonies');
    expect(inputTone(input({type: 'option', title: 'x'}))).is.undefined;
  });
});
