import {mount} from '@vue/test-utils';
import {expect} from 'chai';
import {nextTick} from 'vue';
import {globalConfig} from '../getLocalVue';
import LobbyAvatar from '@/client/components/lobby/LobbyAvatar.vue';
import LobbyGameRow from '@/client/components/lobby/LobbyGameRow.vue';
import LobbyFilterPanel from '@/client/components/lobby/LobbyFilterPanel.vue';
import LobbyRoomDialog from '@/client/components/lobby/LobbyRoomDialog.vue';
import LobbyMatchDialog from '@/client/components/lobby/LobbyMatchDialog.vue';
import LobbyProfileDialog from '@/client/components/lobby/LobbyProfileDialog.vue';
import LobbyEmojiPicker from '@/client/components/lobby/LobbyEmojiPicker.vue';
import {LOBBY_EMOJIS} from '@/common/lobby/LobbyModel';
import {isEmojiOnly} from '@/client/components/lobby/lobbyChatEmoji';
import {activeFilterCount, availableFilterChoices, bestMatch, defaultLobbyFilters, matchesFilters} from '@/client/components/lobby/lobbyFilters';
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
  it('LobbyEmojiPicker shows the picture and lets the host pick another emoji', async () => {
    const wrapper = mount(LobbyEmojiPicker, {...globalConfig, props: {color: 'red', emoji: '🌕'}, attachTo: document.body});
    expect(wrapper.find('.lobby-emoji-picker-button').text()).eq('🌕');
    expect(document.querySelector('.lobby-emoji-picker-popover')).is.null;
    await wrapper.find('.lobby-emoji-picker-button').trigger('click');
    const emojis = document.querySelectorAll<HTMLButtonElement>('.lobby-emoji-picker-popover .lobby-emoji');
    expect(emojis).has.length(LOBBY_EMOJIS.length);
    expect(document.querySelector('.lobby-emoji-picker-popover .lobby-emoji--selected')?.textContent).eq('🌕');
    emojis[0].click();
    await nextTick();
    expect(wrapper.emitted('pick')).deep.eq([[LOBBY_EMOJIS[0]]]);
    expect(document.querySelector('.lobby-emoji-picker-popover')).is.null;
  });

  it('LobbyAvatar shows the emoji, or the picture when there is one', () => {
    expect(mount(LobbyAvatar, {...globalConfig, props: {kind: 'human', color: 'red', emoji: '🪐'}}).text()).eq('🪐');
    const withImage = mount(LobbyAvatar, {...globalConfig, props: {kind: 'human', color: 'red', emoji: '🪐', image: 'data:image/png;base64,AA'}});
    expect(withImage.find('img').exists()).is.true;
  });

  it('LobbyGameRow shows title, one circle per seat with the host marked, and offers to join', async () => {
    const wrapper = mount(LobbyGameRow, {...globalConfig, props: {room: room([host, {kind: 'free'}, {kind: 'ai', aiLevel: 'hard'}])}});
    expect(wrapper.find('.lobby-game-title').text()).eq('Evening game');
    expect(wrapper.findAll('.lobby-game-seats .lobby-avatar')).has.length(3);
    expect(wrapper.findAll('.lobby-game-seats .lobby-avatar--free')).has.length(1);
    expect(wrapper.find('.lobby-avatar--host').exists()).is.true;
    expect(wrapper.find('.lobby-game-progress').exists()).is.false;
    await wrapper.find('.lobby-game-action button').trigger('click');
    expect(wrapper.emitted('join')).has.length(1);
  });

  it('LobbyGameRow shows generation, time played and the progress of a running game', () => {
    const running = room([host, {...host, host: false}], {state: 'started', spectatorId: 's1', progress: {generation: 7, terraforming: 0.5, playedMs: 72 * 60_000}});
    const wrapper = mount(LobbyGameRow, {...globalConfig, props: {room: running}});
    expect(wrapper.find('.lobby-game-facts').text()).contains('7').contains('1 h 12 min');
    expect(wrapper.find('.lobby-game-progress i').attributes('style')).contains('50%');
  });

  it('LobbyGameRow: removed twice asks to join, declined shows it instead of a button', () => {
    const asking = mount(LobbyGameRow, {...globalConfig, props: {room: room([host, {kind: 'free'}], {yourAccess: 'request'})}});
    expect(asking.find('.lobby-game-action').text()).contains('Ask to join');
    const declined = mount(LobbyGameRow, {...globalConfig, props: {room: room([host, {kind: 'free'}], {yourAccess: 'declined'})}});
    expect(declined.find('.lobby-game-action button').exists()).is.false;
    expect(declined.find('.lobby-game-declined').text()).eq('Declined by the host');
  });

  it('LobbyGameRow: own game set off, a click on the entry opens its dialog; games of others stay neutral', async () => {
    const own = mount(LobbyGameRow, {...globalConfig, props: {room: room([{...host, you: true}, {kind: 'free'}])}});
    expect(own.find('.lobby-game').classes()).contains('lobby-game--hosted');
    await own.find('.lobby-game-title').trigger('click');
    expect(own.emitted('open-room')).has.length(1);

    const joined = mount(LobbyGameRow, {...globalConfig, props: {room: room([host, {...host, host: false, you: true}, {kind: 'free'}])}});
    expect(joined.find('.lobby-game').classes()).not.contains('lobby-game--hosted');

    const others = mount(LobbyGameRow, {...globalConfig, props: {room: room([host, {kind: 'free'}])}});
    expect(others.find('.lobby-game').classes()).not.contains('lobby-game--hosted');
    await others.find('.lobby-game-title').trigger('click');
    expect(others.emitted('open-room')).is.undefined;
  });

  it('LobbyFilterPanel emits the changed filters', async () => {
    const wrapper = mount(LobbyFilterPanel, {...globalConfig, props: {modelValue: defaultLobbyFilters(), rooms: [room([host, {kind: 'free'}])]}});
    await wrapper.findAll('.create-game-chip')[0].trigger('click');
    const filters = wrapper.emitted('update:modelValue')?.[0]?.[0] as ReturnType<typeof defaultLobbyFilters>;
    expect(filters.sizes).deep.eq([2]);
  });

  it('lobby filters offer only what the listed games have, plus what is selected', () => {
    const open = room([host, {kind: 'free'}, {kind: 'free'}]);
    const full = room([host, {...host, host: false}], {setup: {...open.setup, expansions: {...open.setup.expansions, colonies: true}}});
    const choices = availableFilterChoices([open, full], {...defaultLobbyFilters(), sizes: [5]}, ['corpera', 'prelude', 'venus', 'colonies']);
    expect(choices.sizes).deep.eq([2, 3, 5]);
    expect(choices.expansions).deep.eq(['corpera', 'prelude', 'colonies']);
    expect(choices.drafts).deep.eq(['on']);
    expect(choices.tempos).deep.eq(['normal']);
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

  it('LobbyRoomDialog: the host can always start, also alone, without "Fill with AI"', () => {
    const alone = room([{...host, you: true}, {kind: 'free'}]);
    mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: alone}, attachTo: document.body});
    const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'));
    const start = buttons.find((button) => button.textContent?.includes('Start now'));
    expect(start?.disabled).is.false;
    expect(buttons.some((button) => button.textContent?.includes('Fill with AI'))).is.false;
  });

  it('LobbyRoomDialog: the host sets the strength of an AI player, the others only see it', async () => {
    const withAi = room([{...host, you: true}, {kind: 'ai', aiLevel: 'hard'}]);
    const wrapper = mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: withAi}, attachTo: document.body});
    const level = document.querySelector<HTMLSelectElement>('select.lobby-seat-level');
    expect(level?.value).eq('hard');
    expect(Array.from(level?.options ?? []).map((option) => option.textContent?.trim())).deep.eq(['[AI-] Easy', '[AI] Normal', '[AI+] Hard']);
    if (level !== null) {
      level.value = 'easy';
      level.dispatchEvent(new Event('change'));
    }
    expect(wrapper.emitted('ai-level')).deep.eq([[1, 'easy']]);
    wrapper.unmount();
    mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: room([host, {...host, host: false, you: true}, {kind: 'ai', aiLevel: 'hard'}])}, attachTo: document.body});
    expect(document.querySelector('.lobby-seat-level')).is.null;
  });

  it('LobbyRoomDialog: the host removes seats and decides on requests', async () => {
    const waiting = room([{...host, you: true}, {kind: 'ai', aiLevel: 'hard'}, {kind: 'free'}],
      {requests: [{participant: 'bobbobbobbobbob001', name: 'Bob', color: 'blue', emoji: '🪐'}]});
    const wrapper = mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: waiting}, attachTo: document.body});
    expect(document.querySelectorAll('.lobby-seat-remove')).has.length(1);
    document.querySelector<HTMLButtonElement>('.lobby-seat-remove')?.click();
    expect(wrapper.emitted('remove')).deep.eq([[1]]);
    expect(document.querySelector('.lobby-request-name')?.textContent).eq('Bob');
    Array.from(document.querySelectorAll<HTMLButtonElement>('.lobby-request button')).find((button) => button.textContent?.includes('Approve'))?.click();
    expect(wrapper.emitted('approve')).deep.eq([['bobbobbobbobbob001']]);
  });

  it('LobbyRoomDialog: the host copies the own link of a player entered by hand', () => {
    const waiting = room([{...host, you: true}, {kind: 'guest', name: 'Klaus', color: 'green', inviteToken: 'abc123abc123'}, {kind: 'free'}]);
    mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: waiting}, attachTo: document.body});
    expect(document.querySelector('.lobby-seat-link')?.textContent).contains('Copy link');
    // Waiting, there is nothing else to do with the link: no arrow
    expect(document.querySelector('.split-button-toggle')).is.null;
  });

  it('LobbyRoomDialog offers "Continue" instead of "Start now" once the game runs', async () => {
    const started = room([{...host, you: true}, {kind: 'guest', name: 'Dan', color: 'green', playerId: 'p2'}], {state: 'started', yourPlayerId: 'p1', spectatorId: 's1'});
    const wrapper = mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: started}, attachTo: document.body});
    expect(document.body.textContent).not.contains('Start now');
    const links = Array.from(document.body.querySelectorAll('.lobby-room-foot a')).map((link) => link.getAttribute('href'));
    expect(links).deep.eq(['player?id=p1']);
    // The host passes on the link of the player entered by hand; behind the arrow it opens here (several players at one device)
    expect(document.querySelector('.split-button-main')?.textContent).contains('Copy link');
    document.querySelector<HTMLButtonElement>('.split-button-toggle')?.click();
    await nextTick();
    expect(document.querySelector('.split-button-menu a')?.getAttribute('href')).contains('player?id=p2');
    // Spectators get their own link
    expect(document.querySelector<HTMLInputElement>('.lobby-invite input')?.value).contains('spectator?id=s1');
    wrapper.unmount();
  });

  it('LobbyRoomDialog disables "Seat an AI" for settings the AI cannot handle', () => {
    const withColonies = room([{...host, you: true}, {kind: 'free'}]);
    withColonies.setup.expansions = {...withColonies.setup.expansions, colonies: true};
    const wrapper = mount(LobbyRoomDialog, {...globalConfig, props: {open: true, room: withColonies}, attachTo: document.body});
    const disabled = Array.from(document.body.querySelectorAll('.lobby-room-dialog button[disabled]')).map((button) => button.textContent?.trim());
    expect(disabled).to.include.members(['Seat an AI']);
    wrapper.unmount();
  });

  it('chat: only 1 to 3 emojis count as an emoji message', () => {
    expect(isEmojiOnly('👍')).is.true;
    expect(isEmojiOnly(' 🎉 🚀 👍🏽 ')).is.true;
    expect(isEmojiOnly('👍👍👍👍')).is.false;
    expect(isEmojiOnly('ok 👍')).is.false;
    expect(isEmojiOnly('')).is.false;
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
