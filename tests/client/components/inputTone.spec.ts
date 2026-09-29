import {expect} from 'chai';
import {inputTone} from '@/client/components/inputTone';
import {PlayerInputModel} from '@/common/models/PlayerInputModel';
import {CardName} from '@/common/cards/CardName';

// Minimales Eingabe-Modell für die Farberkennung
function input(fields: Record<string, unknown>): PlayerInputModel {
  return {title: '', buttonLabel: '', ...fields} as unknown as PlayerInputModel;
}

describe('inputTone', () => {
  it('erkennt Angriffe am Titel', () => {
    expect(inputTone(input({type: 'player', title: 'Select player to steal ${0} ${1} from'}))).eq('attack');
    expect(inputTone(input({type: 'player', title: 'Select player to decrease ${0} production by ${1} step(s)'}))).eq('attack');
    expect(inputTone(input({type: 'option', title: {message: 'Remove ${0} plants from ${1}', data: []}}))).eq('attack');
  });

  it('Spieler wählen ohne Angriff ist violett', () => {
    expect(inputTone(input({type: 'player', title: 'Select player'}))).eq('player');
  });

  it('eigene Karten-Ressourcen entfernen ist kein Angriff', () => {
    expect(inputTone(input({type: 'option', title: 'Remove a science resource from this card to draw a card'}))).is.undefined;
  });

  it('Präludien sind rosa, andere Karten orange', () => {
    expect(inputTone(input({type: 'card', title: 'x', cards: [{name: CardName.BIOFUELS}]}))).eq('prelude');
    expect(inputTone(input({type: 'card', title: 'x', cards: [{name: CardName.MANGROVE}]}))).eq('cards');
  });

  it('Feldwahl für Ozeane ist blau, andere Felder bleiben Mars-braun', () => {
    expect(inputTone(input({type: 'space', title: 'Select space for first ocean'}))).eq('ocean');
    expect(inputTone(input({type: 'space', title: {message: 'Select space for ${0} to place an ocean', data: []}}))).eq('ocean');
    expect(inputTone(input({type: 'space', title: 'Select space for claim'}))).eq('mars');
  });

  it('Feldwahl für Städte ist hellgrau', () => {
    expect(inputTone(input({type: 'space', title: 'Select space for city tile'}))).eq('city');
  });

  it('Feldwahl für Grünflächen ist grün', () => {
    expect(inputTone(input({type: 'space', title: 'Select space for greenery tile'}))).eq('greenery');
    expect(inputTone(input({type: 'space', title: {message: 'Convert ${0} plants into greenery', data: []}}))).eq('greenery');
  });

  it('Farbe nach Eingabetyp', () => {
    expect(inputTone(input({type: 'space', title: 'x'}))).eq('mars');
    expect(inputTone(input({type: 'amount', title: 'x'}))).eq('resources');
    expect(inputTone(input({type: 'colony', title: 'x'}))).eq('colonies');
    expect(inputTone(input({type: 'option', title: 'x'}))).is.undefined;
  });
});
