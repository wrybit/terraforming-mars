// Whether the shortcut dialog is open: shared by the '?' key (HomeMixin.ts) and the entry in the game menu
// (GameMenu.vue), which lie in different components.
import {ref} from 'vue';

export const hotkeyHelpOpen = ref(false);
