// Technical details sent with every feedback, so a bug can be reproduced: build, game state, browser, screen.
// Labels and words are English (the mail is English); the overlay shows them translated (FeedbackOverlay.vue).
import raw_settings from '@/genfiles/settings.json';
import {ViewModel} from '@/common/models/PlayerModel';
import {browserName, operatingSystem, shareableUrl, webglAvailable} from '@/client/utils/browserEnvironment';
import {FeedbackDiagnostic} from '@/common/feedback/FeedbackReport';
import {getPreferences} from '@/client/utils/PreferencesManager';
import {mobileLayout} from '@/client/utils/mobileLayout';
import {setupOptionsFromGame} from '@/common/game/GameSetupOptions';
import {splitAiMarker} from '@/common/ai/AiLevel';

/**
 * The two folded groups of the overlay, in this order. Players, board, expansions and settings are not among them:
 * the overlay shows them as player pills and setup chips (FeedbackGameSummary.vue); the mail lists every line.
 */
export const GAME_LABELS: ReadonlyArray<string> = ['Commit', 'URL', 'Game', 'Ruling party'];
export const DEVICE_LABELS: ReadonlyArray<string> = ['System', 'Viewport', 'Screen', 'View', 'WebGL', 'Touch', 'Local time', 'Language'];

export function linesInOrder(lines: ReadonlyArray<FeedbackDiagnostic>, labels: ReadonlyArray<string>): Array<FeedbackDiagnostic> {
  return labels.flatMap((label) => lines.filter((line) => line.label === label));
}

// Settings that are on, by their option names (the mail stays English; the overlay shows translated chips)
function settings(view: ViewModel): string {
  const options = setupOptionsFromGame(view.game.gameOptions);
  const named = Object.entries(options)
    .filter(([, value]) => value === true || (typeof value === 'number') || (typeof value === 'string' && value !== 'Standard' && value !== 'No randomization'))
    .map(([key, value]) => value === true ? key : `${key} ${value}`);
  return named.join(', ') || 'none';
}

function gameDetails(view: ViewModel): Array<FeedbackDiagnostic> {
  const game = view.game;
  const expansions = Object.entries(game.gameOptions.expansions)
    .filter(([, enabled]) => enabled === true)
    .map(([name]) => name)
    .join(', ');
  const aiCount = view.players.filter((player) => splitAiMarker(player.name).marker !== undefined).length;
  const players = view.players.map((player) => `${player.name} (${player.color})`).join(', ');
  const lines: Array<FeedbackDiagnostic> = [
    {label: 'Game', value: `Generation ${game.generation} · ${game.phase} · step ${game.step}`},
    {label: 'Player', value: view.thisPlayer ? `${view.thisPlayer.name} (${view.thisPlayer.color})` : 'spectator'},
    {label: 'Players', value: `${players} · ${view.players.length - aiCount} human, ${aiCount} AI`},
    {label: 'Board', value: game.gameOptions.boardName},
    {label: 'Expansions', value: expansions || 'none'},
    {label: 'Settings', value: settings(view)},
  ];
  if (game.turmoil) {
    lines.push({label: 'Ruling party', value: game.turmoil.ruling ?? 'none'});
  }
  return lines;
}

export function collectDiagnostics(view: ViewModel | undefined, now: Date = new Date()): Array<FeedbackDiagnostic> {
  const preferences = getPreferences();
  const timeZone = new Intl.DateTimeFormat().resolvedOptions().timeZone;
  return [
    {label: 'Commit', value: `${raw_settings.head} · built ${raw_settings.builtAt}`},
    {label: 'URL', value: shareableUrl(view).toString()},
    ...(view ? gameDetails(view) : []),
    {label: 'System', value: `${operatingSystem()} · ${browserName()}`},
    {label: 'WebGL', value: webglAvailable() ? 'active' : 'deactivated'},
    {label: 'Viewport', value: `${window.innerWidth} × ${window.innerHeight} px · pixel ratio ${window.devicePixelRatio}`},
    {label: 'Screen', value: `${window.screen.width} × ${window.screen.height} px`},
    {label: 'View', value: mobileLayout.value ? 'mobile' : 'desktop'},
    {label: 'Touch', value: navigator.maxTouchPoints > 0 ? 'yes' : 'no'},
    {label: 'Local time', value: `${now.toLocaleString('sv-SE')} · ${timeZone}`},
    {label: 'Language', value: `browser ${navigator.language} · game ${preferences.lang}`},
  ];
}
