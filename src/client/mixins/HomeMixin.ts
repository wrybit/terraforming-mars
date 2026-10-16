// Common code shared between PlayerHome and SpectatorHome:
// the keyboard shortcuts dialog ('?'), tile view cycling,
// and setting the document title on mount.
import {defineComponent} from 'vue';
import {GameModel} from '@/common/models/GameModel';
import {SpaceId} from '@/common/Types';
import {hotkeysAvailable} from '@/client/hotkeys/hotkeyAvailability';
import {hotkeyHelpOpen} from '@/client/hotkeys/hotkeyHelpState';
import {nextTileView, TileView} from '@/client/components/board/TileView';
import {gameDocumentTitle, TitleView} from '@/client/utils/documentTitle';
import {isTypingTarget} from '@/client/utils/typingTarget';

type DataModel = {
  tileView: TileView;
}

export const HomeMixin = defineComponent({
  name: 'HomeMixin',
  data(): DataModel {
    return {
      tileView: 'show',
    };
  },
  computed: {
    // Shared with the game menu entry (hotkeyHelpState.ts)
    keyboardShortcutOpened: {
      get(): boolean {
        return hotkeyHelpOpen.value;
      },
      set(open: boolean): void {
        hotkeyHelpOpen.value = open;
      },
    },
    // Consumers must define `game`.
    // eslint-disable-next-line vue/return-in-computed-property
    game(): GameModel {
      throw new Error('HomeMixin consumers must override the `game` computed property.');
    },
  },
  methods: {
    navigatePage(event: KeyboardEvent) {
      // Typing in a field ("?" in a text) must not open the help; no shortcuts without a keyboard (mobile view)
      if (isTypingTarget(event.target) || !hotkeysAvailable.value) {
        return;
      }
      // Most '?' are shifted, so the key is compared, not the modifiers. All other shortcuts: hotkeyDispatcher.ts
      if (event.key === '?') {
        event.preventDefault();
        this.keyboardShortcutOpened = !this.keyboardShortcutOpened;
      }
    },
    cycleTileView(): void {
      this.tileView = nextTileView(this.tileView);
    },
    // Consumers must set `ref="gameBoardView"` on their <GameBoardView> for this to have any effect.
    onSpaceClicked(spaceId: SpaceId): void {
      const gameBoardView = this.$refs.gameBoardView as {highlightSpace: (spaceId: SpaceId) => void} | undefined;
      gameBoardView?.highlightSpace(spaceId);
    },
  },
  mounted() {
    // Children (WaitingFor) are mounted before the parent; so set the same full title here.
    const props = this.$props as {playerView?: TitleView, spectator?: TitleView};
    document.title = gameDocumentTitle(props.playerView ?? props.spectator ?? {game: this.game});
    window.addEventListener('keydown', this.navigatePage);
  },
  unmounted() {
    window.removeEventListener('keydown', this.navigatePage);
  },
});
