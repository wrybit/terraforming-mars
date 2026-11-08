import {ref} from 'vue';

// The dialogs of the setup menu (GameMenu.vue). Other parts of the page can ask for one, e.g. the lobby bar
// for the notification settings: the menu opens it as if it had been chosen there.

export type MenuDialog = 'language' | 'info' | 'help' | 'settings';

export const requestedMenuDialog = ref<MenuDialog | undefined>(undefined);

export function openMenuDialog(which: MenuDialog): void {
  requestedMenuDialog.value = which;
}
