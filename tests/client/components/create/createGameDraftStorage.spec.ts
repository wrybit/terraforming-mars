import {expect} from 'chai';
import {CreateGameDraft, createGameDraftStorage} from '@/client/components/create/createGameDraftStorage';

const draft: CreateGameDraft = {
  settings: {expansions: {venus: true}},
  gameName: 'Red Planet',
  gameNamePlaceholder: 'Quiet Crater',
  lobbyPublic: false,
  manualSeats: [2],
  seededGame: false,
  clonedGameId: undefined,
  hostEmoji: '🪐',
  hostImage: undefined,
};

describe('createGameDraftStorage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('keeps the draft of the tab', () => {
    createGameDraftStorage.save(draft);
    expect(createGameDraftStorage.load()).deep.eq(JSON.parse(JSON.stringify(draft)));
  });

  it('has no draft when nothing was kept', () => {
    expect(createGameDraftStorage.load()).eq(undefined);
  });

  it('clears the draft', () => {
    createGameDraftStorage.save(draft);
    createGameDraftStorage.clear();
    expect(createGameDraftStorage.load()).eq(undefined);
  });

  it('ignores a broken draft', () => {
    sessionStorage.setItem('tm_create_game_draft', '{broken');
    expect(createGameDraftStorage.load()).eq(undefined);
  });
});
