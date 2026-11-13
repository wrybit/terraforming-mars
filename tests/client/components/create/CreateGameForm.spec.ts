import {mount, shallowMount} from '@vue/test-utils';
import {globalConfig} from '../getLocalVue';
import {expect} from 'chai';
import CreateGameForm from '@/client/components/create/CreateGameForm.vue';
import {createGameSettingsStorage} from '@/client/components/create/createGameSettingsStorage';
import {useFakeLocalStorage} from '../FakeLocalStorage';
import {BoardName} from '@/common/boards/BoardName';
import {RandomBoardOption} from '@/common/boards/RandomBoardOption';
import {boardOptions} from '@/common/boards/randomBoardOptions';
import {DEFAULT_EXPANSIONS} from '@/common/cards/GameModule';
import {JSONObject} from '@/common/Types';
import {defineComponent, nextTick} from 'vue';
import {NewGameConfig, NewPlayerModel} from '@/common/game/NewGameConfig';
import {CardName} from '@/common/cards/CardName';
import {CreateGameModel} from '@/client/components/create/CreateGameModel';
import {ValidationErrors} from '@/common/game/validateNewGameConfig';
import {ColonyName} from '@/common/colonies/ColonyName';
import {PreferencesManager} from '@/client/utils/PreferencesManager';
import {RandomMAOptionType} from '@/common/ma/RandomMAOptionType';
import {defaultCreateGameModel} from '@/client/components/create/defaultCreateGameModel';
import {readSettingsFromHash, settingsHash} from '@/client/components/create/settingsLink/settingsLinkHash';

// Minimal serialized Create Game payload used by settings restore tests.
function createNewGameConfig(overrides: JSONObject = {}):  NewGameConfig {
  // Not ideal but is fine for the tests.
  const config: Partial<NewGameConfig> = {
    players: [
      {name: 'Alice', color: 'red', beginner: false, handicap: 0, first: false},
      {name: 'Bob', color: 'blue', beginner: false, handicap: 0, first: true},
    ],
    expansions: DEFAULT_EXPANSIONS,
    boards: [BoardName.HELLAS],
    draftVariant: false,
    solarPhaseOption: true,
    ...overrides,
  };
  return config as NewGameConfig;
}

/*
 * Returns `count` distinct card names of any type.
 *
 * Suitable only for checks that count a list's cards.
 */
function cardNames(count: number): Array<CardName> {
  return Object.values(CardName).slice(0, count);
}

/*
 * Returns the validation errors for a two-player game after `setup` adjusts the form.
 */
function validateTwoPlayerGame(setup: (model: CreateGameModel) => void): ValidationErrors {
  const wrapper = shallowMount(CreateGameForm, {
    ...globalConfig,
  });
  const model = wrapper.vm as unknown as CreateGameModel;
  model.playersCount = 2;
  setup(model);
  return (wrapper.vm as any).validationErrors;
}

