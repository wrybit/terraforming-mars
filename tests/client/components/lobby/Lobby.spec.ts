import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {globalConfig} from '../getLocalVue';
import LobbyAvatar from '@/client/components/lobby/LobbyAvatar.vue';
import LobbyGameRow from '@/client/components/lobby/LobbyGameRow.vue';
import LobbyFilterPanel from '@/client/components/lobby/LobbyFilterPanel.vue';
import LobbyRoomDialog from '@/client/components/lobby/LobbyRoomDialog.vue';
import LobbyMatchDialog from '@/client/components/lobby/LobbyMatchDialog.vue';
import LobbyProfileDialog from '@/client/components/lobby/LobbyProfileDialog.vue';
import {activeFilterCount, bestMatch, defaultLobbyFilters, matchesFilters} from '@/client/components/lobby/lobbyFilters';
import {LobbyRoomModel, LobbySeatModel} from '@/common/lobby/LobbyModel';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {GameSetupOptions} from '@/common/game/GameSetupOptions';
import {BoardName} from '@/common/boards/BoardName';

const OPTIONS: GameSetupOptions = {
  shuffledBoard: false, altVenusBoard: false, requiresVenusTrackCompletion: false, politicalAgendasExtension: 'Standard',
  removeNegativeGlobalEvents: false, requiresMoonTrackCompletion: false, moonStandardProjectVariant1: false, moonStandardProjectVariant: false,
  aresExtremeVariant: false, startingCorporations: 2, startingPreludes: 4, startingCeos: 3, twoCorpsVariant: false, draftVariant: true,
  initialDraftVariant: false, preludeDraftVariant: false, ceosDraftVariant: false, solarPhaseOption: false, soloTR: false, undoOption: false,
  showTimers: true, aiAnalysis: false, showOtherPlayersVP: false, fastModeOption: false, escapeVelocity: false,
  randomMA: RandomMAOptionType.NONE, modularMA: false, includeFanMA: false, customCardPool: false,
};

const host: LobbySeatModel = {kind: 'human', name: 'Ann', color: 'red', emoji: '🚀', ready: true, host: true, you: false};

function room(seats: Array<LobbySeatModel>, change: Partial<LobbyRoomModel> = {}): LobbyRoomModel {
  return {
    id: 'l1', title: 'Evening game', ageMs: 180_000, state: 'open', listed: true, seats,
    setup: {expansions: {corpera: true, prelude: true} as LobbyRoomModel['setup']['expansions'], boards: [BoardName.THARSIS], randomBoard: false, options: OPTIONS},
    ...change,
  };
}

describe('Lobby components', () => {
  it('LobbyAvatar shows the emoji, or the picture when there is one', () => {
    expect(mount(LobbyAvatar, {...globalConfig, props: {kind: 'human', color: 'red', emoji: '🪐'}}).text()).eq('🪐');
    const withImage = mount(LobbyAvatar, {...globalConfig, props: {kind: 'human', color: 'red', emoji: '🪐', image: 'data:image/png;base64,AA'}});
    expect(withImage.find('img').exists()).is.true;
  });

  it('LobbyGameRow lists title, host and seats and offers to join', async () => {
    const wrapper = mount(LobbyGameRow, {...globalConfig, props: {room: room([host, {kind: 'free'}, {kind: 'ai', aiLevel: 'hard'}])}});
    expect(wrapper.find('.lobby-game-title').text()).eq('Evening game');
    expect(wrapper.find('.lobby-game-count').text()).eq('2/3');
    expect(wrapper.text()).contains('Ann');
    await wrapper.find('.lobby-game-action button').trigger('click');
    expect(wrapper.emitted('join')).has.length(1);
  });

  it('LobbyFilterPanel emits the changed filters', async () => {
    const wrapper = mount(LobbyFilterPanel, {...globalConfig, props: {modelValue: defaultLobbyFilters()}});
    await wrapper.findAll('.create-game-chip')[0].trigger('click');
    const filters = wrapper.emitted('update:modelValue')?.[0]?.[0] as ReturnType<typeof defaultLobbyFilters>;
    expect(filters.sizes).deep.eq([2]);
  });

  it('lobby filters: nothing selected shows every game, the fullest fitting game comes first', () => {
    const small = room([host, {kind: 'free'}], {id: 'small'});
    const almostFull = room([host, {...host, host: false, name: 'Bob'}, {kind: 'free'}], {id: 'full'});
    const filters = defaultLobbyFilters();
    expect(activeFilterCount(filters)).eq(0);
    expect(matchesFilters(small, filters)).is.true;
    expect(bestMatch([small, almostFull], filters)?.id).eq('full');
    expect(bestMatch([small, almostFull], {...filters, sizes: [2]})?.id).eq('small');
    expect(matchesFilters(small, {...filters, expansions: ['venus']})).is.false;
  });

  it('LobbyRoomDialog lets the host fill the free seats', () => {
    const wrapper = mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: room([{...host, you: true}, {kind: 'free'}])}, attachTo: document.body});
    expect(document.body.textContent).contains('Seat an AI');
    wrapper.unmount();
  });

  it('LobbyRoomDialog offers "Continue" instead of "Start now" once the game runs', () => {
    const started = room([{...host, you: true}, {kind: 'guest', name: 'Dan', color: 'green'}], {state: 'started', yourPlayerId: 'p1', gameId: 'g1', hostNeedsLinks: true});
    const wrapper = mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: started}, attachTo: document.body});
    expect(document.body.textContent).not.contains('Start now');
    const links = Array.from(document.body.querySelectorAll('.lobby-room-foot a')).map((link) => link.getAttribute('href'));
    expect(links).deep.eq(['game?id=g1', 'player?id=p1']);
    wrapper.unmount();
  });

  it('LobbyMatchDialog shows the found game', () => {
    const wrapper = mount(LobbyMatchDialog, {...globalConfig, props: {room: room([host, {kind: 'free'}])}, attachTo: document.body});
    expect(document.body.textContent).contains('Evening game');
    wrapper.unmount();
  });

  it('LobbyProfileDialog saves the trimmed name', async () => {
    const wrapper = mount(LobbyProfileDialog, {...globalConfig, props: {open: false, profile: {name: '', color: 'red', emoji: '🚀'}, firstVisit: true}, attachTo: document.body});
    await wrapper.setProps({open: true});
    const input = document.body.querySelector('.lobby-profile-dialog input.create-game-text-input') as HTMLInputElement;
    input.value = '  Ann  ';
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter'}));
    expect(wrapper.emitted('save')?.[0]?.[0]).to.include({name: 'Ann'});
    wrapper.unmount();
  });
});