describe('CreateGameForm', () => {
  useFakeLocalStorage();

  beforeEach(() => {
    PreferencesManager.resetForTest();
    // Every unmounted form keeps its draft for the tab (createGameDraftStorage.ts); start each test without one
    sessionStorage.clear();
    // The form writes its settings into the URL hash; don't carry that into the next test
    window.history.replaceState(null, '', '/lobby/create');
  });

  afterEach(() => {
    // Specs share one environment (isolate: false); leave the URL as other specs expect it
    window.history.replaceState(null, '', '/');
  });

  it('mounts without errors', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    expect(wrapper.exists()).to.be.true;
  });

  it('lobby: the own seat is the host with a picture that goes along when the game is opened', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
      props: {lobbyProfile: {name: 'Jens', color: 'blue', emoji: '🌕'}},
    });
    const vm = wrapper.vm as any;
    expect(vm.isHostSeat(0)).is.true;
    expect(vm.isHostSeat(1)).is.false;
    expect(vm.hostEmoji).eq('🌕');
    vm.pickHostEmoji('🪐');
    vm.openInLobby();
    const request = (wrapper.emitted('open-in-lobby') as Array<Array<any>>)[0][0];
    expect(request.hostPicture).deep.eq({emoji: '🪐', image: undefined});
    expect(request.config.players[0].name).eq('Jens');
  });

  it('lobby: every change of the own seat goes to the lobby profile right away', async () => {
    const wrapper = shallowMount(CreateGameForm, {...globalConfig});
    const vm = wrapper.vm as any;
    vm.getPlayers()[0].name = 'Je';
    await nextTick();
    vm.getPlayers()[0].name = 'Jens';
    vm.pickHostEmoji('🪐');
    await nextTick();
    const profiles = (wrapper.emitted('host-profile') as Array<Array<any>>).map(([profile]) => profile);
    expect(profiles.map((profile) => profile.name)).deep.eq(['Je', 'Jens']);
    expect(profiles[1].emoji).eq('🪐');
  });

  it('switching on the first AI player makes it an analysis game', () => {
    const vm = shallowMount(CreateGameForm, {...globalConfig}).vm as any;
    vm.aiAnalysis = false;
    vm.aiPlayersCount = 0;
    vm.aiPlayersCount = 1;
    expect(vm.aiAnalysis).is.true;
    // Later changes keep the switch as the host left it
    vm.aiAnalysis = false;
    vm.aiPlayersCount = 2;
    expect(vm.aiAnalysis).is.false;
  });

  it('lobby, editing: the form starts from the waiting game', () => {
    const config = createNewGameConfig({players: [
      {name: 'Jens', color: 'red', beginner: false, handicap: 0, first: false},
      {name: 'Dan', color: 'green', beginner: false, handicap: 0, first: false},
      {name: '', color: 'blue', beginner: false, handicap: 0, first: false},
    ]});
    const vm = shallowMount(CreateGameForm, {...globalConfig, props: {editRoom: {title: 'Evening', listed: false, config, manualSeats: [1]}}}).vm as any;
    expect(vm.gameName).eq('Evening');
    expect(vm.lobbyPublic).is.false;
    expect(vm.playersCount).eq(3);
    expect(vm.createButtonTitle).eq('Save changes');
    expect(vm.getPlayers().map((player: any, index: number) => vm.isOfferedSeat(player, index))).deep.eq([false, false, true]);
  });

  it('lobby without a profile: the host picture is drawn at random', () => {
    const vm = shallowMount(CreateGameForm, {...globalConfig}).vm as any;
    expect(vm.hostEmoji).is.a('string').with.length.greaterThan(0);
  });

  it('adds AI players after the humans and keeps at most six players', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.humanPlayersCount = 2;
    vm.aiPlayersCount = 2;
    expect(vm.playersCount).eq(4);
    expect(vm.getPlayers().map((player: any) => player.aiLevel)).deep.eq([undefined, undefined, 'hard', 'hard']);

    // More humans: the AI row gives way
    vm.humanPlayersCount = 5;
    expect(vm.aiPlayersCount).eq(1);
    expect(vm.playersCount).eq(6);

    vm.aiPlayersCount = 0;
    expect(vm.getPlayers().every((player: any) => player.aiLevel === undefined)).is.true;
  });

  it('sends the starred player as first player', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.humanPlayersCount = 3;
    vm.randomFirstPlayer = false;
    vm.firstIndex = 2;
    const config = await vm.serializeSettings();
    expect(config.players.map((player: any) => player.first)).deep.eq([false, true, false]);
  });

  it('keeps new humans in front of the AI players', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.humanPlayersCount = 1;
    vm.aiPlayersCount = 1;
    vm.getPlayers()[1].name = 'Bot';
    vm.humanPlayersCount = 2;
    expect(vm.getPlayers().map((player: any) => player.aiLevel)).deep.eq([undefined, undefined, 'hard']);
    expect(vm.getPlayers()[2].name).eq('Bot');
  });

  it('switches the AI off for settings it cannot handle and names them', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.humanPlayersCount = 1;
    vm.aiPlayersCount = 2;
    vm.expansions.colonies = true;
    await wrapper.vm.$nextTick();
    expect(vm.aiPlayersCount).eq(0);
    expect(vm.aiBlockers).deep.eq(['Colonies']);
    expect(vm.aiBlockerChips.map((chip: any) => chip.label)).deep.eq(['Colonies']);
    // Warning box instead of the AI count
    expect(wrapper.find('.create-game-seat-warning').text()).contains('Colonies');

    vm.expansions.colonies = false;
    await wrapper.vm.$nextTick();
    expect(vm.aiBlockers).deep.eq([]);
    expect(wrapper.find('.create-game-seat-warning').exists()).is.false;
  });

  it('selecting an expansion also selects what part of it needs', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.toggleExpansion('community');
    expect(vm.expansions.community).eq(true);
    expect(vm.expansions.colonies).eq(true);
    expect(vm.expansions.turmoil).eq(true);
    // The needed expansion can still be switched off afterwards
    vm.toggleExpansion('colonies');
    expect(vm.expansions.colonies).eq(false);
    expect(vm.expansions.community).eq(true);
  });

  it('remembers the grouping of the expansions', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    (wrapper.vm as any).expansionGrouping = 'corporation';
    await nextTick();
    const again = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    expect((again.vm as any).expansionGrouping).eq('corporation');
  });

  it('random board is a switch: on draws from the official boards, off restores the chosen board', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.selectBoard(BoardName.ELYSIUM);
    await nextTick();
    expect(vm.boards).deep.eq([BoardName.ELYSIUM]);
    vm.randomBoard = true;
    expect(vm.boards).deep.eq(boardOptions(RandomBoardOption.OFFICIAL));
    expect(vm.randomBoardScope).eq('random official');
    vm.randomBoardScope = 'random all';
    expect(vm.boards).deep.eq(boardOptions(RandomBoardOption.ALL));
    await nextTick();
    vm.randomBoard = false;
    expect(vm.boards).deep.eq([BoardName.ELYSIUM]);
  });

  it('random board: chips add boards to the pool and take them out again', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.randomBoard = true;
    vm.selectBoard(BoardName.HOLLANDIA);
    expect(vm.boards).includes(BoardName.HOLLANDIA);
    expect(vm.randomBoardScope).eq('');
    vm.boards = [BoardName.HELLAS, BoardName.ELYSIUM];
    vm.selectBoard(BoardName.HELLAS);
    // The last board left is a fixed board again
    expect(vm.boards).deep.eq([BoardName.ELYSIUM]);
    expect(vm.randomBoard).is.false;
  });

  it('Dune theme plays on Arrakis with the covered expansions only; Mars restores the chosen board', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const vm = wrapper.vm as any;
    vm.selectBoard(BoardName.ELYSIUM);
    vm.setExpansion('venus', true);
    vm.setExpansion('prelude', true);
    await nextTick();
    vm.theme = 'dune';
    expect(vm.boards).deep.eq([BoardName.ARRAKIS_61]);
    expect(vm.expansions.venus).eq(false);
    expect(vm.expansions.prelude).eq(true);
    expect(vm.newGameConfig.theme).eq('dune');
    // Locked while Dune is chosen
    vm.toggleExpansion('colonies');
    expect(vm.expansions.colonies).eq(false);
    vm.theme = 'mars';
    expect(vm.boards).deep.eq([BoardName.ELYSIUM]);
    expect(vm.newGameConfig.theme).eq('mars');
  });

  it('prefers settings from the link hash over saved settings', async () => {
    createGameSettingsStorage.save(createNewGameConfig());
    const model = defaultCreateGameModel();
    model.playersCount = 3;
    model.players[0].name = 'Jens';
    model.boards = [BoardName.ELYSIUM];
    window.history.replaceState(null, '', '/lobby/create' + settingsHash(model));

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await nextTick();
    await nextTick();

    const vm = wrapper.vm as any;
    expect(vm.playersCount).eq(3);
    expect(vm.players[0].name).eq('Jens');
    expect(vm.boards).deep.eq([BoardName.ELYSIUM]);
  });

  it('writes the current settings into the link hash', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await nextTick();
    const vm = wrapper.vm as any;
    vm.boards = [BoardName.HELLAS];
    await nextTick();

    expect(readSettingsFromHash(window.location.hash)?.board).eq(BoardName.HELLAS);
  });

  it('remembers settings by default', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    expect((wrapper.vm as any).rememberSettings).is.true;
  });

  it('does not restore saved settings when remember is off', async () => {
    PreferencesManager.INSTANCE.set('remember_create_game_settings', false);
    createGameSettingsStorage.save(createNewGameConfig());

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).boards).deep.eq([BoardName.THARSIS]);
  });

  it('sends the selected player as first player', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });

    wrapper.vm.playersCount = 3;
    wrapper.vm.randomFirstPlayer = false;
    wrapper.vm.firstIndex = 2;

    const config = await wrapper.vm.serializeSettings();

    expect(config?.players.map((player: NewPlayerModel) => player.first)).deep.eq([false, true, false]);
  });

  it('restores the last saved game settings on load', async () => {
    createGameSettingsStorage.save(createNewGameConfig({
      expansions: {...DEFAULT_EXPANSIONS, venus: true},
    }));

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).playersCount).eq(2);
    expect((wrapper.vm as any).players[0].name).eq('Alice');
    expect((wrapper.vm as any).players[1].name).eq('Bob');
    expect((wrapper.vm as any).boards).deep.eq([BoardName.HELLAS]);
    expect((wrapper.vm as any).draftVariant).eq(false);
    expect((wrapper.vm as any).expansions.venus).eq(true);
    expect((wrapper.vm as any).solarPhaseOption).eq(true);
  });

  it('reopens a form closed without creating as it was left', async () => {
    const first = shallowMount(CreateGameForm, {...globalConfig});
    const vm = first.vm as any;
    vm.gameName = 'Red Planet';
    vm.lobbyPublic = false;
    vm.expansions.venus = true;
    vm.getPlayers()[0].name = 'Jens';
    await nextTick();
    first.unmount();
    // Closing returns to the lobby address (LobbyPage.vue); a settings link left in the URL would take precedence
    window.history.replaceState(null, '', '/lobby/create');

    const second = shallowMount(CreateGameForm, {...globalConfig});
    await nextTick();
    const reopened = second.vm as any;
    expect(reopened.gameName).eq('Red Planet');
    expect(reopened.lobbyPublic).is.false;
    expect(reopened.expansions.venus).is.true;
    expect(reopened.getPlayers()[0].name).eq('Jens');
  });

  it('keeps no draft after the game was opened', async () => {
    const first = shallowMount(CreateGameForm, {...globalConfig});
    (first.vm as any).gameName = 'Red Planet';
    (first.vm as any).openInLobby();
    first.unmount();

    const second = shallowMount(CreateGameForm, {...globalConfig});
    expect((second.vm as any).gameName).eq('');
  });

  it('finds the import field after restoring saved settings', async () => {
    // Restoring in created() once cached the empty pre-mount refs, so the file import failed
    createGameSettingsStorage.save(createNewGameConfig());

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).typedRefs().file).is.not.undefined;
    expect(() => (wrapper.vm as any).uploadSettings()).not.to.throw();
  });

  it('shows warnings when restoring saved settings', async () => {
    const alerts: Array<{title: string, message: string | {text: string}}> = [];
    const Root = defineComponent({
      components: {
        CreateGameForm,
      },
      template: '<CreateGameForm ref="form" />',
    });
    const wrapper = mount(Root, {
      ...globalConfig,
    });
    const form = wrapper.findComponent(CreateGameForm);
    (form.vm.$root as any).showAlert = (title: string, message: string | {text: string}) => {
      alerts.push({title, message});
    };

    createGameSettingsStorage.save(createNewGameConfig({
      customPreludes: ['Bad Prelude Name'],
    }));

    (form.vm as any).restoreLastSettings();
    await form.vm.$nextTick();

    expect(alerts).deep.eq([{
      title: 'Restore settings',
      message: {text: "Settings loaded with these warnings:\nUnknown card name 'Bad Prelude Name' in customPreludes"},
    }]);
  });

  it('resets the form and clears saved settings', async () => {
    createGameSettingsStorage.save(createNewGameConfig());

    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).boards).deep.eq([BoardName.HELLAS]);

    (wrapper.vm as any).resetSettings();
    await wrapper.vm.$nextTick();

    expect((wrapper.vm as any).boards).deep.eq([BoardName.THARSIS]);
    expect((wrapper.vm as any).draftVariant).eq(true);
    expect(createGameSettingsStorage.load()).eq(undefined);
    expect(wrapper.findAllComponents({name: 'AppButton'}).map((button) => button.props('title'))).includes('Reset');
  });

  it('clears uploading when applying settings throws', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });

    expect(() => (wrapper.vm as any).applySettings(createNewGameConfig({
      players: [
        {name: 'Alice', color: 'red', beginner: false, handicap: 0},
        {name: 'Bob', color: 'red', beginner: false, handicap: 0},
      ],
    }))).throws('Colors are duplicated');
    expect((wrapper.vm as any).uploading).eq(false);
  });

  it('saves current settings when the game is opened in the lobby', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    (wrapper.vm as any).playersCount = 2;
    (wrapper.vm as any).randomFirstPlayer = false;
    (wrapper.vm as any).players[0].name = 'Alice';
    (wrapper.vm as any).players[1].name = 'Bob';
    (wrapper.vm as any).boards = [BoardName.ELYSIUM];

    await (wrapper.vm as any).openInLobby();

    const savedSettings = createGameSettingsStorage.load();
    expect(savedSettings?.boards).deep.eq([BoardName.ELYSIUM]);
    expect((savedSettings?.players as Array<{name: string}>).map((player) => player.name)).deep.eq(['Alice', 'Bob']);
    expect(wrapper.emitted('open-in-lobby')).has.length(1);
  });
  it('offers the manual milestone segment only for manual milestones and awards', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const model = wrapper.vm as unknown as CreateGameModel;
    const values = () => (wrapper.vm as any).milestoneOptions.map((option: {value: string}) => option.value);
    expect(values()).not.to.include(RandomMAOptionType.MANUAL);

    model.randomMA = RandomMAOptionType.MANUAL;
    model.customMA = {milestones: ['Terraformer'], awards: ['Banker']};
    await nextTick();
    expect(values()).to.include(RandomMAOptionType.MANUAL);
    expect((wrapper.vm as any).isRandomMAEnabled()).is.false;
    expect((wrapper.vm as any).newGameConfig.customMA).deep.eq({milestones: ['Terraformer'], awards: ['Banker']});
  });

  it('leaving manual milestones and awards drops customMA', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const model = wrapper.vm as unknown as CreateGameModel;
    model.randomMA = RandomMAOptionType.MANUAL;
    model.customMA = {milestones: ['Terraformer'], awards: ['Banker']};
    await nextTick();

    model.randomMA = RandomMAOptionType.LIMITED;
    await nextTick();
    expect(model.customMA).is.undefined;
    expect((wrapper.vm as any).milestoneOptions.map((option: {value: string}) => option.value)).not.to.include(RandomMAOptionType.MANUAL);
  });

  it('solo games ignore the milestone and award settings', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const model = wrapper.vm as unknown as CreateGameModel;
    model.playersCount = 1;
    model.randomMA = RandomMAOptionType.MANUAL;
    model.customMA = {milestones: ['Terraformer'], awards: []};
    expect(wrapper.vm.hasBlockingValidationErrors).is.false;
    const config: NewGameConfig | undefined = await wrapper.vm.serializeSettings();
    expect(config?.randomMA).eq(RandomMAOptionType.NONE);
    expect(config?.customMA).is.undefined;
  });

  it('validates the form settings', () => {
    // Default: 4 starting corporations per player, so two players need 8
    expect(validateTwoPlayerGame((model) => model.customCorporations = cardNames(7)).notEnoughCorporations).eq(8);
    expect(validateTwoPlayerGame((model) => model.customCorporations = cardNames(8)).notEnoughCorporations).eq(0);
  });

  it('ignores unknown colony names when validating', () => {
    const errors = validateTwoPlayerGame((model) => model.customColonies = ['Unknown Colony' as ColonyName]);
    expect(errors.coloniesMissingExpansions).deep.eq([]);
  });

  it('validates hand-picked milestones and awards against the expansions', () => {
    const errors = validateTwoPlayerGame((model) => {
      model.randomMA = RandomMAOptionType.MANUAL;
      model.expansions.turmoil = false;
      model.customMA = {milestones: ['Terraformer'], awards: ['Banker', 'Politician']};
    });
    expect(errors.milestonesMissingExpansions).is.false;
    expect(errors.awardsMissingExpansions).is.true;
  });

  it('disables Open in lobby when there is a blocking error', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const createGameButton = () => wrapper.findAllComponents({name: 'AppButton'}).find((button) => button.props('title') === 'Open in lobby');
    expect(createGameButton()?.props('disabled')).is.false;
    expect(wrapper.findComponent({name: 'ValidationProblems'}).exists()).is.false;

    (wrapper.vm as any).playersCount = 2;
    (wrapper.vm as any).customCorporations = cardNames(3);
    await wrapper.vm.$nextTick();

    expect(createGameButton()?.props('disabled')).is.true;
    expect(wrapper.findComponent({name: 'ValidationProblems'}).exists()).is.true;
  });

  it('replaces a cleared escape velocity field with its default', async () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const model = wrapper.vm as unknown as CreateGameModel;
    model.playersCount = 2;
    model.escapeVelocityMode = true;
    model.escapeVelocityThreshold = 35;
    // A cleared number input binds as an empty string.
    model.escapeVelocityPeriod = '' as unknown as number;
    const config: NewGameConfig | undefined = await (wrapper.vm as any).serializeSettings();
    expect(config?.escapeVelocity).deep.eq({
      thresholdMinutes: 35,
      bonusSectionsPerAction: 2,
      penaltyPeriodMinutes: 2,
      penaltyVPPerPeriod: 1,
    });
  });

  it('offers Amazonis Planitia with the official boards in every build', () => {
    const wrapper = shallowMount(CreateGameForm, {
      ...globalConfig,
    });
    const groups = (wrapper.vm as any).boardGroups;
    expect(groups[0].boards).includes(BoardName.AMAZONIS_PLANITIA);
    expect(groups[1].boards).not.includes(BoardName.AMAZONIS_PLANITIA);
  });
});
